# One File Universe

**One file. One universe. Verifiable by construction.**

One File Universe (OFU) is an experiment in software architecture, procedural generation and deterministic simulation whose canonical release artifact is a **single self-contained HTML file**.

The ambition is not merely to generate a huge theoretical seed space or to inflate an HTML file. OFU is being designed to combine:

- a sparse, astronomically large procedural address space;
- deterministic random access to canonical world facts;
- causal generation from astronomy through planets, biospheres, civilizations and history;
- semantic simulation levels of detail with bounded runtime cost;
- portable, versioned mutable world history;
- modular source code compiled into one standalone HTML artifact;
- offline operation without application-owned external runtime resources;
- cross-runtime conformance, reproducible builds and public verification;
- a multidimensional, anti-padding record protocol.

## Current status

**P0 — Constitution & Foundation**

No production universe generator is considered stable yet. This is deliberate: the repository first defines the semantic rules that would become extremely expensive to change once worlds, histories and saves exist.

## Core model

```text
UniverseIdentity
= MasterSeed256
+ GeneratorManifestHash
+ CanonicalProtocolVersion

Canonical query
= UniverseIdentity
+ CanonicalAddress
+ DomainTag
+ PropertyTag

Current world
= ProceduralBaseline
+ VersionedEvents
+ CanonicalCheckpoints
```

The semantic universe may look hierarchical — Universe → Galaxy → System → Planet → Biosphere → Civilization — but it is designed as a **sparse-addressed space**, not a fully materialized tree.

## Runtime profiles

### Strict Direct-Open

The portability baseline: one local HTML, no required network, no required application-owned external resources and no canonical dependence on origin-bound browser storage.

### Enhanced

The same artifact may opportunistically use capabilities such as WebGPU, stronger browser storage or shared-memory acceleration where the environment permits them. Enhanced execution must not change canonical world meaning.

## Constitutional rules

Among the project's non-negotiable foundations:

- modular source → deterministic single-artifact build;
- seed and generator lineage are separate concepts;
- addressed, domain-separated derivation rather than global sequential RNG semantics;
- canonical state is separated from derived and presentation state;
- canonical numeric behavior must be explicitly reproducible;
- hardware acceleration cannot silently define universe truth;
- simulation detail is relevance/LOD driven rather than global;
- late materialization must satisfy previously committed facts;
- portable saves are authoritative; browser storage is optional convenience/cache;
- record claims require evidence and distinguish raw bytes from Certified Functional Payload;
- irreversible semantic decisions are ADR-governed.

## Foundation documents

- [Project Constitution](docs/CONSTITUTION.md)
- [Vision](docs/VISION.md)
- [Foundational Architecture](docs/ARCHITECTURE.md)
- [Determinism Contract](docs/DETERMINISM.md)
- [Record & Certification Specification](docs/RECORD_SPEC.md)
- [Conformance Model](docs/CONFORMANCE.md)
- [Development Roadmap](docs/ROADMAP.md)
- [Risk Register](docs/RISK_REGISTER.md)
- [Architecture Decision Records](docs/adr/README.md)

## Roadmap

OFU uses evidence gates rather than calendar promises:

`P0 Constitution → P1 Constitutional Prototype → P2 Deterministic Kernel → P3 Universe Skeleton → P4 Temporal Kernel → P5 Planetology → P6 Biosphere → P7 Civilization → P8 History → P9 Gameplay → P10 Product Maturity → P11 Certification → P12 Scale Campaign`

The crucial next phase, P1, is intentionally small. It exists to falsify dangerous assumptions about direct-open execution, deterministic single-file builds, embedded executable payloads, workers, baseline rendering, portable saves and canonical digests **before the first serious procedural universe is built**.

## Validation

The P0 foundation validator is dependency-free:

```bash
npm test
```

GitHub Actions runs the same validation on pushes and pull requests.

## Record philosophy

OFU may eventually attempt extraordinary single-file scale, but `largest HTML by bytes` is treated only as one factual dimension. Certified releases will report a Record Vector covering artifact size, Certified Functional Payload, executable extent, functional coverage, canonical conformance, procedural quality, reproducibility, verification coverage and working-set efficiency.

Padding and deliberate duplication may increase raw bytes but do **not** count toward Certified Functional Payload.

## Repository policy

`main` should remain a coherent, reviewable baseline. Substantial phases should proceed through feature branches and evidence-backed pull requests. Generated giant release artifacts are build products; the repository remains the source of truth.

## License

No project license has been selected yet. Until a license is explicitly added, do not assume permission beyond what applicable copyright law grants.
