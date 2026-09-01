# Source Architecture

Production source code will be introduced from P1 onward. The source tree is intentionally modular even though the canonical distribution artifact is one HTML file.

Planned boundaries:

```text
src/
  bootstrap/       runtime startup and capability probing
  kernel/          canonical addressing, PRF, deterministic math, serialization
  generators/      versioned procedural domains
  simulation/      temporal and semantic LOD execution
  events/          canonical mutable overlay
  persistence/     portable save/archive and optional browser cache adapters
  rendering/       WebGL2 baseline and optional accelerated backends
  audio/           procedural/audio presentation systems
  diagnostics/     self-tests, manifests, benchmarks and explainability
  product/         UI, navigation and gameplay orchestration
```

## Dependency direction

Presentation may depend on canonical/derived state. Canonical kernels MUST NOT depend on renderer frame state or presentation-specific APIs.

Generator domains must publish explicit contracts and conformance vectors before stabilization.

P1 may temporarily use experimental modules to compare implementation strategies; experimental choices do not become constitutional merely by existing in code.
