# One File Universe Roadmap

**Roadmap style:** evidence-gated, not calendar-gated. A capability closes when its declared exit criteria are demonstrated, not because a date has elapsed.

## Roadmap architecture: certified history + forward frontier

The project now maintains two complementary planning layers:

- **Layer A — Certified Development History:** preserves what versioned phases/releases actually established.
- **Layer B — Forward Frontier DAG:** describes future capability dependencies and safe parallelization without rewriting historical completion.

The machine-readable Layer B source is `docs/frontier/WORKSTREAM_DAG.json`; the human contract is `docs/FRONTIER_WORKSTREAMS.md`. This planning metadata is not canonical universe state.

A phase marked COMPLETE means its **declared, evidence-gated scope** was completed. It does not mean its entire scientific domain or the final product is permanently complete. Detailed frozen contracts and evidence records remain authoritative where this summary is less specific.

---

# Layer A — Certified development history

## P0 — Constitution & Foundation

**Status: COMPLETE within declared scope.**

Established the Constitution, Vision, Architecture, Determinism, Record/Conformance model, risk governance, ADR discipline and foundation validation needed before stable procedural semantics.

## P1 — Constitutional Prototype

**Status: COMPLETE within declared scope.**

Falsified and demonstrated the modular-source → deterministic-build → one-file Strict Direct-Open architecture, portable save experiment, Worker path, baseline rendering and optional Enhanced capability probing.

## P2 — Deterministic Kernel

**Status: COMPLETE / versioned canonical contracts.**

Froze OFU-CBV-1, Unicode profile, canonical address/identity/manifest semantics, domain-separated HMAC-SHA-256 derivation, deterministic numeric scope and Golden/cross-runtime conformance evidence.

## P3 — Universe Skeleton

**Status: COMPLETE within P3 schema-v1 / `p3-astronomy-1` scope.**

Established sparse random-access Region/Galaxy/Sector/System/Star/Planet/Moon metadata/facts with stable identities and bounded lookups. It did not establish detailed planet physics, environment, biology, civilization or final astronomical realism.

## P4 — Temporal Kernel & Mutable World

**Status: COMPLETE within `ofu-p4-temporal-v1` scope.**

Established canonical time/order, versioned events, replay, checkpoints, bounded-tail deterministic compaction, lineage, portable archives and transition-contract binding. Domain physics remains owned by versioned domain reducers.

## P5 — Planetology, Terrain & Environment

**P5 v1: COMPLETE / CANONICAL / FROZEN within scope.**

Established the bounded terrestrial physical realization and exact cube-sphere topology. The terrain elevation signal is dimensionless `FICTIONAL / STYLIZED`, not physical metres.

**Environment v2: COMPLETE / CANONICAL / FROZEN within scope.**

Established explicit epistemic status/provenance, conserved absolute atmosphere mass representation, fail-closed `NO_CANONICAL_GENESIS`, global column pressure when governed mass exists and a Tier-0 radiative effective-temperature relation. It does **not** establish mean surface temperature, greenhouse climate, canonical oceans, XUV escape evolution, geology/geochemical energy or physical terrain elevation.

Deferred research remains versioned and separate. Issues #29, #30 and #31 continue to represent greenhouse/surface-climate, XUV/escape and geology/geochemical-energy frontiers.

## P6 — Biosphere & Evolution v1

**Status: COMPLETE / CANONICAL / FROZEN within declared fail-closed scope.**

P6 v1 consumes only the frozen Environment v2 boundary, binds a complete eligibility witness and deterministic biological identity semantics, and refuses forged or insufficient genesis. The current real Environment v2 path is `INSUFFICIENT_ENVIRONMENT / canGenerateBiosphere=false`. Test/research fixtures do not create canonical biology.

A future positive biology successor requires separately promoted environmental authority and scientific/generative contracts.

## Rendering and product lineage

