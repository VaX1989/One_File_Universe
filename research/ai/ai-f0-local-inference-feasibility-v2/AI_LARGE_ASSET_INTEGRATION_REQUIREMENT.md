# AI-F0 v2 — bounded large-asset integration requirement

**Authority:** RESEARCH_ONLY  
**Shipping activation:** none

## Finding

The converged PX component planner limits an individual component to 4 MiB and the complete additive component plan to 64 MiB. Those limits are valuable and must not be weakened for AI.

The first AI-F0 real-inference candidate, SmolLM2-135M-Instruct ONNX q4f16, has a model payload of 117,266,133 bytes before tokenizer and runtime bytes. Therefore it cannot be represented honestly as an ordinary PX additive component.

## Minimal future convergence-owned seam

If AI-F0 eventually passes its real-inference exit gate, a shipping `OFU_AI` experiment will require a separate bounded large-asset channel with all of the following properties:

1. `OFU_STANDARD` has no dependency on the channel and remains byte/replay independent from AI availability.
2. Every large asset is identified by exact byte length and SHA-256 before runtime consumption.
3. The channel is deterministic and build-time only; no CDN, HTTP(S), sibling-file or model-hub fallback is allowed after opening the standalone artifact.
4. The asset channel grants no `CANONICAL_PROVEN` authority and cannot register canonical admissions.
5. The ordinary PX 4 MiB per-component and 64 MiB plan limits are not increased or bypassed globally.
6. Model, tokenizer, runtime JS and runtime WASM budgets are independently bounded and jointly bounded.
7. Base64/embedding amplification and transient decode residency are accounted for before admission.
8. Failed identity verification, insufficient memory budget or unavailable backend produces deterministic AI-unavailable fallback, not product failure.
9. Raw generated prose remains non-replay state; only independently admitted structured OFU operations may affect governed state.
10. Direct-file zero-network browser evidence and real-device memory evidence remain mandatory before an AI edition can be called mature.

## Current classification

`SMOLLM2_135M_ORDINARY_PX_COMPONENT = NOT_ADMISSIBLE`

`REQUIRED_FUTURE_CHANNEL = SEPARATE_BOUNDED_AI_LARGE_ASSET_CHANNEL`

`REQUEST_TO_CONVERGENCE_OWNER = CONTRACT_ONLY_NOT_IMPLEMENTATION`

AI-F0 does not modify the central composer or request that its current safety limits be weakened.
