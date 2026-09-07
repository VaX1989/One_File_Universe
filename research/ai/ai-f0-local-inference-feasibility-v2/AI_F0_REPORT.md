# AI-F0 v2 — local inference feasibility and Local Scientist architecture preparation

**Research date:** 2026-09-07  
**Authority:** `RESEARCH_ONLY`  
**Shipping activation:** none  
**Branch:** `research/ai-f0-local-inference-feasibility-v2-2026-09-07`  
**Frozen base:** `70af4a84bb8cb7c782966bb4b3b8aab8aa86838e` / `44b2cf8a40cb3e8acaa79f41acf5faa77d152a96`

## Executive adjudication

`AI_F0_V2_STATUS = PARTIAL / REAL_INFERENCE_EXIT_GATE_NOT_MET`

AI-F0 v2 materially advances the architecture and evidence discipline without touching the shipping runtime. The research gateway is aligned to OFU's public `INSPECT`, `DISCOVER`, `TRAVEL` vocabulary, keeps `TRAVEL` proposal-only, has no `TRANSITION` route, binds proposals to selection identity, carries source-owned authority/fidelity/status/assumptions/limitations, and rejects evidence stripping or semantic upgrades.

The gateway/adversarial suite passes 40/40 and the OFU-specific deterministic corpus passes 14/14 in the measured local Node environment. This demonstrates a useful deterministic trust boundary and AI-unavailable fallback. It does **not** demonstrate language-model quality.

AI-F0's inference exit gate remains open. This execution environment could not materialize an approved model/runtime package. Therefore real model initialization, TTFT, sustained tokens/sec, inference heap/WASM/GPU allocation, model structured-output rate, prompt-injection susceptibility and OFU-task accuracy remain `NOT_MEASURED`.

Direct `file://` evidence is also incomplete: system Chromium 144 is blocked by host administrator policy before the research page executes; Playwright Firefox and WebKit engines are unavailable in this environment. This is an environment limitation, not a browser/product pass or fail.

`AI_F1_RECOMMENDATION = NO_GO` until at least one exact compact model/runtime pair is measured under a genuine zero-network direct-file browser run and meets bounded OFU-native quality/resource gates.

## 1. Architectural result

The future Local Scientist boundary should be:

```text
provider evidence snapshots
  -> bounded cognition context compiler
  -> untrusted local model
  -> typed structured proposal
  -> independent fail-closed validator
  -> deterministic OFU public operation
  -> structured result/evidence
```

The model is a consumer/proposer, not an author of canonical truth. The prototype has no canonical event-admission capability.

### Implemented research constraints

- operations allowlist: `INSPECT`, `DISCOVER`, `TRAVEL`;
- `INSPECT` and `DISCOVER` are read-only over frozen fixtures;
- `TRAVEL` can only produce `PREVIEW_ONLY` and cannot be executed by the research executor;
- `TRANSITION` and arbitrary operation names reject closed;
- context: max 32 facts, 8192 characters, 16 entities;
- proposal: max 1 tool call, 1 retry, 8 queue units, 1600 output characters, 10 claims and 8 evidence references per claim;
- selection digest must match trusted gateway state;
- every factual evidence reference must exactly retain source ID, provider ID, authority, status and fidelity;
- `UNKNOWN` and `UNSUPPORTED` cannot be relabeled through accepted evidence;
- in-universe text remains explicitly untrusted data;
- model self-confidence is not part of the accepted evidence schema;
- raw prose is invalid as executable input;
- telemetry excludes raw prompts and accepts only a bounded field allowlist.

## 2. Defect found and repaired during execution

The first v2 gateway test run incorrectly applied the lowercase repository-token grammar to scientific fact keys such as `surfacePressurePa` and `biosphereState`. That conflated structural identity with domain data labels. The validator was corrected to use separate types: strict structural tokens remain strict, while bounded scientific fact keys allow a conservative identifier grammar. The full suite was then rerun and passed.

This is retained as a research engineering lesson: typed gateways must distinguish identity/authority identifiers from domain field names rather than using one permissive or one over-restrictive string type everywhere.

## 3. Measured local evidence

### Gateway and corpus

- `node --test research/ai/ai-f0-local-inference-feasibility-v2/tests.mjs`
  - runtime: Node v22.16.0;
  - result: 40 pass / 0 fail.
