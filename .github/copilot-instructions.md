# GitHub Copilot instructions

This is the `feat/browser-runtime` branch of open-webui/open-webui, extending Open WebUI with in-browser LLM inference.

## Branch-specific additions

### Browser runtime (`src/lib/runtimes/browser/`)

Models run locally in the user's browser via WebGPU or WASM. The system has three layers:

1. **Registry** (`registry.ts`) — static list of `BROWSER_MODEL_ENTRIES` with metadata per model.
2. **Types** (`types.ts`) — `BrowserRuntimeId` union; `WEBGPU_RUNTIMES` set; per-runtime entry interfaces.
3. **Adapters** (`adapters/`) — one file per runtime, each implementing `BrowserRuntimeAdapter<E>`.

Supported runtimes: `webllm`, `transformers`, `wllama`, `mediapipe`, `litert`, `prompt-api`.

### Model ID convention

All browser model IDs use the `browser:` prefix (e.g., `browser:Llama-3.2-1B-Instruct-q4f16_1-MLC`).
`isBrowserModelId(id)` checks this. The chat send path routes browser-prefixed IDs to `browserChatCompletion()`.

### Adapter contract

```typescript
interface BrowserRuntimeAdapter<E> {
  chatCompletion(entry: E, opts: BrowserChatOptions): Promise<void>;
  interrupt(): void;
}
```

- Stream tokens via `opts.onDelta(openAiChunk)`.
- Finish with `opts.onDone({})` or `opts.onError(err)` — exactly one, always.
- Honor `opts.signal` for abort.
- Use dynamic `import()` — never top-level `import` for heavy WebGPU packages.

### WebGPU availability

`navigator.gpu` is only available in secure contexts (HTTPS or `localhost`).
Runtimes that need it are listed in `WEBGPU_RUNTIMES`; the model list filters them out when `navigator.gpu` is absent.

## Files changed from upstream

- `src/lib/apis/index.ts` — browser model injection + filtering in `getModels()`
- `src/lib/components/admin/Settings/Models.svelte` — unfiltered browser model list in admin view
- `package.json` — added WebGPU/WASM runtime packages
