import {
	AutoProcessor,
	AutoTokenizer,
	AutoModelForCausalLM,
	AutoModelForImageTextToText,
	TextStreamer,
	RawImage,
	type PreTrainedModel
} from '@huggingface/transformers-v4';

type ContentPart =
	| { type: 'text'; text: string }
	| { type: 'image_url'; image_url: { url: string } };

type Message = { role: string; content: string | ContentPart[] };

type LoadRequest = {
	type: 'load';
	modelId: string;
	multimodal: boolean;
	dtype: string;
};

type GenerateRequest = {
	type: 'generate';
	messages: Message[];
	temperature?: number;
	top_p?: number;
	max_new_tokens?: number;
};

type InterruptRequest = { type: 'interrupt' };

type WorkerRequest = LoadRequest | GenerateRequest | InterruptRequest;

let loadedModelId: string | null = null;
let loadedMultimodal: boolean | null = null;
let processor: any = null;   // AutoProcessor — multimodal path
let tokenizer: any = null;   // AutoTokenizer — text-only path
let model: PreTrainedModel | null = null;
let loadInFlight: Promise<void> | null = null;
let interrupted = false;

async function load(modelId: string, multimodal: boolean, dtype: string) {
	if (loadedModelId === modelId && loadedMultimodal === multimodal) {
		self.postMessage({ type: 'load_done' });
		return;
	}

	const progressCb = (report: any) => {
		self.postMessage({ type: 'load_progress', progress: report.progress ?? 0, text: report.file ?? '' });
	};

	self.postMessage({ type: 'load_progress', progress: 0, text: 'Loading…' });

	if (multimodal) {
		processor = await AutoProcessor.from_pretrained(modelId, { progress_callback: progressCb });
		model = await AutoModelForImageTextToText.from_pretrained(modelId, {
			dtype: dtype as any,
			device: 'auto',
			progress_callback: progressCb
		});
	} else {
		tokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback: progressCb });
		model = await AutoModelForCausalLM.from_pretrained(modelId, {
			dtype: dtype as any,
			device: 'auto',
			progress_callback: progressCb
		});
	}

	loadedModelId = modelId;
	loadedMultimodal = multimodal;
	self.postMessage({ type: 'load_done' });
}

// Converts image_url parts to RawImage objects and rewrites content to {type:'image'}
// so Gemma/Qwen chat templates insert the correct placeholder tokens.
async function prepareForProcessor(
	messages: Message[]
): Promise<{ converted: any[]; images: RawImage[] }> {
	const images: RawImage[] = [];
	const converted = await Promise.all(
		messages.map(async (msg) => {
			if (!Array.isArray(msg.content)) return msg;
			const content = await Promise.all(
				msg.content.map(async (part) => {
					if (part.type === 'image_url' && part.image_url?.url) {
						images.push(await RawImage.fromURL(part.image_url.url));
						return { type: 'image' };
					}
					return part;
				})
			);
			return { ...msg, content };
		})
	);
	return { converted, images };
}

async function generate(req: GenerateRequest) {
	if (!model) {
		self.postMessage({ type: 'error', message: 'Model not loaded' });
		return;
	}

	interrupted = false;

	let inputs: any;
	const activeTokenizer = loadedMultimodal ? processor.tokenizer : tokenizer;

	if (loadedMultimodal) {
		const { converted, images } = await prepareForProcessor(req.messages);
		const text: string = processor.apply_chat_template(converted, {
			add_generation_prompt: true,
			tokenize: false
		});
		inputs = await processor(text, images.length > 0 ? images : null);
	} else {
		const text: string = (tokenizer as any).apply_chat_template(req.messages, {
			add_generation_prompt: true,
			tokenize: false
		});
		inputs = tokenizer(text);
	}

	const streamer = new TextStreamer(activeTokenizer, {
		skip_prompt: true,
		skip_special_tokens: true,
		callback_function: (t: string) => {
			self.postMessage({ type: 'delta', text: t });
		}
	});

	try {
		const output = await (model as any).generate({
			...inputs,
			max_new_tokens: req.max_new_tokens ?? 2048,
			temperature: req.temperature,
			top_p: req.top_p,
			do_sample: req.temperature != null && req.temperature > 0,
			streamer,
			stopping_criteria: [() => interrupted]
		});

		const inputLen = inputs.input_ids.dims[1];
		const generatedTokens = output.dims[1] - inputLen;
		self.postMessage({
			type: 'done',
			usage: { completion_tokens: generatedTokens, prompt_tokens: inputLen, total_tokens: output.dims[1] }
		});
	} catch (err: any) {
		if (interrupted) {
			self.postMessage({ type: 'done', usage: undefined });
		} else {
			self.postMessage({ type: 'error', message: String(err?.message ?? err) });
		}
	}
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
	const req = event.data;
	if (req.type === 'load') {
		if (loadInFlight) return;
		loadInFlight = load(req.modelId, req.multimodal, req.dtype)
			.catch((err) => self.postMessage({ type: 'error', message: String(err?.message ?? err) }))
			.finally(() => { loadInFlight = null; });
	} else if (req.type === 'generate') {
		generate(req).catch((err) =>
			self.postMessage({ type: 'error', message: String(err?.message ?? err) })
		);
	} else if (req.type === 'interrupt') {
		interrupted = true;
	}
});
