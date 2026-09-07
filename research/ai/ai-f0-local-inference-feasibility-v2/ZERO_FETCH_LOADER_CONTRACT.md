# AI-F0 v2 zero-fetch loader contract

**Authority:** RESEARCH_ONLY  
**Shipping effect:** none

A future Local Scientist experiment may be called `DIRECT_FILE_OFFLINE` only when all executable code, tokenizer data, model weights and runtime/WASM bytes needed after opening the HTML are already contained in that artifact and all `http:` / `https:` requests are denied during the run.

## Required baseline shape

1. Decode bounded embedded resources into explicit byte buffers.
2. Initialize a CPU/WASM backend with `numThreads = 1` unless direct-file evidence proves a safe threaded path.
3. Load the model from an in-memory buffer, not a sibling-file fetch.
4. Release base64/text and duplicate decode buffers as soon as the consumer owns the bytes.
5. Compile only bounded provider snapshots into cognition context.
6. Send generated output only to the independent typed gateway.
7. Keep AI-unavailable fallback deterministic and preserve the ordinary OFU product unchanged.

For ONNX Runtime Web, current upstream API/source supports model creation from `Uint8Array` and exposes a WASM binary override. This makes a strict single-artifact experiment plausible, but does not prove that a chosen ORT bundle, worker strategy and browser combination succeeds under `file://`. In particular, module/worker URL resolution remains a configuration surface and must be empirically tested.

## Explicitly forbidden

- CDN fallback;
- model/tokenizer/runtime fetch after document load;
- WebGPU as the only backend;
- generated prose as executable state;
- `TRANSITION` or canonical event admission in AI-F0;
- implicit authority or `UNKNOWN`/`UNSUPPORTED` upgrades;
- unbounded context, output, retries, tools, queues or cache growth.

## Certification evidence required later

A real zero-fetch run must record browser/version, OS/device class, exact runtime/model/tokenizer hashes, total artifact bytes, network-interception log, cold initialization, first-token latency, sustained generation, peak observable JS/WASM memory proxies, GPU allocation where applicable, context/cache bounds, fallback behavior, and repeated-session leak/soak results.
