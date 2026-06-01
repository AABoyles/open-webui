import type { PromptAPIModelEntry } from '../types';
import { type BrowserChatOptions, type BrowserRuntimeAdapter, extractTextContent } from './shared';

// Chrome's LanguageModel global — no npm package, accessed via globalThis.
function getLanguageModel(): any {
	return (globalThis as any).LanguageModel;
}

let activeSession: any = null;

export const promptApiAdapter: BrowserRuntimeAdapter<PromptAPIModelEntry> = {
	async chatCompletion(_entry, opts) {
		const LanguageModel = getLanguageModel();
		if (!LanguageModel) {
			opts.onError(
				new Error(
					'Chrome Prompt API (LanguageModel) is not available in this browser. ' +
					'Enable it at chrome://flags/#optimization-guide-on-device-model, or use Chrome 131+.'
				)
			);
			return;
		}

		try {
			const systemMsgs = opts.messages.filter((m) => m.role === 'system');
			const chatMsgs = opts.messages.filter((m) => m.role !== 'system');
			const lastMsg = chatMsgs[chatMsgs.length - 1];
			const history = chatMsgs.slice(0, -1);

			const session = await LanguageModel.create({
				initialPrompts: systemMsgs.map((m) => ({
					role: 'system',
					content: extractTextContent(m.content)
				})),
				// Report model download progress (fires only on first download in Chrome).
				monitor(m: any) {
					m.addEventListener('downloadprogress', (e: any) => {
						opts.onProgress?.({
							progress: e.loaded ?? 0,
							text: `Downloading… ${Math.round((e.loaded ?? 0) * 100)}%`
						});
					});
				},
				signal: opts.signal
			});
			activeSession = session;

			try {
				// Replay prior conversation turns so the session has full context.
				if (history.length > 0) {
					await session.append(
						history.map((m) => ({
							role: m.role === 'assistant' ? 'assistant' : 'user',
							content: extractTextContent(m.content)
						})),
						{ signal: opts.signal }
					);
				}

				if (opts.signal?.aborted) {
					opts.onDone({});
					return;
				}

				// promptStreaming yields incremental (delta) text chunks per the spec.
				const stream = session.promptStreaming(extractTextContent(lastMsg.content), {
					signal: opts.signal
				});
				const reader = (stream as ReadableStream<string>).getReader();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						if (value) {
							opts.onDelta({
								id: `prompt-api-${Date.now()}`,
								object: 'chat.completion.chunk',
								choices: [{ index: 0, delta: { content: value }, finish_reason: null }]
							});
						}
					}
				} finally {
					reader.releaseLock();
				}

				opts.onDone({});
			} finally {
				session.destroy();
				if (activeSession === session) activeSession = null;
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
		try { activeSession?.destroy(); } catch { /* noop */ }
	}
};
