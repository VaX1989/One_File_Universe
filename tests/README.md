# Verification Suites

OFU testing is organized by evidence type rather than only implementation module.

Planned and active suites:

- `known-answer/` — PRF/hash/math canonical vectors;
- `golden-universe/` — canonical corpus and digest fixtures;
- `property/` — invariants, refinement consistency and causal constraints;
- `replay/` — event/checkpoint/compaction equivalence;
- `browser/` — Strict and Enhanced runtime conformance;
- `performance/` — named runtime-budget profiles;
- `build/` — single-artifact and reproducible-build checks;
- `security/` — network isolation, malformed save/manifest and fail-closed tests.

## P1 active evidence

- `run-node-tests.mjs` — deterministic byte vectors plus adversarial portable-save, boundary, Unicode and no-Window renderer checks.
- `vectors/p1-kernel-vectors.json` — committed P1 golden vectors and pinned canonical corpus digest.
- `build/reproducible-build.mjs` — two deterministic builds compared byte-for-byte.
- `browser/direct-open.mjs` — Strict `file://`, no-network/one-artifact resource audit, local-subresource positive control, Worker 1/2/4, Worker unavailable/hang injections, component corruption, Strict/Enhanced equality and environment capture.
- `tools/aggregate-p1-evidence.mjs` — consumes all matrix artifacts and fails unless hashes, bytes, corpus digest, mandatory statuses and target coverage agree.

## Test evidence rule

A test existing in the repository is `TEST_DEFINED`, not `VERIFIED`. Release evidence records what actually executed, in which environment, against which commit/artifact. Playwright WebKit is WebKit test coverage, not Safari certification. Mobile and real iOS remain unverified in P1.
