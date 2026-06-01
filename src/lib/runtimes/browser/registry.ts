import type { BrowserModelEntry } from './types';
import { BROWSER_MODEL_PREFIX } from './types';

export const BROWSER_MODEL_ENTRIES: BrowserModelEntry[] = [
	{
		id: BROWSER_MODEL_PREFIX + 'mediapipe-Gemma3-1B',
		name: 'Gemma 3 1B (MediaPipe)',
		runtime: 'mediapipe',
		modelUrl: 'https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4-web.task',
		maxTokens: 1024,
		approxVramMb: 700
	},
	{
		id: BROWSER_MODEL_PREFIX + 'mediapipe-Gemma4-E2B',
		name: 'Gemma 4 E2B (MediaPipe)',
		runtime: 'mediapipe',
		modelUrl: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task',
		maxTokens: 1024,
		approxVramMb: 2000
	},
	{
		id: BROWSER_MODEL_PREFIX + 'mediapipe-Gemma4-E4B',
		name: 'Gemma 4 E4B (MediaPipe)',
		runtime: 'mediapipe',
		modelUrl: 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-web.task',
		maxTokens: 1024,
		approxVramMb: 3000
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Bonsai-1.7B-ONNX',
		name: 'Bonsai 1.7B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Bonsai-1.7B-ONNX',
		approxVramMb: 900
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-DeepSeek-R1-1.5B-Q4_K_M',
		name: 'DeepSeek R1 1.5B',
		runtime: 'wllama',
		hfRepo: 'bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 1000
	},
	{
		id: BROWSER_MODEL_PREFIX + 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
		name: 'DeepSeek R1 7B',
		runtime: 'webllm',
		mlcModelId: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
		approxVramMb: 5106
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Falcon-H1-Tiny-90M-Instruct-ONNX',
		name: 'Falcon H1 Tiny 90M',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Falcon-H1-Tiny-90M-Instruct-ONNX',
		approxVramMb: 100
	},
	{
		id: BROWSER_MODEL_PREFIX + 'gemma-2-2b-jpn-it-q4f16_1-MLC',
		name: 'Gemma 2 2B Japanese',
		runtime: 'webllm',
		mlcModelId: 'gemma-2-2b-jpn-it-q4f16_1-MLC',
		approxVramMb: 1882
	},
	{
		id: BROWSER_MODEL_PREFIX + 'gemma-4-E2B-it-ONNX',
		name: 'Gemma 4 E2B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/gemma-4-E2B-it-ONNX',
		approxVramMb: 1400,
		multimodal: true,
		vision: true
	},
	{
		id: BROWSER_MODEL_PREFIX + 'gemma-4-E4B-it-ONNX',
		name: 'Gemma 4 E4B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/gemma-4-E4B-it-ONNX',
		approxVramMb: 2600,
		multimodal: true,
		vision: true
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
		name: 'Hermes 3 Llama 3.2 3B',
		runtime: 'webllm',
		mlcModelId: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
		approxVramMb: 2952
	},
	{
		id: BROWSER_MODEL_PREFIX + 'LFM2.5-1.2B-Thinking-ONNX',
		name: 'LFM 2.5 1.2B Thinking',
		runtime: 'transformers',
		hfModelId: 'LiquidAI/LFM2.5-1.2B-Thinking-ONNX',
		approxVramMb: 700
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-Llama-3.2-1B-Q4_K_M',
		name: 'Llama 3.2 1B',
		runtime: 'wllama',
		hfRepo: 'bartowski/Llama-3.2-1B-Instruct-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 700
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.2 1B',
		runtime: 'webllm',
		mlcModelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
		approxVramMb: 879
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-Llama-3.2-3B-Q4_K_M',
		name: 'Llama 3.2 3B',
		runtime: 'wllama',
		hfRepo: 'bartowski/Llama-3.2-3B-Instruct-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 1900
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.2 3B',
		runtime: 'webllm',
		mlcModelId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
		approxVramMb: 2952
	},
	{
		id: BROWSER_MODEL_PREFIX + 'NVIDIA-Nemotron-3-Nano-4B-BF16-ONNX',
		name: 'Nemotron Nano 4B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/NVIDIA-Nemotron-3-Nano-4B-BF16-ONNX',
		approxVramMb: 2200
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		name: 'Phi-3.5 mini',
		runtime: 'webllm',
		mlcModelId: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		approxVramMb: 3672
	},
	// Phi-3.5-vision-instruct-q4f16_1-MLC omitted: compiled shape (embed[0]=1921)
	// is aspect-ratio-sensitive and breaks regardless of client-side resize.
	{
		id: BROWSER_MODEL_PREFIX + 'QED-Nano-ONNX',
		name: 'QED Nano',
		runtime: 'transformers',
		hfModelId: 'onnx-community/QED-Nano-ONNX',
		approxVramMb: 350
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen2-Math-1.5B-Instruct-q4f16_1-MLC',
		name: 'Qwen2 Math 1.5B',
		runtime: 'webllm',
		mlcModelId: 'Qwen2-Math-1.5B-Instruct-q4f16_1-MLC',
		approxVramMb: 1629
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
		name: 'Qwen2.5 Coder 1.5B',
		runtime: 'webllm',
		mlcModelId: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
		approxVramMb: 1629
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
		name: 'Qwen2.5 1.5B',
		runtime: 'webllm',
		mlcModelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
		approxVramMb: 1629
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-Qwen3-0.6B-Q4_K_M',
		name: 'Qwen3 0.6B',
		runtime: 'wllama',
		hfRepo: 'bartowski/Qwen_Qwen3-0.6B-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 400
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-Qwen3-1.7B-Q4_K_M',
		name: 'Qwen3 1.7B',
		runtime: 'wllama',
		hfRepo: 'bartowski/Qwen_Qwen3-1.7B-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 1100
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen3-1.7B-q4f16_1-MLC',
		name: 'Qwen3 1.7B',
		runtime: 'webllm',
		mlcModelId: 'Qwen3-1.7B-q4f16_1-MLC',
		approxVramMb: 1646
	},
	{
		id: BROWSER_MODEL_PREFIX + 'wllama-Qwen3-4B-Q4_K_M',
		name: 'Qwen3 4B',
		runtime: 'wllama',
		hfRepo: 'bartowski/Qwen_Qwen3-4B-GGUF',
		quant: 'Q4_K_M',
		approxVramMb: 2600
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen3.5-0.8B-ONNX',
		name: 'Qwen3.5 0.8B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Qwen3.5-0.8B-ONNX',
		approxVramMb: 600,
		multimodal: true
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen3.5-2B-ONNX',
		name: 'Qwen3.5 2B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Qwen3.5-2B-ONNX',
		approxVramMb: 1400,
		multimodal: true
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Qwen3.5-4B-ONNX',
		name: 'Qwen3.5 4B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Qwen3.5-4B-ONNX',
		approxVramMb: 2600,
		multimodal: true
	},
	{
		id: BROWSER_MODEL_PREFIX + 'SmolLM2-135M-Instruct-q0f16_1-MLC',
		name: 'SmolLM2 135M',
		runtime: 'webllm',
		mlcModelId: 'SmolLM2-135M-Instruct-q0f16_1-MLC',
		approxVramMb: 270
	},
	{
		id: BROWSER_MODEL_PREFIX + 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
		name: 'SmolLM2 1.7B',
		runtime: 'webllm',
		mlcModelId: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
		approxVramMb: 1773
	},
	{
		id: BROWSER_MODEL_PREFIX + 'Ternary-Bonsai-1.7B-ONNX',
		name: 'Ternary Bonsai 1.7B',
		runtime: 'transformers',
		hfModelId: 'onnx-community/Ternary-Bonsai-1.7B-ONNX',
		approxVramMb: 450,
		dtype: 'q2'
	},
	// ── LiteRT-LM ──────────────────────────────────────────────────────────────
	// Uses .litertlm files (distinct from the .task files used by MediaPipe).
	{
		id: BROWSER_MODEL_PREFIX + 'litert-Gemma4-E2B',
		name: 'Gemma 4 E2B (LiteRT)',
		runtime: 'litert',
		modelUrl: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm',
		maxNumTokens: 8192,
		approxVramMb: 2000
	},
	{
		id: BROWSER_MODEL_PREFIX + 'litert-Gemma4-E4B',
		name: 'Gemma 4 E4B (LiteRT)',
		runtime: 'litert',
		modelUrl: 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-web.litertlm',
		maxNumTokens: 8192,
		approxVramMb: 3000
	},
	// ── Chrome Prompt API ───────────────────────────────────────────────────────
	// Uses Chrome's built-in on-device model — no download required once Chrome
	// has the model. Only shown when LanguageModel is available in globalThis.
	{
		id: BROWSER_MODEL_PREFIX + 'prompt-api',
		name: 'Chrome Built-in AI',
		runtime: 'prompt-api',
		approxVramMb: 0
	}
];

