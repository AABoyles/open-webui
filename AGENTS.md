# Agent guidance — feat/browser-runtime

This is the **`feat/browser-runtime`** branch of [open-webui/open-webui](https://github.com/open-webui/open-webui).
It adds client-side LLM inference (models run in the user's browser) on top of the standard Open WebUI stack.

## What was added

### New directory: `src/lib/runtimes/browser/`

The entire browser runtime system. Key entry points:

- **`index.ts`** — exports `browserChatCompletion()`, `interruptBrowserGeneration()`, and all types
- **`registry.ts`** — list of all browser-runnable models with metadata
- **`types.ts`** — runtime IDs, model entry interfaces, `WEBGPU_RUNTIMES`
- **`adapters/`** — one file per runtime backend (webllm, transformers, wllama, mediapipe, litert, prompt-api)

### New workers: `src/lib/workers/`

- `webllm.worker.ts` — runs WebLLM engine off the main thread
- `transformers.worker.ts` — runs Transformers.js inference off the main thread

### New npm dependencies

| Package | Runtime |
|---------|---------|
| `@mlc-ai/web-llm` | WebLLM |
| `@xenova/transformers` | Transformers.js |
| `@wllama/wllama` | wllama |
| `@mediapipe/tasks-genai` | MediaPipe |
| `@litert-lm/core` | LiteRT-LM |

## What was changed in upstream files

| File | Change summary |
|------|---------------|
| `src/lib/apis/index.ts` | `getModels()` now appends browser models; filters them by WebGPU availability, VRAM budget, and Prompt API availability |
| `src/lib/components/admin/Settings/Models.svelte` | Admin model list includes all browser models (no capability filtering) |
| `package.json` | New runtime dependencies added |

## Critical rules for working in this codebase

1. **Browser model IDs** must start with `browser:` (`BROWSER_MODEL_PREFIX`).
2. **Every `BrowserRuntimeId` value** must have a matching entry in the `ADAPTERS` map in `index.ts` (compile-time `satisfies` check).
3. **Every adapter** must call exactly one of `opts.onDone` or `opts.onError` — never both, never neither.
4. **Runtime package imports** must be dynamic (`await import(...)` inside functions), not static — static imports of WebGPU packages break server-side rendering.
5. **WebGPU-dependent runtimes** must be listed in `WEBGPU_RUNTIMES` in `types.ts` so they are hidden when `navigator.gpu` is unavailable.
6. **`approxVramMb`** on each model entry feeds the VRAM budget filter — set it accurately.

## Upstream sync notes

When merging upstream changes into this branch, watch for conflicts in:
- `src/lib/apis/index.ts` (our browser model injection is near the end of `getModels()`)
- `src/lib/components/admin/Settings/Models.svelte` (our browser model addition is in `init()`)
- `package.json` (dependency version bumps may conflict)

Files in `src/lib/runtimes/browser/` and the two new workers have no upstream equivalents and will never conflict.