- `node research/ai/ai-f0-local-inference-feasibility-v2/run-corpus.mjs`
  - result: 14 pass / 0 fail.

Adversarial coverage includes operation escalation, lowercase/Unicode-confusable operation names, hidden mutation fields, capability denial, authority denial, selection mismatch, budget and retry/tool/queue overuse, cross-kind smuggling, prototype-pollution keys, raw prose, forged source IDs, authority/status/fidelity upgrades, missing evidence, duplicate evidence, prompt injection in untrusted world text, telemetry prompt leakage and attempted `TRAVEL` execution.

These are gateway properties. They do not establish that a real model will generate valid schemas or resist prompt injection.

### Host environment

Measured host:

- Linux x64;
- Node v22.16.0 (canonical project requirement is Node 24.20.x, so this is diagnostic lane evidence only);
- Python 3.13.5;
- 5 visible CPU threads;
- approximately 6.24 GB total host memory;
- Chromium 144.0.7559.96;
- no local Firefox executable in the shell probe;
- no `nvidia-smi` and no measured GPU allocation.

### Direct-file browser matrix

The probe aborts all `http:` and `https:` requests.

- Chromium: `ENVIRONMENT_POLICY_BLOCKED_FILE_NAVIGATION`; `ERR_BLOCKED_BY_ADMINISTRATOR` occurs before page code runs.
- Firefox: `ENGINE_UNAVAILABLE_IN_EXECUTION_ENVIRONMENT`.
- WebKit: `ENGINE_UNAVAILABLE_IN_EXECUTION_ENVIRONMENT`.

A separate Chromium `about:blank` diagnostic reports WebAssembly present, `SharedArrayBuffer` absent, and no `navigator.gpu` in this host. That record is explicitly `HOST_DIAGNOSTIC_NOT_DIRECT_FILE_EVIDENCE` and cannot adjudicate product/browser support.

### Model materialization

The first intended candidate is SmolLM2 135M Instruct ONNX q4f16, expected at 117,266,133 bytes with SHA-256 `662d0a9d8d5d56e3746a5bf3b3ede96bd2d4d3594d9b2e282baebd4f34cf3589`.

It was not present locally and could not be materialized through the execution environment. The result is `ENVIRONMENT_NETWORK_OR_ASSET_BLOCKED`; it is not a model failure.

## 4. Synthetic one-file packaging proxy

`payload-benchmark.mjs` uses deterministic synthetic bytes in fresh child processes. It measures representation/materialization overhead only.

| Payload | Base64 bytes | Encode ms | Decode ms | RSS delta | ArrayBuffer delta |
|---:|---:|---:|---:|---:|---:|
| 16 MiB | 22,369,624 | 153.67 | 69.90 | 40,632,320 B | 33,562,624 B |
| 64 MiB | 89,478,488 | 551.33 | 263.10 | 161,742,848 B | 134,250,464 B |
| 112 MiB | 156,587,352 | 936.20 | 692.92 | 285,868,032 B | 234,938,336 B |

These values are machine-sensitive and are **not inference measurements**. The stable lesson is structural: base64 expands bytes by about one third and transient simultaneous raw/encoded/decoded copies can materially amplify startup memory. A one-file loader must release intermediate buffers aggressively and benchmark the exact packaged artifact.

## 5. Runtime/backend review

### ONNX Runtime Web 1.29.0 — first portable experiment

Current upstream package metadata identifies `onnxruntime-web` 1.29.0 under MIT. ONNX Runtime Web supplies a WebAssembly CPU backend and experimental WebGPU support. Current JavaScript API supports creating an `InferenceSession` from `Uint8Array`; current upstream source also contains a WASM binary override path that skips WASM-file fetching.

This improves the plausibility of a strict embedded experiment: model and WASM bytes can be materialized from the one-file resource store. It is **not** a direct-file success claim. Module/worker URL behavior, single-thread configuration and the exact bundled distribution still require empirical browser tests. The required baseline should use single-thread WASM/CPU unless direct-file evidence proves a safe threaded configuration.

### wllama 3.5.1 — secondary CPU/WASM baseline

wllama remains worth a second experiment because it targets llama.cpp-style local browser inference through WebAssembly without requiring a GPU. An exact GGUF candidate, runtime bytes, dependency integrity and strict zero-fetch direct-file path are not frozen in this checkpoint.

