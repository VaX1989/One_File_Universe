# ADR-006 — Addressed Derivation and Domain Separation

**Status:** Accepted

## Decision
Canonical procedural generation MUST use addressed deterministic derivation with domain separation. A global sequential RNG stream MUST NOT determine independent world facts.

Conceptually:

`PRF(seed, manifest, domainTag, canonicalAddress, propertyTag, counter)`

## Consequences
Adding a new city-name draw cannot move a moon or alter terrain merely by consuming RNG state. The exact PRF primitive remains an implementation decision until P1/P2 evaluation.