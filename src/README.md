# Source Layout

P1 keeps development modular while producing one release HTML.

- `kernel/sha256.js` — dependency-free SHA-256 reference.
- `kernel/canonical.js` — P1 canonical integer/address/serialization/derivation candidate.
- `generators/micro-universe.js` — tiny conformance substrate only; not production cosmology.
- `persistence/save.js` — bounded deterministic P1 portable-save contract.
- `rendering/renderer.js` — non-authoritative WebGL2/2D diagnostic consumer and safe capability probe.
- `experimental/wasm.js` — embedded WASM experiment, non-authoritative.
- `workers/worker-source.js` — Blob Worker harness with transferables and timeout handling.
- `diagnostics/` — numeric experiments and runtime self-tests.
- `bootstrap/` — single-artifact UI/bootstrap source.

P2 may replace P1 byte protocols. P1 source must not be interpreted as permanent production astronomy or a permanent choice of implementation language.
