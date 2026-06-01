import { getBrowserModelEntry } from './registry';
import type { BrowserModelEntry, BrowserRuntimeId } from './types';
import type { BrowserChatOptions, BrowserRuntimeAdapter } from './adapters/shared';
import { webllmAdapter } from './adapters/webllm';
import { transformersAdapter } from './adapters/transformers';
import { wllamaAdapter } from './adapters/wllama';
import { mediapipeAdapter } from './adapters/mediapipe';
import { litertAdapter } from './adapters/litert';
import { promptApiAdapter } from './adapters/prompt-api';

// Re-exports — Chat.svelte and apis/index.ts only import from this barrel.
export { BROWSER_MODEL_ENTRIES, browserModelsAsModels, getBrowserModelEntry } from './registry';
export { isBrowserModelId, BROWSER_MODEL_PREFIX, WEBGPU_RUNTIMES } from './types';
export type { BrowserModelEntry, BrowserRuntimeId, WebLLMModelEntry, TransformersModelEntry, WllamaModelEntry, MediaPipeModelEntry, LiteRTModelEntry, PromptAPIModelEntry } from './types';
export type { BrowserChatOptions, BrowserRuntimeAdapter } from './adapters/shared';

// `satisfies` forces this map to cover every BrowserRuntimeId — adding a new
// runtime to the union without an adapter here becomes a compile error.
const ADAPTERS = {
	webllm: webllmAdapter,
	transformers: transformersAdapter,
	wllama: wllamaAdapter,
	mediapipe: mediapipeAdapter,
	litert: litertAdapter,
	'prompt-api': promptApiAdapter
} satisfies Record<BrowserRuntimeId, BrowserRuntimeAdapter<any>>;

function pickAdapter(entry: BrowserModelEntry): BrowserRuntimeAdapter<any> {
	return ADAPTERS[entry.runtime];
}

export async function browserChatCompletion(opts: BrowserChatOptions): Promise<void> {
	const entry = getBrowserModelEntry(opts.modelId);
	if (!entry) {
		opts.onError(new Error(`Unknown browser model: ${opts.modelId}`));
		return;
	}
	return pickAdapter(entry).chatCompletion(entry, opts);
}

export function interruptBrowserGeneration(): void {
	for (const adapter of Object.values(ADAPTERS)) {
		adapter.interrupt();
	}
}

