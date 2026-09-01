# Foundational Architecture

## 1. Architectural thesis

OFU separates **identity**, **canonical state**, **derived simulation**, and **presentation**. The release artifact is one HTML file, but the source repository is modular and independently testable.

```text
SOURCE REPOSITORY
  contracts / schemas / kernel / generators / simulation / events
  persistence / rendering / audio / diagnostics / conformance / build
                         |
                         v
             DETERMINISTIC BUILD PIPELINE
                         |
                         v
                One_File_Universe.html
```

## 2. Runtime authority model

```text
Universe Identity
  = MasterSeed256 + GeneratorManifestHash
                |
                v
Canonical Address + Domain Tag + Property Tag
                |
                v
Addressed deterministic derivation
                |
                v
Canonical procedural baseline
                |
        + mutable event overlay
                |
                v
Canonical current facts
                |
        + derived simulation/cache
                |
                v
Presentation / rendering / audio
```

Presentation MUST NOT flow backward into canonical state without an explicit deterministic contract.

## 3. Sparse-addressed world model

The semantic universe may be hierarchical, but existence and properties SHOULD be queryable without enumerating all ancestors or siblings.

Canonical queries are conceptually shaped as:

```text
Derive(
  UniverseIdentity,
  CanonicalAddress,
  DomainTag,
  PropertyTag,
  CounterOrPurpose
) -> CanonicalValue
```

Dependencies between facts are permitted and desirable when causal, but dependency depth MUST be bounded and documented. The architecture does not require literal O(1) for every high-level fact; it requires **non-enumerative random access** with predictable cost.

## 4. Core layers

### 4.1 Bootstrap and capability probe

Responsibilities:

- boot from one HTML file;
- identify runtime profile/capabilities;
- initialize embedded payloads;
- run early integrity and conformance probes;
- select optional accelerations without changing canonical semantics.

### 4.2 Canonical kernel

Owns:

- fixed-width integer primitives;
- deterministic derivation/PRF interface;
- canonical addressing;
- deterministic numeric operations required by canonical generators;
- canonical serialization and hashing;
- Generator Manifest interpretation;
- golden-vector execution.

The implementation language is intentionally not fixed in P0. JavaScript/TypeScript, Rust/WASM, Zig/WASM or a hybrid implementation must be selected through evidence.

### 4.3 Generator domains

Planned domains include astronomy, planetology, terrain, climate, biosphere, species, civilization, language, economy and history.

Each domain MUST publish:

- namespace/domain tags;
- version;
- canonical inputs and outputs;
- determinism class;
- fidelity class;
- dependency graph;
- cost/LOD contract;
- invariants;
- conformance vectors.

### 4.4 Temporal and semantic simulation

Simulation uses semantic levels of detail:

- `COLD`: closed-form/statistical/macroscopic state;
- `WARM`: populations, ecosystems, economies and factions;
- `HOT`: regions, settlements, groups and concrete local processes;
- `IMMEDIATE`: entities directly relevant to gameplay/physics.

Refinement MUST preserve previously committed canonical facts. Detail is generated under constraints, not retroactively allowed to contradict history.

### 4.5 Mutable overlay

```text
CurrentCanonicalWorld
  = ProceduralBaseline
  + VersionedEvents
  + CanonicalCheckpoints
```

Events are append-oriented, schema-versioned and auditable. Checkpoints MAY compact replay cost but MUST be deterministically derived and verifiable against the event lineage they replace/cover.

### 4.6 Persistence

The portable save/archive format is authoritative. Browser-local storage is an optional convenience/cache layer.

A save must be able to identify:

- Universe Identity;
- generator lineage;
- event schema lineage;
- event/checkpoint state;
- integrity hashes;
- compatibility requirements.

### 4.7 Rendering and audio

Rendering and audio are consumers of canonical/derived state.

Baseline architecture:

- WebGL2 or a documented diagnostic fallback for Strict portability;
- WebGPU as optional acceleration where supported;
- Workers and transferable buffers as portable parallelism;
- SharedArrayBuffer only as optional Enhanced acceleration.

GPU results MUST NOT be authoritative for canonical facts unless a future conformance profile proves deterministic semantics for the exact operation.

## 5. Runtime budgeting

OFU MUST use capability probing and explicit runtime budgets rather than assume fixed browser limits.

Budgets include:

- active canonical entities;
- derived entity/cache count;
- CPU milliseconds per frame/job class;
- resident heap target;
- worker count;
- GPU buffers/textures;
- generation queue depth;
- save/event growth.

Quality profiles MAY adapt visual and derived detail, but MUST NOT alter canonical results.

## 6. Build architecture

The build system must eventually provide:

1. pinned toolchain inputs;
2. normalized ordering and canonical manifests;
3. timestamp/environment neutralization where possible;
4. deterministic bundling of JS/CSS/WASM/shaders/data/tests;
5. single HTML output;
6. external SHA-256 and build report;
7. internal component manifest and hashes;
8. independent rebuild comparison.

Compression, binary embedding format and exact toolchain remain P1 experiments until measured.

## 7. Dependency rule

The release artifact has no application-owned external runtime dependency. The browser platform itself is explicitly part of the declared execution environment.

Source/build dependencies MAY exist but MUST be pinned, auditable and absent from the final runtime dependency graph unless their output is embedded in the artifact.

## 8. Architectural quality gates

No generator domain becomes stable until it has:

- a canonical input/output contract;
- versioned domain namespace;
- conformance vectors;
- determinism classification;
- cost and simulation-LOD policy;
- provenance/fidelity documentation;
- compatibility policy.
