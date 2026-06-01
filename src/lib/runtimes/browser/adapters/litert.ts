import type { Engine, Conversation } from '@litert-lm/core';

import type { LiteRTModelEntry } from '../types';
import { type BrowserChatOptions, type BrowserRuntimeAdapter, sanitizeMessages } from './shared';

// WASM files served from the CDN at the installed package version.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@litert-lm/core@0.12.1/wasm/';

let engine: Engine | null = null;
let loadedModelUrl: string | null = null;
let loadInFlight: Promise<Engine> | null = null;
let activeConversation: Conversation | null = null;

// loadLiteRtLm only needs to run once per page load.
let wasmReady: Promise<void> | null = null;

async function ensureWasm(loadLiteRtLm: (path: string) => Promise<unknown>): Promise<void> {
	if (!wasmReady) wasmReady = loadLiteRtLm(WASM_BASE).then(() => {});
	return wasmReady;
}

async function ensureEngine(
	entry: LiteRTModelEntry,
	onProgress?: BrowserChatOptions['onProgress']
): Promise<Engine> {
	if (engine && loadedModelUrl === entry.modelUrl) return engine;
	if (loadInFlight) return loadInFlight;

	loadInFlight = (async () => {
		if (engine) {
			await engine.delete().catch(() => {});
			engine = null;
			loadedModelUrl = null;
		}

		if (!(navigator as any)?.gpu) {
			throw new Error(
				'WebGPU is not available. LiteRT-LM models require WebGPU — ' +
				'use Chrome 113+ over HTTPS or localhost.'
			);
		}

		onProgress?.({ progress: 0, text: 'Loading model…' });

		// Dynamic import avoids SSR and defers Vite pre-bundling of the WASM package.
		const { loadLiteRtLm, Engine } = await import('@litert-lm/core');
		await ensureWasm(loadLiteRtLm);

		const eng = await Engine.create({
			model: entry.modelUrl,
			mainExecutorSettings: { maxNumTokens: entry.maxNumTokens ?? 8192 }
		});

		engine = eng;
		loadedModelUrl = entry.modelUrl;
		onProgress?.({ progress: 1, text: 'Ready (WebGPU)' });
		return eng;
	})();

	try {
		return await loadInFlight;
	} finally {
		loadInFlight = null;
	}
}

export const litertAdapter: BrowserRuntimeAdapter<LiteRTModelEntry> = {
	async chatCompletion(entry, opts) {
		try {
			const eng = await ensureEngine(entry, opts.onProgress);

			if (opts.signal?.aborted) {
				opts.onError(new DOMException('Aborted', 'AbortError'));
				return;
			}

			const sanitized = sanitizeMessages(opts.messages);
			// Pass all prior turns as preface so the engine has full conversation context;
			// then stream only the final user message.
			const lastMsg = sanitized[sanitized.length - 1];
			const history = sanitized.slice(0, -1);

			const conversation = await eng.createConversation(
				history.length > 0
					? { preface: { messages: history.map((m) => ({ role: m.role, content: m.content })) } }
					: undefined
			);
			activeConversation = conversation;

			const abortHandler = () => {
				try { conversation.cancel(); } catch { /* noop */ }
			};
			opts.signal?.addEventListener('abort', abortHandler, { once: true });

			try {
				const stream = conversation.sendMessageStreaming(lastMsg.content);
				const reader = stream.getReader();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						// Each Message chunk carries text in content — either a plain string
						// or an array of MessageContentItems with type/text fields.
						const text =
							typeof value.content === 'string'
								? value.content
								: Array.isArray(value.content)
									? (value.content as Array<{ type: string; text?: string }>)
											.filter((c) => c.type === 'text')
											.map((c) => c.text ?? '')
											.join('')
									: '';
						if (text) {
							opts.onDelta({
								id: `litert-${Date.now()}`,
								object: 'chat.completion.chunk',
								choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
							});
						}
					}
				} finally {
					reader.releaseLock();
				}
				opts.onDone({});
			} finally {
				opts.signal?.removeEventListener('abort', abortHandler);
				await conversation.delete().catch(() => {});
				if (activeConversation === conversation) activeConversation = null;
			}
		} catch (err: any) {
			if (err?.name === 'AbortError') {
				opts.onDone({});
			} else {
				opts.onError(err);
			}
		}
	},

	interrupt() {
		try { activeConversation?.cancel(); } catch { /* noop */ }
	}
};
