# Verification Suites

OFU testing is organized by evidence type rather than only implementation module.

Planned suites:

- `known-answer/` — PRF/hash/math canonical vectors;
- `golden-universe/` — canonical corpus and digest fixtures;
- `property/` — invariants, refinement consistency and causal constraints;
- `replay/` — event/checkpoint/compaction equivalence;
- `browser/` — Strict and Enhanced runtime conformance;
- `performance/` — named runtime-budget profiles;
- `build/` — single-artifact and reproducible-build checks;
- `security/` — network isolation, malformed save/manifest and fail-closed tests.

## Test evidence rule

A test existing in the repository is `TEST_DEFINED`, not `VERIFIED`. Release evidence records what actually executed, in which environment, against which commit/artifact.
