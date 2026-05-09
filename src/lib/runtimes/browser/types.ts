export type BrowserRuntimeId = 'webllm';

export interface BrowserModelEntry {
	id: string;
	name: string;
	runtime: BrowserRuntimeId;
	mlcModelId: string;
	approxVramMb: number;
}

export const BROWSER_MODEL_PREFIX = 'browser:';

export const isBrowserModelId = (id: string | undefined | null): boolean =>
	typeof id === 'string' && id.startsWith(BROWSER_MODEL_PREFIX);
