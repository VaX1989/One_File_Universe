# AI-F0 v2 — local inference feasibility and Local Scientist architecture preparation

This subtree is an isolated research lane. It has no shipping import path, no provider registration, no canonical admission API, no model weights and no runtime binary.

Base: `70af4a84bb8cb7c782966bb4b3b8aab8aa86838e` / tree `44b2cf8a40cb3e8acaa79f41acf5faa77d152a96`.

## Prototype boundary

```text
read-only provider snapshot
  -> bounded evidence-preserving cognition context
  -> untrusted model/fallback output
  -> exact JSON schema
  -> capability + selection + budget + evidence validation
  -> INSPECT / DISCOVER read-only execution, or TRAVEL preview proposal
```

`TRAVEL` is never executed by this prototype. `TRANSITION` does not exist in the allowlist. Raw prose is not replay state.

## Reproducible local commands

From the repository root:

```bash
node --test research/ai/ai-f0-local-inference-feasibility-v2/tests.mjs
node research/ai/ai-f0-local-inference-feasibility-v2/run-corpus.mjs
node benchmarks/ai/ai-f0-v2/environment-probe.mjs
node benchmarks/ai/ai-f0-v2/derived-candidate-estimates.mjs
node benchmarks/ai/ai-f0-v2/payload-benchmark.mjs
node benchmarks/ai/ai-f0-v2/model-materialization-probe.mjs
python research/ai/ai-f0-local-inference-feasibility-v2/run-direct-file-probe.py
python benchmarks/ai/ai-f0-v2/browser-host-capability-probe.py
```

Payload timings are machine-sensitive synthetic packaging proxies and will differ across executions. They are not model inference measurements.

## Evidence in this checkpoint

- typed gateway/adversarial unit suite: 40/40 pass on Node v22.16.0;
- OFU-specific gateway/fallback corpus: 14/14 pass;
- direct-file Chromium: environment policy blocked before page execution;
- Firefox/WebKit: engine unavailable in this execution environment;
- real model materialization: blocked/unavailable;
- model inference, TTFT, tokens/sec and inference memory: not measured;
- synthetic embedded-payload/base64 memory amplification: measured and separately labeled;
- no physical-device evidence.

See `AI_F0_REPORT.md`, `model-candidates.json`, `runtime-candidates.json`, `feasibility-matrix.json`, and `benchmarks/ai/ai-f0-v2/benchmark-results.json`.
