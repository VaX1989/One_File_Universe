# ADR-007 — Deterministic Numeric Contract

**Status:** Accepted principle; implementation experimental

## Decision
Canonical numeric operations MUST have an explicitly specified reproducibility policy and conformance vectors. Native transcendental or GPU floating-point results are not presumed bit-identical across runtimes.

OFU does NOT mandate one global fixed-point format.

## Candidate strategies
- exact integers;
- domain-specific fixed point;
- deterministic software transcendental functions;
- explicit rounding/quantization;
- other algorithms proven by D3 golden vectors.

## Consequences
P1/P2 must benchmark numeric approaches by correctness, range, precision, speed, artifact size and cross-runtime stability before stabilizing implementations.