- **v0.5.0-preview.1:** first P1–P6 production rendering vertical slice; presentation only.
- **Product Polish / v0.7:** Explore / Inspect / Lab information hierarchy, scientific communication and accessibility/product hardening without changing P1–P6 authority.
- **v0.8 Founder Visual Closure:** historically promoted to `main` at `44f6e068d7d513c8746f23fb7580572758dc2ece` after founder physical Android acceptance of its certified candidate.
- **Wave IV technical convergence:** PR #48 candidate `f4df1452529cb5f121e4065f567b4a3da52d2b75` passed Rendering Production `33959845666`, Wave IV convergence `33959845605` and all frozen upstream gates. Normal protected merge `e33156ee8ed9c6e906d0d4e0b8142fa235a833c7` preserves its tree `5d46fd5e346fd6440cc1efd8cbc67fa13a9390c4`. Earlier failing heads remain historical evidence, not current blockers. No fresh physical-device PASS is inferred.

## Historical forward labels P7–P12

The original mostly linear roadmap remains useful historical planning vocabulary but is no longer the sole dependency model:

- **P7 — Civilization, Culture & Economy:** societies as consequences of environment, history, resources and interaction.
- **P8 — History & Late Materialization:** deep macro/meso/micro history without universal individual simulation.
- **P9 — Exploration & Gameplay:** meaningful discovery, navigation, intervention and persistent consequences.
- **P10 — Rendering, Audio & Product Maturity:** portable/Enhanced rendering, audio, accessibility and quality adaptation.
- **P11 — Certification Candidate:** reproducible artifact, source/toolchain identity, independent conformance and claim evidence.
- **P12 — Scale Campaign:** useful capability growth only after correctness/meaning, never artificial payload inflation.

These labels are **not deleted or declared wrong**. Future work should map them to the more precise Layer B workstreams and explicit dependencies instead of assuming P7→P8→P9 is the only legal execution order.

---

# Layer B — Forward Frontier DAG

The forward frontier is defined in:

- `docs/FRONTIER_WORKSTREAMS.md` — workstream contracts, current-state gap map and promotion gates;
- `docs/PARALLEL_DEVELOPMENT_ARCHITECTURE.md` — exact-base, ownership and convergence rules;
- `docs/frontier/WORKSTREAM_DAG.json` — machine-readable orchestration metadata;
- `docs/frontier/WORKSTREAM_DAG.schema.json` — planning schema;
- `docs/STATE_OF_THE_ART_RESEARCH_2026.md` — non-normative research rationale.

The frontier separates governance/kernel, exploration/query, astronomy, planetology, life, civilization, history, gameplay, visual rendering, UX/accessibility, runtime/portability, persistence/lineage, microscopic biology, matter representations, non-classical research, audio and certification.

## Active implementation path

The [founder-ratified v1.0 contract](../governance/V1_IMPLEMENTATION_CONTRACT.md)
authorizes a continuous implementation program: Wave IV technical closure,
vision reconciliation, real PX-01 through PX-06, then the complete v1.0 product.
These are successive transactions, not endpoints at which development pauses.

Canonical scientific promotion and shipping model-derived simulation are distinct
paths. A positive canonical Biology successor still needs sufficient upstream
canonical evidence. Rich causal life, ecology, evolution and civilization models
may instead ship as `MODEL_DERIVED_SIMULATION`, with assumptions, applicability,
provenance, deterministic transitions and cross-scale witnesses. They must not
mutate P6 v1's fail-closed eligibility or claim experimental validation they lack.

The current maturity fields remain evidence statements; authorization does not
turn `NOT_IMPLEMENTED` into `DONE`. Update them only with implementation and
exact-source acceptance evidence.

## Roadmap rule

Research is not promotion. Presentation is not science. A later capability may prototype early, but no prototype silently overrides an upstream frozen contract. Discoveries requiring a semantic break create a new version/ADR/compatibility story before dependent canonical work stabilizes.
