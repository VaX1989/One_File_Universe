# ADR-013 — Rendering and Capability Model

**Status:** Accepted principle; backend details experimental

## Decision
Canonical universe semantics are renderer-independent.

The project targets a portable baseline compatible with Strict Direct-Open and optional accelerated paths where runtime capabilities allow them.

Current architectural direction:
- WebGL2 as the portable graphics baseline candidate;
- WebGPU as optional acceleration;
- Workers + transferable buffers as portable parallelism;
- SharedArrayBuffer only as optional Enhanced capability.

## Consequences
No stable generator may require GPU output to establish canonical facts. P1 must measure real direct-open behavior before backend policy is further frozen.