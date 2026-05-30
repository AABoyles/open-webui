import { CreateWebWorkerMLCEngine, type WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import WebLLMWorker from '$lib/workers/webllm.worker?worker';

import type { WebLLMModelEntry } from '../types';
import {
	type BrowserChatOptions,
	type BrowserRuntimeAdapter,
	sanitizeMessages,
	resolveImageUrls
} from './shared';

let worker: Worker | null = null;
let engine: WebWorkerMLCEngine | null = null;
let loadedMlcModelId: string | null = null;
let loadInFlight: Promise<WebWorkerMLCEngine> | null = null;

function resizeDataUrl(dataUrl: string, maxDimension: number): Promise<string> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
			if (scale >= 1) { resolve(dataUrl); return; }
			const canvas = document.createElement('canvas');
			// Use floor so the longer side never rounds up past maxDimension.
			canvas.width = Math.floor(img.width * scale);
			canvas.height = Math.floor(img.height * scale);
			canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
			resolve(canvas.toDataURL('image/jpeg', 0.92));
		};
		img.src = dataUrl;
	});
}

async function resizeMessageImages(
	messages: Array<{ role: string; content: any }>,
	maxDimension: number
): Promise<Array<{ role: string; content: any }>> {
	return Promise.all(
		messages.map(async (msg) => {
			if (!Array.isArray(msg.content)) return msg;
			const content = await Promise.all(
				msg.content.map(async (part: any) => {
					if (part.type !== 'image_url' || !part.image_url?.url?.startsWith('data:')) return part;
					return { ...part, image_url: { url: await resizeDataUrl(part.image_url.url, maxDimension) } };
				})
			);
			return { ...msg, content };
		})
	);
}

const ensureEngine = async (
	mlcModelId: string,
	onProgress?: BrowserChatOptions['onProgress']
): Promise<WebWorkerMLCEngine> => {
	if (engine && loadedMlcModelId === mlcModelId) return engine;
	if (loadInFlight) return loadInFlight;

	loadInFlight = (async () => {
		if (!worker) worker = new WebLLMWorker();

		if (engine && loadedMlcModelId !== mlcModelId) {
			await engine.reload(mlcModelId);
			loadedMlcModelId = mlcModelId;
			return engine;
		}

		engine = await CreateWebWorkerMLCEngine(worker, mlcModelId, {
			initProgressCallback: (report) => onProgress?.(report)
		});
		loadedMlcModelId = mlcModelId;
		return engine;
	})();

	try {
		return await loadInFlight;
	} finally {
		loadInFlight = null;
	}
};

export const webllmAdapter: BrowserRuntimeAdapter<WebLLMModelEntry> = {
	async chatCompletion(entry, opts) {
		try {
			const eng = await ensureEngine(entry.mlcModelId, opts.onProgress);

			if (opts.signal?.aborted) {
				opts.onError(new DOMException('Aborted', 'AbortError'));
				return;
			}

			let messages = entry.vision
				? await resolveImageUrls(opts.messages)
				: sanitizeMessages(opts.messages);
			if (entry.vision && entry.maxImageDimension) {
				messages = await resizeMessageImages(messages, entry.maxImageDimension);
			}

			const stream = await eng.chat.completions.create({
				messages: messages as any,
				stream: true,
				stream_options: { include_usage: true },
				temperature: opts.temperature,
				top_p: opts.top_p,
				max_tokens: opts.max_tokens,
				stop: opts.stop
			});

			let lastUsage: any = undefined;
			for await (const chunk of stream as AsyncIterable<any>) {
				if (opts.signal?.aborted) {
					try {
						eng.interruptGenerate();
					} catch {
						/* noop */
					}
					break;
				}
				if (chunk?.usage) lastUsage = chunk.usage;
				opts.onDelta(chunk);
			}

			opts.onDone({ usage: lastUsage });
		} catch (err) {
			opts.onError(err);
		}
	},

	interrupt() {
		try {
			engine?.interruptGenerate();
		} catch {
			/* noop */
		}
	}
};
