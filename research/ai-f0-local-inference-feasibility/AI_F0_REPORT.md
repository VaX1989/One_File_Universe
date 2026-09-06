# AI-F0 — local inference feasibility / embedded small model / offline direct-file benchmarking

**Research date:** 2026-09-06  
**Authority:** `RESEARCH_ONLY`  
**Shipping activation:** none  
**Frozen base:** `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19` / `3324e6354b5ff1b90156d1693e6051595b6f1219`  
**Branch:** `research/ai-f0-local-inference-feasibility-2026-09-06`

## Executive finding

`AI_F0_STATUS = NOT_YET_FEASIBLE` **as an evidence/certification decision**, not as a claim that local AI is architecturally impossible.

The research-only architecture is viable enough to continue: bounded context compilation, strict typed proposals, read-only fixture tools, deterministic fallback, authority/source validation, explicit capability/authority gates and telemetry all execute locally. The smallest sourced candidate is also within a plausible single-file size envelope for an experimental desktop artifact.

However, AI-F0's own exit gate requires at least one *real local model configuration* to be demonstrably usable. This execution environment could not materialize an approved model/runtime binary and blocks the browser harness from navigating to `file://` by administrator policy. Consequently, real first-token latency, sustained tokens/sec, real inference heap/GPU residency, model OFU-task quality, model prompt-injection behavior and actual direct-file browser execution are **NOT_MEASURED**. Vendor claims are deliberately not substituted for local measurements.

## Evidence classification

| Evidence | Classification | Result |
|---|---|---|
| Gateway unit/adversarial tests | measured local execution | 22/22 pass |
| OFU-native corpus through deterministic fallback + gateway | measured local execution, non-LLM | 17/17 pass |
| Synthetic embedded-payload/base64/compression proxy | measured local synthetic proxy | 16 MiB and 64 MiB payloads measured |
| Candidate model/tokenizer sizes | source-observed metadata | four classes recorded |
| KV/cache estimates | derived from sourced architecture metadata | formula estimates only |
| Headless Chromium direct `file://` | environment-blocked | navigation denied before probe code executed |
| Local model decoding | not measured | no approved model/runtime bytes available locally |
| WebGPU inference/GPU memory | not measured | no measured GPU path |

Raw evidence is retained under `evidence/` and consolidated in `benchmark-results.json`.

## Ownership / non-shipping isolation

The repository's ownership matrix gives AI-F0 `RESEARCH_ONLY` authority with owner namespace `ai-f0-local-inference-feasibility`. All changes in this branch are therefore confined to:

`research/ai-f0-local-inference-feasibility/**`

There is no import or registration into product/bootstrap/rendering/registry/simulation composition. No third-party model weight or runtime binary is committed.

## Immutable boundary implemented by the prototype

The prototype boundary is:

`untrusted/generated output -> JSON parse -> exact typed schema -> trusted capability/authority gate -> hard budget checks -> read-only fixture tool -> structured result`

It contains no canonical admission API and no canonical mutation operation. The `navigate` tool produces a `NAVIGATION_PREVIEW` with `mutated:false` and `admissionPerformed:false`. Answer claims must cite fixture source IDs with the exact source-owned authority and `SUPPORTED` / `UNKNOWN` / `UNSUPPORTED` status. Imported/in-universe prose is represented as `untrustedText:true` data.

The deterministic fallback is deliberately non-LLM. It exists to demonstrate that tool selection, unknown/unsupported preservation and core read-only behavior do not become dependent on model availability.

## Feasibility matrix

The sizes below are candidate metadata, not locally downloaded model measurements. Base64 figures are deterministic size derivations and exclude the runtime/WASM binary, HTML/application code, packaging metadata and transient decode copies.

