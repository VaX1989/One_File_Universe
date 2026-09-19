# PROD-W1-SCI-FP — Scientific Fingerprint

This lane is a read-only Product projection over the already-governed R6 scientific/model state.

## Authority boundary

- The normative interchange object is the frozen W1 contract `ofu-r6-w1-scientific-fingerprint-1`.
- The provider itself is `ANALYSIS_ONLY`.
- Upstream per-domain authority is copied without promotion.
- Presentation consequences are excluded from scientific hash authority.
- Causal links are exposed only through a lane-local `ANALYSIS_ONLY` provenance projection whose downstream authority is explicitly `PRESENTATION_ONLY`.
- No canonical scientific state, P4 state, selection, camera, renderer, persistence or provider registry is mutated.

## Fail-closed behavior

A PRESENT fingerprint requires the exact R6 world/scientific contracts, matching subject universe/canonical identity, matching scientific model versions and valid governed scientific hashes.

If scientific state is unavailable, the provider emits an `UNKNOWN` W1 fingerprint with all scientific hashes null and no fingerprint reference.

Unsupported contracts, subject mismatches and model-version mismatches throw rather than guessing compatibility.

## Determinism

The fingerprint is derived only from the governed scientific-state contract, versions, hashes, per-domain authority and deterministic limitations. Presentation/representation hashes are not inputs, so visual changes cannot silently become scientific identity.

The focused test is `tests/product/prod-w1-sci-fp.mjs`.
