import { CreateWebWorkerMLCEngine, type WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import WebLLMWorker from '$lib/workers/webllm.worker?worker';

import { getBrowserModelEntry } from './registry';

export { BROWSER_MODEL_ENTRIES, browserModelsAsModels, getBrowserModelEntry } from './registry';
export { isBrowserModelId, BROWSER_MODEL_PREFIX } from './types';
export type { BrowserModelEntry, BrowserRuntimeId } from './types';

type ProgressCallback = (report: { progress: number; text: string }) => void;

let worker: Worker | null = null;
let engine: WebWorkerMLCEngine | null = null;
let loadedMlcModelId: string | null = null;
let loadInFlight: Promise<WebWorkerMLCEngine> | null = null;

const ensureEngine = async (
	mlcModelId: string,
	onProgress?: ProgressCallback
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

export interface BrowserChatOptions {
	modelId: string; // synthetic browser:... id
	messages: Array<{ role: string; content: any }>;
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	stop?: string[];
	stream?: boolean;
	onProgress?: ProgressCallback;
	onDelta: (chunk: any) => void; // OpenAI-shape streaming chunk
	onDone: (final: { usage?: any }) => void;
	onError: (err: unknown) => void;
	signal?: AbortSignal;
}

export async function browserChatCompletion(opts: BrowserChatOptions): Promise<void> {
	const entry = getBrowserModelEntry(opts.modelId);
	if (!entry) {
		opts.onError(new Error(`Unknown browser model: ${opts.modelId}`));
		return;
	}

	try {
		const eng = await ensureEngine(entry.mlcModelId, opts.onProgress);

		if (opts.signal?.aborted) {
			opts.onError(new DOMException('Aborted', 'AbortError'));
			return;
		}

		const sanitizedMessages = opts.messages.map((m) => ({
			role: m.role,
			content: typeof m.content === 'string' ? m.content : extractTextContent(m.content)
		}));

		const stream = await eng.chat.completions.create({
			messages: sanitizedMessages as any,
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
}

export function interruptBrowserGeneration(): void {
	try {
		engine?.interruptGenerate();
	} catch {
		/* noop */
	}
}

function extractTextContent(content: any): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) {
		return content
			.filter((part) => part?.type === 'text' && typeof part.text === 'string')
			.map((part) => part.text)
			.join('');
	}
	return '';
}