| Candidate class | Sourced q4f16 model payload | Tokenizer known/approx. | Base64 model+tokenizer | FP16 KV estimate @ 512 / 2k / 8k tokens | License/provenance disposition |
|---|---:|---:|---:|---:|---|
| SmolLM2 135M Instruct | 117,266,133 B (111.8 MiB) | ~3.52 MB | 161,048,180 B (153.6 MiB) | 11.25 / 45 / 180 MiB | Apache-2.0 observed; no weights committed |
| SmolLM2 360M Instruct | ~272 MB (259.4 MiB) | ~3.52 MB | ~350.3 MiB | 20 / 80 / 320 MiB | Apache-2.0 observed; no weights committed |
| Gemma 3 270M IT | ~273 MB (260.4 MiB) | ~20.3 MB tokenizer JSON | ~373.0 MiB | 9 / 36 / 144 MiB* | Gemma Terms; **do not redistribute without explicit review** |
| Qwen2.5 0.5B Instruct | ~483 MB (460.6 MiB) | ~7.03 MB | ~623.1 MiB | 6 / 24 / 96 MiB | Apache-2.0 observed; no weights committed |

`*` Gemma uses local/sliding attention in its architecture; the simple formula here is intentionally conservative and does not claim realized runtime cache allocation.

KV estimate formula: `2 (K,V) * layers * kv_heads * head_dim * 2 bytes(fp16) * tokens`. Runtime-specific cache packing/quantization, sliding-window reuse, allocator overhead and attention implementation can materially change actual memory and must be measured.

### What the size data says

The proposal's 120M-200M preference remains a useful hypothesis. Among sourced candidates, the 135M class is the only one whose known base64 model+tokenizer payload is around 154 MiB before runtime/application overhead. The 270M/360M classes are already roughly 350-373 MiB before runtime, and the 0.5B class is roughly 623 MiB. That makes **135M-class first** the rational feasibility order; it does not prove adequate OFU task quality.

No runtime byte count is reported because no exact runtime build is frozen. Reporting a package-page size as embedded runtime cost would be misleading.

## Embedded payload / startup proxy

`payload-benchmark.mjs` generates deterministic high-entropy bytes in fresh Node child processes. It is a packaging/decode proxy, not an inference benchmark.

| Synthetic payload | Base64 encode | Base64 decode | Base64 size factor | gzip size factor | Brotli size factor | Peak RSS delta while raw+base64+decoded coexist |
|---:|---:|---:|---:|---:|---:|---:|
| 16 MiB | 10.37 ms | 9.64 ms | 1.33333x | 1.00031x | 1.000001x | 56.5 MiB |
| 64 MiB | 42.87 ms | 39.50 ms | 1.33333x | 1.00031x | 1.000001x | 216.5 MiB |

For these high-entropy fixtures, gzip/Brotli add effectively no compression while base64 adds ~33.3%. The RSS result is intentionally an upper-bound construction proxy because the benchmark simultaneously holds raw bytes, base64 representation and a decoded copy. It must **not** be extrapolated as real browser/model startup RSS. It does demonstrate why a one-file loader must explicitly release encoded/intermediate buffers and why “weight bytes” alone are not a memory budget.

Actual quantized model compressibility must be measured on the exact chosen artifact before a build policy is frozen.

## Direct `file://` / offline findings

A standalone probe was built to inspect `isSecureContext`, `crossOriginIsolated`, WebAssembly instantiation, blob workers, same-file fetch behavior, IndexedDB/localStorage and WebGPU adapter availability without remote network dependencies.

