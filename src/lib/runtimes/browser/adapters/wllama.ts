import { Wllama } from '@wllama/wllama';
import wllamaWasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url';

import type { WllamaModelEntry } from '../types';
import { type BrowserChatOptions, type BrowserRuntimeAdapter, sanitizeMessages } from './shared';

let instance: Wllama | null = null;
let loadedEntryId: string | null = null;
let loadInFlight: Promise<void> | null = null;
let activeAbortController: AbortController | null = null;

function createInstance(): Wllama {
	return new Wllama({ default: wllamaWasmUrl });
}

async function ensureModel(
	entry: WllamaModelEntry,
	onProgress?: BrowserChatOptions['onProgress']
): Promise<void> {
	if (loadedEntryId === entry.id) return;
	if (loadInFlight) return loadInFlight;

	loadInFlight = (async () => {
		if (instance) {
			await instance.exit().catch(() => {});
			instance = null;
		}

		instance = createInstance();

		await instance.loadModelFromHF(
			{
				repo: entry.hfRepo,
				...(entry.hfFile ? { file: entry.hfFile } : { quant: entry.quant ?? 'Q4_K_M' })
			},
			{
				n_ctx: entry.contextSize ?? 4096,
				progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
					onProgress?.({
						progress: total > 0 ? loaded / total : 0,
						text: 'Downloading…'
					});
				}
			}
		);

		loadedEntryId = entry.id;
		const backend = instance.isSupportWebGPU() ? 'WebGPU' : 'CPU';
		onProgress?.({ progress: 1, text: `Ready (${backend})` });
	})();

	try {
		return await loadInFlight;
	} finally {
		loadInFlight = null;
	}
}

export const wllamaAdapter: BrowserRuntimeAdapter<WllamaModelEntry> = {
	async chatCompletion(entry, opts) {
		try {
			await ensureModel(entry, opts.onProgress);

			if (opts.signal?.aborted) {
				opts.onError(new DOMException('Aborted', 'AbortError'));
				return;
			}

			if (!instance) {
				opts.onError(new Error('Model not loaded'));
				return;
			}

			// Combine the caller's signal with our own controller so interruptBrowserGeneration() works too.
			const abortController = new AbortController();
			activeAbortController = abortController;
			opts.signal?.addEventListener('abort', () => abortController.abort(), { once: true });

			const sanitized = sanitizeMessages(opts.messages);

			const stream = await (instance as any).createChatCompletion({
				messages: sanitized,
				temperature: opts.temperature,
				max_tokens: opts.max_tokens,
				stream: true,
				abortSignal: abortController.signal
			});

			let lastUsage: any;
			for await (const chunk of stream as AsyncIterable<any>) {
				opts.onDelta(chunk);
				if (chunk?.usage) lastUsage = chunk.usage;
			}

			opts.onDone({ usage: lastUsage });
		} catch (err: any) {
			// wllama throws WllamaAbortError on abort — treat as clean stop, not an error.
			if (err?.name === 'AbortError' || err?.name === 'WllamaAbortError') {
				opts.onDone({});
			} else {
				opts.onError(err);
			}
		} finally {
			activeAbortController = null;
		}
	},

	interrupt() {
		activeAbortController?.abort();
	}
};
