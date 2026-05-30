import TransformersWorker from '$lib/workers/transformers.worker?worker';

import type { TransformersModelEntry } from '../types';
import { type BrowserChatOptions, type BrowserRuntimeAdapter, resolveImageUrls } from './shared';

type WorkerResponse =
	| { type: 'load_progress'; progress: number; text: string }
	| { type: 'load_done' }
	| { type: 'delta'; text: string }
	| { type: 'done'; usage: any }
	| { type: 'error'; message: string };

let worker: Worker | null = null;
let loadedModelId: string | null = null;
let loadedMultimodal: boolean | null = null;
let loadInFlight: Promise<void> | null = null;

function getWorker(): Worker {
	if (!worker) worker = new TransformersWorker();
	return worker;
}

function ensureModel(entry: TransformersModelEntry, onProgress?: BrowserChatOptions['onProgress']): Promise<void> {
	const { hfModelId, multimodal = false, dtype = 'q4' } = entry;
	if (loadedModelId === hfModelId && loadedMultimodal === multimodal) return Promise.resolve();
	if (loadInFlight) return loadInFlight;

	loadInFlight = new Promise<void>((resolve, reject) => {
		const w = getWorker();
		const handler = (event: MessageEvent<WorkerResponse>) => {
			const msg = event.data;
			if (msg.type === 'load_progress') {
				onProgress?.({ progress: msg.progress, text: msg.text });
			} else if (msg.type === 'load_done') {
				w.removeEventListener('message', handler);
				loadedModelId = hfModelId;
				loadedMultimodal = multimodal;
				resolve();
			} else if (msg.type === 'error') {
				w.removeEventListener('message', handler);
				reject(new Error(msg.message));
			}
		};
		w.addEventListener('message', handler);
		w.postMessage({ type: 'load', modelId: hfModelId, multimodal, dtype });
	}).finally(() => {
		loadInFlight = null;
	});

	return loadInFlight;
}

export const transformersAdapter: BrowserRuntimeAdapter<TransformersModelEntry> = {
	async chatCompletion(entry, opts) {
		try {
			await ensureModel(entry, opts.onProgress);

			if (opts.signal?.aborted) {
				opts.onError(new DOMException('Aborted', 'AbortError'));
				return;
			}

			// Resolve UUID image references to data URLs; for text-only models
			// this is a no-op (no image_url parts in messages).
			const messages = entry.multimodal
				? await resolveImageUrls(opts.messages)
				: opts.messages;

			await new Promise<void>((resolve, reject) => {
				const w = getWorker();

				const abortHandler = () => { w.postMessage({ type: 'interrupt' }); };
				opts.signal?.addEventListener('abort', abortHandler, { once: true });

				const handler = (event: MessageEvent<WorkerResponse>) => {
					const msg = event.data;
					if (msg.type === 'delta') {
						opts.onDelta({
							id: `transformers-${Date.now()}`,
							object: 'chat.completion.chunk',
							choices: [{ index: 0, delta: { content: msg.text }, finish_reason: null }]
						});
					} else if (msg.type === 'done') {
						opts.signal?.removeEventListener('abort', abortHandler);
						w.removeEventListener('message', handler);
						opts.onDone({ usage: msg.usage });
						resolve();
					} else if (msg.type === 'error') {
						opts.signal?.removeEventListener('abort', abortHandler);
						w.removeEventListener('message', handler);
						reject(new Error(msg.message));
					}
				};

				w.addEventListener('message', handler);
				w.postMessage({
					type: 'generate',
					messages,
					temperature: opts.temperature,
					top_p: opts.top_p,
					max_new_tokens: opts.max_tokens
				});
			});
		} catch (err) {
			opts.onError(err);
		}
	},

	interrupt() {
		worker?.postMessage({ type: 'interrupt' });
	}
};