In this execution environment, Chromium navigation to the `file://` probe is blocked by host administrator policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`) before the page executes. Therefore:

`OFFLINE_DIRECT_FILE_RESULT = ENVIRONMENT_BLOCKED / NOT PRODUCT-ADJUDICATED`

Architecture research still indicates an important requirement for AI-F1: do not depend on sidecar fetches. Modern browsers commonly give local files opaque origins, so sibling-file requests can fail CORS/origin rules. A strict OFU one-file experiment should embed model bytes, tokenizer assets and the chosen WASM binary in the HTML and initialize the runtime from in-memory bytes. Network access should be actively intercepted/denied during certification.

A direct-file CPU baseline must also assume **single-thread WASM unless measured otherwise**, because Wasm threads/`SharedArrayBuffer` typically depend on cross-origin isolation headers that a plain local file cannot supply. WebGPU is an optional enhancement only.

## Runtime/backend assessment

### Recommended AI-F1 experimental backend

`RECOMMENDED_MODEL_BACKEND = EXPERIMENTAL ONLY`

Preferred first experiment:

**ONNX Runtime Web compatible small causal LM, in-memory embedded model + embedded WASM, WASM/CPU single-thread baseline; WebGPU optional.** A Transformers.js-compatible model/tokenizer layout may be used as an orchestration reference, but the one-file path should not rely on runtime URL fetches.

Reasons:

1. ONNX Runtime Web provides a WASM/CPU browser path, satisfying the portability direction better than a WebGPU-only runtime.
2. Its browser API supports model data supplied as `Uint8Array`; runtime configuration also supports supplying a WASM binary, which is compatible with a true one-file loader design.
3. WebGPU can be layered as acceleration without becoming a liveness requirement.
4. WebLLM is worth a secondary WebGPU experiment, including structured generation, but it is not a valid mandatory baseline for OFU. Current structured-decoding issue reports also reinforce that grammar-constrained generation never replaces post-validation.

## OFU-native task benchmark

The corpus is intentionally OFU-specific rather than trivia-heavy:

- navigation: 2 cases;
- typed tool selection: 3;
- authority/unknown preservation: 2;
- concise summarization: 1;
- untrusted-text prompt injection: 2;
- malformed/fail-closed outputs: 7.

The deterministic fallback + gateway obtains **17/17**. The unit/adversarial suite obtains **22/22**. This validates the *architecture and non-LLM fallback*, including read-only execution and fail-closed boundaries.

`OFU_TASK_QUALITY_FOR_LOCAL_MODEL = NOT_MEASURED`

No language model was run over these cases. Consequently, no model accuracy, schema-generation rate, authority hallucination rate or injection resistance rate is claimed.

## Schema / tool validity

Prototype evidence:

- exact top-level schema by proposal kind;
- exact tool object and argument keys;
- allowlist: `inspect`, `search`, `compare`, `navigate` only;
- trusted capability check;
- trusted `RESEARCH_READ_ONLY` authority check;
- non-negative integer budgets with hard maxima;
- answer text budget verified against actual generated text length;
- bounded claim/source-reference counts;
- source authority/status must exactly match fixture evidence;
- unknown tool, hidden mutation argument, extra tool fields, malformed JSON, cross-kind payload smuggling and budget abuse reject closed;
- read-only executor rechecks permission and verifies fixture immutability;
- telemetry event types and fields are allowlisted.

`SCHEMA_TOOL_VALIDITY = 22/22 prototype tests pass; 17/17 corpus cases pass; real model structured-output validity NOT_MEASURED.`

## Authority hallucination and prompt injection

Deterministic architecture tests preserve `UNKNOWN` and `UNSUPPORTED` and reject mismatched source authority/status. The hostile in-universe inscription is kept as `PRESENTATION_ONLY` untrusted data and cannot become a tool action through the deterministic fallback.

These are gateway properties, not evidence that a specific model will never hallucinate. Even grammar-constrained decoding cannot be trusted as the sole safety boundary: generated structured output must still pass independent schema/capability/authority/budget/source validation.

`AUTHORITY_HALLUCINATION_RESULT = gateway/fallback adversarial cases pass; real-model hallucination rate NOT_MEASURED.`  
`PROMPT_INJECTION_RESULT = gateway/fallback adversarial cases pass; real-model injection susceptibility NOT_MEASURED.`

## Determinism / replay policy

AI-F0 does not require byte-identical generated prose. The intended future boundary remains:

`model -> structured proposal -> validated deterministic OFU execution -> admitted structured event if applicable`

If a later proposal matters to history, the admitted structured record is replay input. Raw prose is never required to reconstruct world state. This research prototype has no admission/mutation path at all.

## Required AI-F1 prerequisites

1. Freeze exact candidate model/tokenizer/runtime versions, hashes, licenses, notices and redistribution disposition; keep weights outside the repository until policy explicitly approves them.
2. Start with the 135M-class candidate, then test 270M/360M only if the OFU corpus proves the smaller class inadequate after context compilation and constrained decoding.
3. Build a **zero-fetch single-file loader**: embedded model bytes, embedded tokenizer, embedded WASM/runtime bytes; prove all initialization succeeds with network interception denying every request.
4. Run real direct-`file://` tests in supported desktop browsers. Record secure-context state, worker availability, storage behavior, WASM execution and optional WebGPU capability rather than inferring them.
5. Treat single-thread WASM/CPU as the required feasibility baseline unless a direct-file browser is empirically shown to provide safe threaded Wasm. WebGPU remains optional.
6. Execute actual model inference and record cold init, warm init, TTFT, sustained tokens/sec, process/browser RSS, JS/WASM memory, GPU memory if used, and OOM recovery.
7. Measure context/cache behavior at bounded task-relevant lengths (for example 512 and 2k first; 8k only if justified) and release intermediate/base64 buffers aggressively.
8. Run the exact OFU-native corpus through each real model with grammar/schema-constrained decoding **plus** the independent validator. Record raw valid-schema rate, post-validation acceptance rate, retry rate and deterministic fallback rate.
9. Expand adversarial cases for authority upgrades, forged source IDs, capability escalation, tool smuggling, Unicode/encoding tricks, prompt injection in every untrusted text field and deliberate resource exhaustion.
10. Require **0 executed invalid tool proposals** and **0 authority/status upgrades** in the defined release corpus. Invalid output must fail closed or use deterministic fallback.
11. Freeze artifact budgets only after exact model/runtime packaging is measured; include encoded bytes, tokenizer, runtime/WASM, parse/decode amplification, KV/cache, save coexistence and repeated-session leak/soak evidence.
12. Keep `OFU_STANDARD` dependency- and weight-free with full functionality. AI packaging must remain a separate experimental artifact until an explicit activation decision after v1 gates.

