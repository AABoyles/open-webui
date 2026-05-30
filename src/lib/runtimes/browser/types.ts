export type BrowserRuntimeId = 'webllm' | 'transformers' | 'wllama';
// Extended as adapters are added: 'webllm' | 'transformers' | 'wllama' | 'mediapipe'.

export const BROWSER_MODEL_PREFIX = 'browser:';

export const isBrowserModelId = (id: string | undefined | null): boolean =>
	typeof id === 'string' && id.startsWith(BROWSER_MODEL_PREFIX);

interface BaseEntry {
	id: string;
	name: string;
	approxVramMb: number;
	vision?: boolean;
}

export interface WebLLMModelEntry extends BaseEntry {
	runtime: 'webllm';
	mlcModelId: string;
	// Vision models compiled with a fixed shape need images capped at this dimension.
	maxImageDimension?: number;
}

export interface TransformersModelEntry extends BaseEntry {
	runtime: 'transformers';
	hfModelId: string;
	// true → AutoModelForImageTextToText + AutoProcessor (split-file repos like Gemma 4, Qwen3.5)
	// false/absent → AutoModelForCausalLM + AutoTokenizer (single model_q4.onnx repos)
	multimodal?: boolean;
	// ONNX quantization dtype passed to from_pretrained (default 'q4')
	dtype?: string;
}

export interface WllamaModelEntry extends BaseEntry {
	runtime: 'wllama';
	hfRepo: string;
	hfFile?: string;   // specific filename; if absent, quant auto-selects
	quant?: string;    // e.g. 'Q4_K_M' (default); ignored if hfFile is set
	contextSize?: number; // n_ctx passed to llama.cpp (default 4096)
}

// Discriminated union — extend with MediaPipeModelEntry when that adapter lands.
// TypeScript narrowing on `entry.runtime` gives each adapter the right per-runtime fields.
export type BrowserModelEntry = WebLLMModelEntry | TransformersModelEntry | WllamaModelEntry;
