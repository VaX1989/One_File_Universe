# ADR-019 — Environment v2 Scientific Authority and Unknown-First Genesis

**Status:** Accepted

## Context

Advanced P5 research demonstrated useful atmosphere bookkeeping, global column pressure and radiative reference concepts, but its volatile genesis prior was intentionally broad and its original Tier-0 normalization produced an incorrect Earth-like effective temperature. Promoting those research assumptions wholesale would convert deterministic heuristics into false canonical facts.

P5 v1 physical and terrain authorities are already frozen and must not be silently extended.

## Decision

Environment v2 is an additive authority identified by `ofu-p5-p6-environment-v2` / `p5-environment-2` and a dedicated P2 Semantic Generator Manifest.

1. P5 v1 contracts and their `UNSUPPORTED` environmental fields remain unchanged.
2. Atmosphere state uses absolute mass in teragrams and exact conservation bookkeeping.
3. Volatile genesis is `NO_CANONICAL_GENESIS`; the canonical projection therefore reports atmosphere mass and pressure as `UNKNOWN` until governed state exists.
4. Global surface column pressure is derived only from retained atmospheric mass plus frozen P5 v1 gravity/radius.
5. Tier-0 radiative effective temperature uses `T_eff=[S(1-A)/(4 sigma)]^(1/4)`, integer/rational canonical numerics and an explicit Bond-albedo input. It is never labeled surface temperature.
6. No canonical Bond-albedo prior is introduced. Unknown albedo remains `UNKNOWN`; the full physical albedo domain is exposed only as a deterministic envelope, not as probability or likely range.
7. Surface temperature, greenhouse climate, water phase, XUV evolution, atmospheric escape history, geology and ocean fraction remain `UNSUPPORTED`.
8. P4 remains sole owner of canonical time/event ordering/replay/checkpoint/compaction/lineage. Environment v2 promotes no private clock and no endogenous atmosphere-loss transition generator.

## Consequences

- P6 gains a versioned boundary that distinguishes `KNOWN`, `DERIVED`, `HYPOTHETICAL_MODEL_VALUE`, `UNKNOWN` and `UNSUPPORTED` without call-site inference.
- Canonical worlds are not assigned fabricated atmospheres merely to enable biosphere generation.
- Scientific-model changes to Environment v2 require a new manifest/derivation lineage rather than reuse of the P5 v1 physical manifest.
- Later greenhouse, escape or geology work must be promoted under separate evidence-gated versions.

## Rejected alternatives

- **Promote the research volatile prior.** Rejected: insufficient universal scientific calibration for arbitrary canonical 1–8 Mearth terrestrial planets.
- **Store volatile fractions relative to current planet mass.** Rejected: denominator ambiguity under future mutable mass semantics.
- **Retain the research 278.3/0.7 normalization.** Rejected: it double-normalizes Earth albedo and fails the Earth effective-radiating-temperature anchor.
- **Treat effective temperature as surface temperature.** Rejected: greenhouse/atmospheric response is outside Tier-0 and remains unsupported.