## Known limitations

- No actual language-model weights were executed locally.
- No exact runtime/WASM build was materialized; runtime bytes and true startup amplification are unknown.
- Direct `file://` browser execution is blocked by the current host policy; this is not evidence of browser/product failure or success.
- No Firefox/Safari/mobile/physical-device run was performed.
- No measured WebGPU adapter or GPU memory result exists.
- Candidate artifact sizes are source observations; all but the 135M exact byte count are rounded where the source UI reports rounded sizes.
- KV figures are analytical estimates, not allocator/runtime measurements.
- Synthetic compression/RSS proxies are deliberately not treated as model inference evidence.
- Model OFU-task accuracy, tool-schema generation rate, authority hallucination rate, prompt-injection susceptibility, TTFT and tokens/sec remain unmeasured.

## Final AI-F0 fields

`AI_F0_STATUS = NOT_YET_FEASIBLE`

`BASE_SHA/TREE = 760c0c70bccb6afd7c7b07600c0f5be3f80e7b19 / 3324e6354b5ff1b90156d1693e6051595b6f1219`

`RUNTIMES_TESTED = Node.js v22.16.0 prototype execution; Chromium 144 direct-file harness attempted but ENVIRONMENT_BLOCKED; no model runtime executed`

`MODEL_CLASSES_TESTED = source/size/KV feasibility analysis for SmolLM2 135M, SmolLM2 360M, Gemma 3 270M, Qwen2.5 0.5B; actual inference = NONE`

`LICENSE_PROVENANCE = recorded; zero model/runtime binaries committed; Gemma explicitly withheld from redistribution pending terms review`

`OFFLINE_DIRECT_FILE_RESULTS = probe implemented; browser execution ENVIRONMENT_BLOCKED; zero-fetch embedded-loader requirement retained for AI-F1`

`MEMORY_STARTUP_PERFORMANCE = synthetic 16/64 MiB payload encode/decode/RSS proxy measured; actual model init/TTFT/tps/heap/GPU = NOT_MEASURED`

`OFU_TASK_QUALITY = deterministic fallback/gateway 17/17; local-model quality = NOT_MEASURED`

`SCHEMA_TOOL_VALIDITY = 22/22 adversarial unit tests + 17/17 corpus through deterministic gateway/fallback; real-model structured-output rate = NOT_MEASURED`

`AUTHORITY_HALLUCINATION_RESULTS = gateway preserves/rejects authority/status correctly in defined cases; model hallucination rate = NOT_MEASURED`

`PROMPT_INJECTION_RESULTS = untrusted fixture text cannot execute through gateway/fallback; model susceptibility = NOT_MEASURED`

`RECOMMENDED_MODEL_BACKEND = EXPERIMENTAL ONLY`
