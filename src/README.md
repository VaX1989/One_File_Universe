# Source Architecture

Production source code is introduced from P1 onward. The source tree remains intentionally modular even though the canonical distribution artifact is one HTML file.

```text
src/
  bootstrap/       runtime startup and capability probing
  kernel/          canonical addressing, derivation, deterministic math, serialization
  generators/      versioned procedural domains and conformance substrates
  simulation/      temporal and semantic LOD execution
  events/          canonical mutable overlay
  persistence/     portable save/archive and optional browser cache adapters
  rendering/       WebGL2 baseline and optional accelerated backends
  audio/           procedural/audio presentation systems
  diagnostics/     self-tests, manifests, benchmarks and explainability
  product/         UI, navigation and gameplay orchestration
  experimental/    explicitly non-normative implementation experiments
  workers/         portable parallel-compute harnesses
```

## Dependency direction

Presentation may depend on canonical/derived state. Canonical kernels MUST NOT depend on renderer frame state or presentation-specific APIs. Generator domains must publish explicit contracts and conformance vectors before stabilization.

## P1 concrete modules

- `kernel/sha256.js` — dependency-free SHA-256 reference.
- `kernel/canonical.js` — P1 canonical integer/address/serialization/derivation candidate.
- `generators/micro-universe.js` — tiny conformance substrate only; not production cosmology.
- `persistence/save.js` — bounded deterministic P1 portable-save contract.
- `rendering/renderer.js` — non-authoritative WebGL2/2D diagnostic consumer and safe capability probe.
- `experimental/wasm.js` — embedded WASM experiment, non-authoritative.
- `workers/worker-source.js` — Blob Worker harness with transferables and timeout handling.
- `diagnostics/` — numeric experiments and runtime self-tests.
- `bootstrap/` — single-artifact UI/bootstrap source.

P2 may replace P1 byte protocols. Experimental choices do not become constitutional merely by existing in code.