### Transformers.js 4.2.0 — orchestration reference

Transformers.js remains useful for model/tokenizer task orchestration and offline/local-model configuration patterns. It should not be treated as proof of a strict embedded one-file loader; AI-F0 should prefer direct byte-level runtime/model control for the certification experiment.

### WebLLM 0.2.84 — Enhanced only

WebLLM requires a WebGPU-compatible browser for its normal runtime class. It is therefore `NOT_VIABLE` as OFU's required AI baseline. It remains `VIABLE_WITH_LIMITS` as an optional Enhanced backend to benchmark later.

## 6. Model feasibility ordering

The exact candidate metadata is in `model-candidates.json`; analytical estimates are generated by `benchmarks/ai/ai-f0-v2/derived-candidate-estimates.mjs` and consolidated with measured local evidence in `benchmarks/ai/ai-f0-v2/benchmark-results.json`.

1. **SmolLM2 135M q4f16** — first real inference target. Smallest frozen payload (~117.3 MB before tokenizer/runtime/encoding) and Apache-2.0 source license observation.
2. **SmolLM2 360M q4f16** — quality escalation only if 135M fails OFU-native quality.
3. **Gemma 3 270M IT q4f16** — technically interesting, but custom terms and split external-data packaging require explicit review; no redistribution decision is made.
4. **Qwen2.5 0.5B q4f16** — useful desktop quality ceiling but ~483 MB weight payload makes it an unattractive initial one-file baseline.
5. **Qwen3 0.6B q4f16** — research quality ceiling only; ~570 MB weights and a much larger simple FP16 KV estimate make bounded-memory evidence especially important.

Parameter count is not the selection criterion. The winner must be chosen from measured OFU task success, valid structured output rate, startup, memory, TTFT, sustained generation, artifact size and device/browser coverage.

## 7. Feasibility matrix outcome

No configuration earns plain `VIABLE` because the lane has not yet measured real inference plus direct-file/offline execution.

- ORT/WASM + SmolLM2 135M: `VIABLE_WITH_LIMITS`, first target.
- ORT/WebGPU + SmolLM2 135M: `VIABLE_WITH_LIMITS`, optional Enhanced.
- ORT/WASM + SmolLM2 360M: `VIABLE_WITH_LIMITS`, quality escalation.
- ORT/WASM + Gemma 3 270M: `VIABLE_WITH_LIMITS`, license/packaging gated.
- ORT/WASM + Qwen2.5 0.5B: `VIABLE_WITH_LIMITS`, desktop ceiling.
- ORT/WASM + Qwen3 0.6B: `VIABLE_WITH_LIMITS`, quality ceiling.
- wllama/WASM + compact GGUF: `VIABLE_WITH_LIMITS`, second portable baseline.
- WebLLM as mandatory baseline: `NOT_VIABLE`.
- WebLLM as optional Enhanced: `VIABLE_WITH_LIMITS`.

## 8. AI-F1 activation gate

`AI_F1_RECOMMENDATION = NO_GO`

The architectural preparation is good enough to continue AI-F0, not to activate AI-F1. Minimum remaining evidence:

1. materialize exact model/tokenizer/runtime artifacts and freeze bytes, hashes, package integrity, notices and licenses;
2. execute at least one real local model on CPU/WASM;
3. measure cold/warm initialization, TTFT, sustained tokens/sec and observable memory/cache behavior;
4. run a genuine `file://` zero-network browser experiment in supported desktop engines;
5. run the exact OFU-native corpus through real model output plus independent validation;
6. record raw valid-schema rate, post-validation acceptance, retry/fallback rates and tool proposal accuracy;
7. require zero executed invalid proposals and zero authority/status/fidelity upgrades in the defined corpus;
8. measure repeated initialization/disposal and OOM/fallback behavior;
9. obtain compact/mobile-class evidence honestly and later physical-device evidence before any mature AI release claim.

## 9. Non-claims

This checkpoint does not claim:

- a usable local LLM configuration;
- direct-file browser success;
- mobile or physical-device support;
- WebGPU availability or performance;
- real model memory, latency or throughput;
- model hallucination or prompt-injection resistance rates;
- AI shipping activation;
- permission to redistribute model/runtime artifacts;
- any change to OFU_STANDARD, canonical truth, simulation liveness, saves, P4 event admission, central registries or shipping UI.
