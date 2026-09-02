# Test Layout

P1 test evidence is layered:

- `run-node-tests.mjs` — deterministic byte vectors plus adversarial portable-save, boundary, Unicode and no-Window renderer checks.
- `vectors/p1-kernel-vectors.json` — committed P1 golden vectors and pinned canonical corpus digest.
- `build/reproducible-build.mjs` — two clean deterministic builds compared byte-for-byte.
- `browser/direct-open.mjs` — Strict `file://`, no-network/one-artifact resource audit, local-subresource positive control, Worker 1/2/4, Worker unavailable/hang injections, component corruption, Strict/Enhanced equality and environment capture.
- `tools/aggregate-p1-evidence.mjs` — consumes all matrix artifacts and fails unless hashes, bytes, corpus digest, mandatory statuses and target coverage agree.

Playwright WebKit is WebKit test coverage, not Safari certification. Mobile and real iOS remain unverified in P1.
