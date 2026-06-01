import type { LlmInference } from '@mediapipe/tasks-genai';

import type { MediaPipeModelEntry } from '../types';
import { type BrowserChatOptions, type BrowserRuntimeAdapter, sanitizeMessages } from './shared';

// Served from the CDN at the exact version installed in package.json.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.27/wasm';

let instance: LlmInference | null = null;
let loadedEntryId: string | null = null;
let loadInFlight: Promise<LlmInference> | null = null;

async function ensureModel(
	entry: MediaPipeModelEntry,
	onProgress?: BrowserChatOptions['onProgress']
): Promise<LlmInference> {
	if (instance && loadedEntryId === entry.id) return instance;
	if (loadInFlight) return loadInFlight;

	loadInFlight = (async () => {
		if (instance) {
			try { instance.close(); } catch { /* noop */ }
			instance = null;
			loadedEntryId = null;
		}

		if (!(navigator as any)?.gpu) {
			throw new Error(
				'WebGPU is not available. MediaPipe models require WebGPU — ' +
				'use Chrome 113+ over HTTPS or localhost.'
			);
		}

		onProgress?.({ progress: 0, text: 'Loading model…' });

		// Dynamic import keeps this bundle out of SSR and avoids Vite pre-bundling
		// the MediaPipe CJS shim, which would break navigator.gpu access.
		const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

		const genai = await FilesetResolver.forGenAiTasks(WASM_BASE);

		const llm = await LlmInference.createFromOptions(genai, {
			baseOptions: { modelAssetPath: entry.modelUrl },
			maxTokens: entry.maxTokens ?? 1024,
			topK: entry.topK ?? 40
		});

		instance = llm;
		loadedEntryId = entry.id;
		onProgress?.({ progress: 1, text: 'Ready (WebGPU)' });
		return llm;
	})();

	try {
		return await loadInFlight;
	} finally {
		loadInFlight = null;
	}
}

/**
 * Formats OpenAI-style messages into the Gemma instruct prompt format.
 * System messages are folded into the first user turn.
 */
function buildGemmaPrompt(messages: Array<{ role: string; content: string }>): string {
	let systemText = '';
	const turns: Array<{ role: string; content: string }> = [];

	for (const msg of messages) {
		if (msg.role === 'system') {
			systemText += (systemText ? '\n\n' : '') + msg.content;
		} else {
			turns.push(msg);
		}
	}

	let prompt = '';
	for (let i = 0; i < turns.length; i++) {
		const msg = turns[i];
		if (msg.role === 'user') {
			const body = i === 0 && systemText ? `${systemText}\n\n${msg.content}` : msg.content;
			prompt += `<start_of_turn>user\n${body}<end_of_turn>\n`;
		} else if (msg.role === 'assistant') {
			prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
		}
	}
	// Open the model's next turn for the LLM to continue.
	prompt += '<start_of_turn>model\n';
	return prompt;
}

export const mediapipeAdapter: BrowserRuntimeAdapter<MediaPipeModelEntry> = {
	async chatCompletion(entry, opts) {
		try {
			const llm = await ensureModel(entry, opts.onProgress);

			if (opts.signal?.aborted) {
				opts.onError(new DOMException('Aborted', 'AbortError'));
				return;
			}

			const sanitized = sanitizeMessages(opts.messages);
			const prompt = buildGemmaPrompt(sanitized);

			await new Promise<void>((resolve, reject) => {
				const abortHandler = () => {
					try { llm.cancelProcessing(); } catch { /* noop */ }
				};
				opts.signal?.addEventListener('abort', abortHandler, { once: true });

				llm.generateResponse(prompt, (partialResult: string, done: boolean) => {
					if (partialResult) {
						opts.onDelta({
							id: `mediapipe-${Date.now()}`,
							object: 'chat.completion.chunk',
							choices: [{ index: 0, delta: { content: partialResult }, finish_reason: null }]
						});
					}
					if (done) {
						opts.signal?.removeEventListener('abort', abortHandler);
						opts.onDone({});
						resolve();
					}
				}).catch((err: unknown) => {
					opts.signal?.removeEventListener('abort', abortHandler);
					reject(err);
				});
			});
		} catch (err: any) {
			if (err?.name === 'AbortError') {
				opts.onDone({});
			} else {
				opts.onError(err);
			}
		}
	},

	interrupt() {
		try {
			instance?.cancelProcessing();
		} catch {
			/* noop */
		}
	}
};