const entriesById = new Map(BROWSER_MODEL_ENTRIES.map((e) => [e.id, e]));

const RUNTIME_DISPLAY_NAME: Record<string, string> = {
	webllm: 'WebLLM',
	transformers: 'Transformers.js',
	wllama: 'wllama',
	mediapipe: 'MediaPipe',
	litert: 'LiteRT-LM',
	'prompt-api': 'Chrome AI'
};

export const getBrowserModelEntry = (id: string): BrowserModelEntry | undefined =>
	entriesById.get(id);

export const browserModelsAsModels = () =>
	BROWSER_MODEL_ENTRIES.map((entry) => ({
		id: entry.id,
		name: entry.name,
		owned_by: 'openai' as const,
		openai: { id: entry.id },
		browser: true,
		tags: [
			{ name: 'browser' },
			{ name: RUNTIME_DISPLAY_NAME[entry.runtime] ?? entry.runtime }
		],
		info: {
			meta: {
				description: entry.runtime === 'prompt-api'
					? 'Uses Chrome\'s built-in on-device model. Requires Chrome 131+ with AI features enabled.'
					: `Runs entirely in your browser (~${entry.approxVramMb} MB VRAM). First use downloads the model; subsequent loads are cached.`,
				capabilities: {
					vision: entry.vision === true,
					usage: false,
					terminal: false,
					citations: false,
					code_interpreter: false
				}
			}
		}
	}));
