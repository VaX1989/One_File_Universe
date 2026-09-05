# One File Universe

**One file. One universe. Verifiable by construction.**

One File Universe (OFU) is a deterministic, causal, persistent, mutable and deeply explorable procedural-universe project whose canonical release artifact is one self-contained HTML file. The source repository remains modular, evidence-gated and versioned; the one-file artifact is a deterministic build product rather than the source architecture.

## Founder north star

OFU ultimately aims to feel like entering a universe rather than opening an engineering application. Within supported model domains, a player should be able to choose what to explore, move from cosmic structure toward arbitrary supported worlds and locations, encounter progressively refined geography, environments, life, history and civilization where those models are authoritative, descend toward microscopic reality as future model regimes mature, change the world only through governed canonical events, return later to the same causal reality, and inspect why the universe is what it is.

The target is a **progressively extensible, sparse, query-driven multiscale reality with bounded materialized working sets**. OFU does not claim literal infinite simulation or one classical Euclidean hierarchy down to quantum scales.

## Current certified baseline

The repository preserves versioned certified history rather than redefining old phases when the long-range vision expands:

- **P0 — Constitution & Foundation:** complete within declared scope.
- **P1 — Constitutional Prototype:** complete within declared scope.
- **P2 — Deterministic Kernel:** complete; canonical addressing, identity, serialization and addressed derivation are frozen by their versioned contracts.
- **P3 — Universe Skeleton:** complete within the P3 astronomy/schema-v1 sparse metadata scope.
- **P4 — Temporal Kernel & Mutable World:** complete within the v1 event/replay/checkpoint/archive scope.
- **P5 — Planetology / Terrain / Environment:** P5 v1 and Environment v2 are canonical and frozen within their declared scopes. Physical terrain elevation, real geology, oceans, greenhouse surface climate, XUV escape and related deferred science remain unsupported or research.
- **P6 — Biosphere & Evolution v1:** canonical and frozen within its declared fail-closed scope. Current real P5 Environment v2 evidence remains insufficient to establish a biosphere; positive biology is not a current product claim.
- **Product baseline on `main`:** v0.8 Founder Visual Closure is the promoted product baseline.
- **Current Wave IV / v0.9 work:** independent development evidence in PR #48; it is not part of this documentation baseline and is not release-ready while its required Rendering Production gate fails.

A phase marked complete means its **declared, evidence-gated, versioned scope** was completed. It never means the entire scientific domain or final product vision is finished forever.

## Architectural identity

```text
Universe Identity + versioned semantic manifests
        -> sparse canonical addresses / entity identities
        -> canonical procedural facts
        +  P4-owned versioned canonical history
        -> current canonical world
        -> derived simulation / late materialization
        -> presentation, rendering, audio and product experience
```

The semantic universe is a **Multiscale Reality Graph**, not a permanently instantiated object tree. Query context, current location, camera state and presentation LOD do not silently become entity identity. `REFINE`, `PROJECT` and `RECONCILE` are the cross-scale operations reserved for constraint-safe multiscale evolution.

## Product pillars

Future capability is judged across co-equal dimensions: scientific/model authority, systemic depth, player freedom, cross-scale continuity, graphics quality, UX quality, performance, portability, determinism, persistence, accessibility and certification. Automated tests are necessary but not sufficient for product completeness.

Rendering may beautify, interpolate and approximate under explicit presentation authority. It may not turn an unmodeled ocean, atmosphere, biome, city or terrain signal into scientific fact. UX should be universe-first: **Explore** is viewport-dominant direct manipulation, **Inspect** provides contextual scientific meaning, and **Lab** exposes raw addresses, hashes, manifests, replay, provenance and diagnostics for experts.

## Runtime profiles

**Strict Direct-Open** remains the portability baseline: one local HTML file, no required runtime network resource and no canonical dependence on origin-bound browser storage. **Enhanced** execution may opportunistically use capabilities such as WebGPU, additional workers or higher rendering quality, but Enhanced execution must not change canonical world meaning.

The distribution artifact may legitimately grow to tens or hundreds of megabytes, or beyond, when those bytes provide useful governed capability, embedded reference data, tests, shaders or assets. Artificial padding, duplicated unreachable payload and meaningless inflation remain forbidden. Distribution bytes and runtime working set are separate budgets.

## Key documents

- [Project Constitution](docs/CONSTITUTION.md)
- [Founder Vision](docs/VISION.md)
- [Long-range Architecture](docs/ARCHITECTURE.md)
- [Multiscale Reality](docs/MULTISCALE_REALITY.md)
- [Product Experience Vision](docs/PRODUCT_EXPERIENCE_VISION.md)
- [Certified-history Roadmap + Frontier link](docs/ROADMAP.md)
- [Frontier Workstreams and Current Gap Map](docs/FRONTIER_WORKSTREAMS.md)
- [Parallel Development Architecture](docs/PARALLEL_DEVELOPMENT_ARCHITECTURE.md)
- [Machine-readable Workstream DAG](docs/frontier/WORKSTREAM_DAG.json)
- [Non-normative State-of-the-Art Research](docs/STATE_OF_THE_ART_RESEARCH_2026.md)
- [Determinism Contract](docs/DETERMINISM.md)
- [Record & Certification Specification](docs/RECORD_SPEC.md)
- [Conformance Model](docs/CONFORMANCE.md)
- [Risk Register](docs/RISK_REGISTER.md)
- [Architecture Decision Records](docs/adr/README.md)

## Repository policy

`main` remains a coherent evidence-backed baseline. Substantial work proceeds through exact-base branches, explicit ownership and review. Research can advance aggressively but does not become canonical world truth without a versioned promotion transaction and evidence. The forward frontier DAG is planning metadata only; it is not canonical universe state.

## License

No project license has been selected yet. Until a license is explicitly added, do not assume permission beyond applicable copyright law.
