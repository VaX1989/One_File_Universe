# ADR-002 — Strict and Enhanced Runtime Profiles

**Status:** Accepted

## Decision
OFU defines two runtime profiles.

**Strict Direct-Open** is the portability baseline: one local HTML, no required network, no required secure-context-only feature, and no canonical dependence on origin-bound storage.

**Enhanced** uses the exact same artifact and MAY enable optional accelerations/capabilities when the environment provides them.

For the same Universe Identity and canonical query corpus, Strict and Enhanced MUST produce the same canonical digest.

## Consequences
WebGPU, SharedArrayBuffer, OPFS, service workers and HTTP-header-dependent capabilities cannot be baseline requirements.