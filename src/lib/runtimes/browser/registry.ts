import type { BrowserModelEntry } from './types';
import { BROWSER_MODEL_PREFIX } from './types';

export const BROWSER_MODEL_ENTRIES: BrowserModelEntry[] = [
	{
		id: BROWSER_MODEL_PREFIX + 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.2 1B (browser)',
		runtime: 'webllm',
		mlcModelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
		approxVramMb: 879
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.2 3B (browser)',
		runtime: 'webllm',
		mlcModelId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
		approxVramMb: 2952
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
		name: 'Qwen 2.5 1.5B (browser)',
		runtime: 'webllm',
		mlcModelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
		approxVramMb: 1629
	},
	{
		id: BROWSER_MODEL_PREFIX + 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
		name: 'SmolLM2 1.7B (browser)',
		runtime: 'webllm',
		mlcModelId: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
		approxVramMb: 1773
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		name: 'Phi-3.5 mini (browser)',
		runtime: 'webllm',
		mlcModelId: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		approxVramMb: 3672
	}
];

const entriesById = new Map(BROWSER_MODEL_ENTRIES.map((e) => [e.id, e]));

export const getBrowserModelEntry = (id: string): BrowserModelEntry | undefined =>
	entriesById.get(id);

export const browserModelsAsModels = () =>
	BROWSER_MODEL_ENTRIES.map((entry) => ({
		id: entry.id,
		name: entry.name,
		owned_by: 'openai' as const,
		openai: { id: entry.id },
		browser: true,
		info: {
			meta: {
				description: `Runs entirely in your browser via WebLLM (~${entry.approxVramMb} MB VRAM). First use downloads the model; subsequent loads are cached.`,
				capabilities: {
					vision: false,
					usage: false,
					terminal: false,
					citations: false,
					code_interpreter: false
				}
			}
		}
	}));
