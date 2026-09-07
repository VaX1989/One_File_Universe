# ORT Web zero-fetch adapter plan (research only)

This is a preparation artifact, not a shipping adapter.

## Baseline hypothesis

For a strict single-HTML CPU/WASM experiment, prefer an exact pinned ORT Web build with all required executable bytes embedded. Configure before the first session:

```js
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmBinary = decodedPinnedWasmBytes;
const session = await ort.InferenceSession.create(decodedPinnedModelBytes, {
  executionProviders: ['wasm'],
});
```

Current upstream ONNX Runtime Web source exposes `wasmBinary` on `WebAssemblyFlags`; the WASM factory uses it to skip WASM-file fetching. `numThreads = 1` prevents worker-thread creation and `proxy = false` avoids the proxy worker. These properties make a zero-fetch baseline technically plausible, but they do not certify a `file://` browser path.

## Runtime JS strategies to test

1. **Bundle-module strategy** — pin `ort.wasm.bundle.min.mjs`, embed it, create a blob module URL, import it, set `wasmBinary`, `numThreads=1`, `proxy=false`, then create the in-memory model session.
2. **External-wrapper strategy** — pin the non-bundled ORT entry plus its exact `.mjs` wrapper and WASM bytes; use only in-memory/blob URLs generated from embedded bytes and verify no network request occurs.

The bundle-module strategy is preferred for the first experiment because it minimizes the runtime asset graph. It is not pre-certified: historical ORT Web versions have had blob-URL/import-meta edge cases, so the exact selected version must pass browser execution.

## Required proof

- exact runtime JS/WASM SHA-256 values;
- exact model/tokenizer SHA-256 values;
- all HTTP(S) requests blocked and request log empty after document start;
- genuine `file://` launch in Chromium, Firefox and WebKit-class engines where available;
- CPU/WASM session creation from bytes;
- deterministic 120-byte official MatMul fixture smoke pass before LLM load;
- SmolLM2 135M real initialization and generation metrics;
- repeated init/run/dispose soak and bounded memory evidence;
- deterministic fallback when any runtime/model gate fails.
