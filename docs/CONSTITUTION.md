# One File Universe Constitution

**Status:** P0 normative draft  
**Normative language:** MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are used as requirements terms.

## 1. Mission

One File Universe (OFU) is an experiment in software architecture, procedural generation and deterministic simulation whose canonical distribution artifact is one self-contained HTML document.

An OFU universe is not a pre-stored collection of worlds. It is a sparse, addressable space of canonical facts derived from a **Universe Identity** and materialized only when required. The project aims to combine meaningful procedural depth, bounded runtime cost, portable state, reproducible construction and public verification.

OFU MAY also pursue large-artifact records, but raw byte size is never the primary definition of success.

## 2. Constitutional invariants

1. **One canonical artifact.** A release claiming Strict conformance MUST be usable as one HTML file and MUST require no application-owned external file, CDN, server API, package installation or network resource at runtime.
2. **Modular source, single-file distribution.** Development MUST remain modular. The release HTML MUST be produced by a deterministic build pipeline; the generated HTML is not the primary source tree.
3. **Address space is not materialized state.** OFU MUST NOT require enumeration or simultaneous simulation of its theoretical universe.
4. **Universe Identity is explicit.** Canonical universe identity MUST include a master seed and a Generator Manifest identity. A seed alone MUST NOT silently identify a world across generator changes.
5. **Addressed generation.** Canonical procedural facts MUST be derived from canonical addresses and domain-separated deterministic derivation. Correctness MUST NOT depend on an implicit global RNG call order.
6. **Canonicality precedes acceleration.** Hardware acceleration, renderer choice, worker scheduling and frame timing MUST NOT alter canonical universe facts.
7. **Canonical / derived / presentation boundary.** Every subsystem MUST identify which outputs are authoritative canonical facts, derived simulation state, or non-authoritative presentation.
8. **Bounded working set.** The theoretical address space MAY be enormous; runtime memory, active entities and simulation work MUST be bounded by explicit budgets and levels of detail.
9. **Causal procedural generation.** Random entropy alone is not meaningful diversity. Higher-order domains SHOULD derive consequences from lower-order causes where doing so produces coherent, inspectable worlds.
10. **Versioned evolution.** Generator, event and serialization semantics MUST be versioned. Breaking changes MUST create explicit lineage or migration; they MUST NOT silently rewrite an existing universe.
11. **Portable state is authoritative.** Browser storage MAY accelerate or improve usability, but canonical user state MUST have a portable export/import representation with integrity metadata.
12. **Evidence before claims.** No record, determinism, portability, scientific-fidelity or performance claim is considered certified without a defined test protocol and captured evidence.
13. **No artificial payload inflation.** Padding, deliberately duplicated payload and unreachable data MUST NOT count as certified functional payload.
14. **Reproducibility is a product property.** Release artifacts SHOULD be reproducibly buildable byte-for-byte from a pinned source commit and toolchain manifest.
15. **Failure must be explicit.** Unsupported capabilities, incompatible saves, invalid manifests and failed conformance checks MUST fail closed or degrade transparently; silent semantic fallback is prohibited.

## 3. Runtime profiles

### 3.1 OFU Strict Direct-Open

The normative portability profile.

A Strict artifact MUST:

- be one HTML file;
- execute when directly opened from local storage where the target browser permits local HTML execution;
- perform no network fetches or remote resource loads;
- keep canonical correctness independent of origin-bound optional storage;
- support a baseline renderer defined by the conformance specification or an explicitly documented non-graphical diagnostic mode;
- expose portable save export/import when mutable state exists.

Strict conformance MUST NOT depend on WebGPU, SharedArrayBuffer, cross-origin isolation, HTTP response headers, OPFS or a service worker.

### 3.2 OFU Enhanced

The exact same artifact MAY expose additional accelerations when executed in a more capable secure/origin environment. Enhanced capabilities MUST NOT change the canonical digest for the same Universe Identity and conformance corpus.

## 4. State model

OFU defines three authority layers:

1. **Canonical procedural baseline** — immutable facts derivable from Universe Identity, canonical address and generator semantics.
2. **Canonical mutable overlay** — versioned user/world events plus canonical checkpoints/compaction products.
3. **Derived and presentation state** — caches, meshes, particles, interpolation, transient AI detail, visual approximations and other rebuildable/non-authoritative products.

A subsystem MUST NOT promote presentation output into canonical state without an explicit contract and deterministic serialization.

## 5. Determinism classes

Every canonical function or subsystem MUST declare a determinism class:

- **D0 Presentation-only:** no canonical guarantee.
- **D1 Session deterministic:** repeatable only within a declared runtime environment; MUST NOT define portable universe facts.
- **D2 Canonical semantic:** canonical serialized output is identical for a declared conformance profile.
- **D3 Canonical bit-exact:** defined byte output is identical across the supported conformance matrix.

Core identity, addressing, PRF derivation, canonical serialization and golden-vector output MUST target D3.

## 6. Scientific and simulation honesty

OFU is not automatically a scientific simulator because it models scientific domains. Each domain MUST declare its fidelity class, assumptions, conserved quantities/invariants where applicable, and known non-physical approximations.

Suggested fidelity vocabulary:

- `FORMAL` — specification-level mathematical mechanism;
- `EMPIRICALLY_CONSTRAINED` — calibrated or bounded by external empirical knowledge;
- `STYLIZED_CAUSAL` — causal but intentionally simplified;
- `GENERATIVE_FICTIONAL` — designed for coherent fiction rather than physical prediction.

Unsupported precision MUST NOT be implied in the UI or documentation.

## 7. Evolution policy

OFU distinguishes:

- application version;
- canonical kernel version;
- Generator Manifest version/hash;
- subsystem generator versions;
- event schema version;
- save/archive schema version;
- record/conformance protocol version.

Backward compatibility is a deliberate policy, not an assumption. Historical artifacts MAY remain the authoritative executor for old lineages. Migration MUST be explicit and auditable.

## 8. Record philosophy

OFU rejects a single scalar claim such as "largest HTML" as sufficient evidence of technical merit. Certification MUST report a multidimensional record vector including artifact bytes, certified functional payload, executable extent, conformance, reproducibility, verification coverage, runtime budgets and procedural-quality evidence.

Raw artifact size MAY be celebrated, but MUST be reported separately from certified functional payload.

## 9. Governance of irreversible decisions

Architecture decisions with long-lived semantic consequences MUST be recorded as ADRs before dependent generators are stabilized. Implementation choices that are reversible — language, compressor, exact renderer optimization, allocator, specific fixed-point format — SHOULD remain open until measured prototypes provide evidence.

## 10. P0 exit gate

P0 is complete only when:

- Constitution, Vision, Architecture, Determinism, Record Specification, Conformance Model, Roadmap and Risk Register exist;
- foundational ADRs are accepted or explicitly marked experimental;
- repository structure and automated foundation validation exist;
- claims are separated into normative requirements, hypotheses and future targets;
- P1 has a falsifiable acceptance plan.

No production procedural universe generator should be treated as stable before this gate.

## 11. Project Language Policy

**English is the normative language of One File Universe.**

English MUST be used for source identifiers, comments, documentation, ADRs, schemas, manifests, tests, CI output, issues/specifications, pull requests, commit and release descriptions, and canonical user-facing terminology.

Future localization MAY provide translations, but translations are non-normative and MUST NOT define canonical identifiers, protocol semantics or authoritative terminology.

Foundation validation MUST enforce stable policy markers and repository conventions conservatively. It MUST NOT use a naive natural-language detector whose false positives could reject valid code, proper names, test vectors or future localization resources.
