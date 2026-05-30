import type { BrowserModelEntry } from '../types';
import { WEBUI_API_BASE_URL } from '$lib/constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function uuidToDataUrl(uuid: string): Promise<string> {
	const res = await fetch(`${WEBUI_API_BASE_URL}/files/${uuid}/content`, { credentials: 'include' });
	if (!res.ok) throw new Error(`Failed to fetch image ${uuid}: ${res.status}`);
	const blob = await res.blob();
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export async function resolveImageUrls(
	messages: Array<{ role: string; content: any }>
): Promise<Array<{ role: string; content: any }>> {
	return Promise.all(
		messages.map(async (msg) => {
			if (!Array.isArray(msg.content)) return msg;
			const content = await Promise.all(
				msg.content.map(async (part: any) => {
					if (part.type !== 'image_url' || !UUID_RE.test(part.image_url?.url ?? '')) return part;
					return { ...part, image_url: { url: await uuidToDataUrl(part.image_url.url) } };
				})
			);
			return { ...msg, content };
		})
	);
}

export interface BrowserChatOptions {
	modelId: string;
	messages: Array<{ role: string; content: any }>;
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	stop?: string[];
	stream?: boolean;
	onProgress?: (report: { progress: number; text: string }) => void;
	onDelta: (chunk: any) => void;
	onDone: (final: { usage?: any }) => void;
	onError: (err: unknown) => void;
	signal?: AbortSignal;
}

export interface BrowserRuntimeAdapter<E extends BrowserModelEntry = BrowserModelEntry> {
	chatCompletion(entry: E, opts: BrowserChatOptions): Promise<void>;
	interrupt(): void;
}

export function extractTextContent(content: any): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) {
		return content
			.filter((part) => part?.type === 'text' && typeof part.text === 'string')
			.map((part) => part.text)
			.join('');
	}
	return '';
}

export function sanitizeMessages(messages: Array<{ role: string; content: any }>) {
	return messages.map((m) => ({
		role: m.role,
		content: typeof m.content === 'string' ? m.content : extractTextContent(m.content)
	}));
}
