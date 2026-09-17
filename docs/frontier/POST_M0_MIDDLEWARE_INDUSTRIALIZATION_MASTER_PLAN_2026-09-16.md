# One File Universe — Post-M0 Product + Middleware Industrialization Master Plan

**Status:** ACTIVE FORWARD-PLANNING OVERLAY / `PLANNING_METADATA_ONLY`  
**Date:** 2026-09-16  
**Repository:** `VaX1989/One_File_Universe`  
**Planning branch:** `roadmap/post-m0-middleware-industrialization-2026-09-16`  
**Authoritative planning base branch:** `experiment/spatial-continuum-r6-causal-universe-2026-09-14`  
**Authoritative planning base SHA:** `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e`  
**Authoritative planning base tree:** `3704247247940fa8c5f08291cd80ec9e24e7d49d`  
**Stable released `main` remains:** `5f3dbdcccc409c3bc29684e062ad7730ddea0c69` / tree `f84f05f9a12e110bb48f7605d8f577b0886dfe02`  
**R6/W0 M0 certified candidate:** `5a8774826dd5514b97f649669ba06dfaba9b91ff` / tree `3704247247940fa8c5f08291cd80ec9e24e7d49d`  
**R6/W0 merge commit into active R6:** `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e`  
**Historical freeze:** `OFU-R6-W0-2026-09-15-27657AB9`

This document supersedes the stale planning assumptions of `STATE_OF_THE_ART_MASTER_ROADMAP_2026-09-15.md` and PR #275. It does **not** rewrite certified history, promote canonical science, merge PR #274, mutate `main`, tag or release. It converts the now-closed M0 reality into a new dual-track program:

1. continue evolving One File Universe as the reference product and scientific/procedural universe;
2. extract and industrialize the reusable deterministic substrate as a headless middleware/runtime, SDK and open interoperability standard.

The two tracks must share conformance contracts but must not become coupled so tightly that the middleware depends on the OFU renderer/product shell or that the product is frozen until every SDK target exists.

---

# 1. Executive architecture decision

The repository should no longer be planned only as a progressively more advanced single-file universe application.

The target architecture is:

> **OFU becomes both a reference product and the reference implementation of a deterministic, persistent, multiscale procedural reality substrate.**

The industrial product category is best described as:

> **Deterministic Multiscale Reality Middleware**

The middleware must be able to identify, derive, query, refine, evolve, evict, reconstruct and project world state without requiring the full universe to be materialized or stored.

The product remains valuable because it continuously exercises the same contracts under extreme scale, direct-file/offline constraints, real navigation, persistence, rendering and scientific authority. It therefore becomes a permanent conformance consumer rather than throwaway legacy UI.

## 1.1 Core product promise

For the same declared protocol versions, semantic manifest, universe identity, canonical address, history and property request:

`same canonical inputs -> same canonical result`

independently of:

- rendering engine;
- camera path;
- GPU vendor;
- frame rate;
- cache state;
- scheduling order;
- worker completion order;
- memory budget, provided the request is admitted;
- host engine object identity;
- whether the result is produced in browser/WASM, native CLI, Unreal, Unity, Godot or server runtime.

Resource constraints may change **when**, **whether**, and at what **presentation fidelity** something is materialized. They must not silently change canonical truth.

---

# 2. Updated repository reality after M0

## 2.1 What is now established

R6/W0 M0 is no longer an unfinished roadmap item. PR #276 was certified and merged into the active R6 branch. The resulting active R6 head is `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e` with tree `3704247247940fa8c5f08291cd80ec9e24e7d49d`.

The M0 convergence established, within its declared scope:

- deterministic single-file build;
- direct-file/offline execution;
- bounded resource behavior under the certified soak;
- multi-world materialization/eviction/rematerialization;
- cross-scale journey through UNIVERSE -> ATOMIC and reverse/interruption recovery;
- explicit scientific authority boundaries at lower scales;
- aggregate browser convergence across Chromium/Firefox/WebKit;
- exact-head build and clean-room certification;
- R6 product continuity sufficient to close the specific M0 wave.

The external evidence boundary remains real: hosted CI was not physical-GPU proof and must not be rewritten as such.

## 2.2 What M0 does **not** establish

M0 does not establish:

- a public native ABI;
- native SDK packaging;
- cross-language canonical conformance beyond the existing scope;
- Unreal/Unity/Godot integrations;
- durable transactional storage suitable for long-running native/server products;
- distributed/network authority;
- an open standards governance process;
- commercial SDK documentation/support tooling;
- broad scientific completeness across all domains/scales;
- a license strategy for an open standard plus proprietary/commercial runtime;
- final physical-device performance certification for every target.

These become explicit industrialization work rather than implicit future expectations.

## 2.3 Current strategic constraint

PR #274 remains the active R6 development PR. This plan must not merge it or mutate `main` merely because M0 closed. Product evolution and industrialization are separate promotion decisions.

---

# 3. Architectural decomposition to freeze

Industrialization requires separating five layers that are currently present conceptually but not yet shipped as independent products.

```text
+-------------------------------------------------------------+
| OFU REFERENCE PRODUCT                                      |
| navigation / UX / renderer / audio / single-file packaging |
+-------------------------------+-----------------------------+
                                |
                                v
+-------------------------------------------------------------+
| DOMAIN PACKS                                                |
| astronomy / planetology / environment / life / future ...  |
+-------------------------------+-----------------------------+
                                |
                                v
+-------------------------------------------------------------+
| OFU RUNTIME                                                 |
| query / providers / jobs / budgets / cache / temporal state|
| persistence / observability / materialization / cancellation|
+-------------------------------+-----------------------------+
                                |
                                v
+-------------------------------------------------------------+
| OFU CORE                                                    |
| canonical bytes / manifests / identity / addresses / PRF   |
| numeric contract / digests / authority primitives          |
+-------------------------------+-----------------------------+
                                |
                                v
+-------------------------------------------------------------+
| OPEN SPECIFICATION + CONFORMANCE                            |
| binary grammar / algorithms / vectors / error semantics     |
+-------------------------------------------------------------+
```

## 3.1 OFU Core

Must be fully headless and have no dependency on:

- DOM;
- WebGL/WebGPU;
- Babylon;
- browser events;
- camera;
- renderer geometry;
- product state;
- host engine objects.

Owns only normative deterministic primitives and the minimal data structures required to express them.

## 3.2 OFU Runtime

Owns:

- universe instances;
- provider registry;
- capability discovery;
- query admission;
- materialization DAGs;
- bounded scheduling;
- resource ledger;
- cancellation and stale-work rejection;
- canonical event application;
- checkpoint/archive integration;
- caches and eviction;
- metrics/tracing;
- host-independent async execution.

The runtime may use threads, workers, SIMD or GPU-derived acceleration only where those mechanisms cannot alter canonical semantics.

## 3.3 Domain Packs

Scientific/generative domains must become plugins/providers over Core/Runtime contracts.

Examples:

- `ofu-domain-astronomy`;
- `ofu-domain-planetology`;
- `ofu-domain-environment`;
- `ofu-domain-biology`;
- future `ofu-domain-history`, `ofu-domain-civilization`, `ofu-domain-matter`.

A domain may be canonical, model-derived, experimental or presentation-only depending on its declared authority. The open standard must not encode OFU's current astronomy/planet models as universal truth.

## 3.4 Host Adapters

Adapters project OFU data into external engines:

- Unreal;
- Unity;
- Godot;
- Web/WASM;
- headless/server;
- optional OpenUSD/Cesium/3D Tiles bridges where semantically appropriate.

Host-native scene objects are views, not canonical entities.

## 3.5 Reference Product

The existing single-file universe remains a reference product and adversarial consumer. It should progressively depend on the same public seams as external SDK consumers.

No forced rewrite is allowed until parity has been proven.

---

# 4. Normative vs non-normative boundary

Every future specification and implementation change must declare which side of this boundary it belongs to.

## 4.1 Normative candidates

- canonical binary value encoding;
- Unicode normalization/version profile;
- numeric semantics and overflow rules;
- semantic manifest hashing;
- Universe Identity;
- Entity Identity;
- canonical hierarchical address encoding;
- deterministic domain/property derivation;
- authority/provenance envelope semantics;
- canonical event ordering and transition rules;
- checkpoint/archive identity semantics;
- REFINE/PROJECT/RECONCILE multiscale contracts;
- resource-independence invariants;
- protocol version negotiation and rejection behavior;
- conformance corpus and malformed-input behavior.

## 4.2 Implementation-defined but constrained

- scheduler implementation;
- thread count;
- cache implementation;
- persistence backend;
- networking transport;
- renderer;
- GPU acceleration;
- editor/UI;
- asset representation;
- profiling backend.

These may vary if externally observable canonical outcomes remain conformant.

## 4.3 Product/domain-specific

- OFU visual art direction;
- specific galaxy/planet terrain presentation;
- particular scientific models;
- current Spatial Continuum camera language;
- Babylon integration;
- one-file HTML packaging;
- Explorer/Scientist/Director UX.

They remain important but are not open-standard primitives.

---

# 5. Protocol and format family to formalize

The following names are planning identifiers. Existing protocol names retain their historical meaning; new names are not frozen until a specification review passes.

| ID | Working name | Purpose | Initial source of truth |
|---|---|---|---|
| `OFU-CBV` | Canonical Binary Value | byte-identical canonical value serialization | current P2 canonical encoding |
| `OFU-SM` | Semantic Manifest | semantic/version universe contract | current semantic manifest |
| `OFU-UID` | Universe & Entity Identity | universe-bound stable identities | current P2 identity rules |
| `OFU-CA` | Canonical Address | hierarchical stable address encoding | current P2 address rules |
| `OFU-DERIVE` | Deterministic Derivation | domain/property/counter separated derivation | current HMAC-SHA-256 derivation contract |
| `OFU-AUTH` | Authority Envelope | authority, provenance, model, assumptions, limits | PX/provider authority model |
| `OFU-QUERY` | Query/Result Envelope | host-independent query and result contract | provider/query seams |
| `OFU-TEMP` | Temporal State | event, ordering, transition, lineage, replay | P4 |
| `OFU-CHK` | Checkpoint | replay acceleration without new truth | P4 checkpoint semantics |
| `OFU-ARCHIVE` | Portable Archive | transportable bounded history/state package | P4/archive + current portable save ancestry |
| `OFU-XSR` | Cross-Scale Reconciliation | REFINE/PROJECT/RECONCILE semantics | current cross-scale contracts |
| `OFU-BUDGET` | Resource Budget | admission, work and materialization budgets | scheduler/resource ledger/materialization runtime |
| `OFU-CAP` | Capability Profile | supported domains/features/backend capability | future SDK/runtime capability negotiation |

## 5.1 Canonical serialization rule

JSON, Protobuf, FlatBuffers, MessagePack, USD and engine-native serializers may be transport/adaptation formats. They must not silently replace canonical identity bytes.

Canonical digests must be computed over the declared canonical format/version only.

## 5.2 Anti-hallucination rule

Every result that crosses a standard boundary must be able to express its epistemic class.

Minimum planning taxonomy:

- `CANONICAL_PROVEN`;
- `DERIVED`;
- `MODEL_DERIVED_SIMULATION`;
- `MEASURED_RUNTIME_EVIDENCE`;
- `PRESENTATION_ONLY`;
- `UNKNOWN`;
- `UNSUPPORTED`.

These are categories, not confidence scores.

No renderer, AI model, heuristic, cache or host engine may promote a result into a stronger authority class by presentation or repetition.

## 5.3 Deterministic is not scientifically true

A deterministic model can still be scientifically incomplete or wrong. Therefore a model-derived scientific result must carry, where applicable:

- model ID;
- model version;
- source/provenance;
- units;
- assumptions;
- applicability;
- uncertainty/error semantics;
- known limitations;
- authority class.

---

# 6. Open standard strategy

## 6.1 Working title

Use **OMDRS — Open Multiscale Deterministic Reality Standard** as a provisional planning name only.

The name is not a release claim and may change after trademark, governance and community review.

## 6.2 Standard layers

### OMDRS-CORE
Canonical values, numeric contract, Unicode profile, hashes, manifests and identities.

### OMDRS-ADDRESS
Canonical hierarchical address and namespace semantics.

### OMDRS-DERIVATION
Stateless domain-separated deterministic derivation.

### OMDRS-AUTHORITY
Provenance/authority/model/uncertainty/unknown semantics.

### OMDRS-TEMPORAL
Events, order, transition contracts, replay, lineage and checkpoint semantics.

### OMDRS-MULTISCALE
Regimes, REFINE, PROJECT, RECONCILE and conservation/error rules.

### OMDRS-RUNTIME
Resource independence, budgets, cancellation, bounded materialization and capability negotiation.

### OMDRS-CONFORMANCE
Golden vectors, malformed vectors, independent implementations, fuzz corpus and compatibility tests.

## 6.3 Standardization principle

Standardize **how a procedural reality declares and preserves meaning**, not the particular content of the OFU universe.

Do not standardize one terrain algorithm, one climate model, one galaxy distribution or one renderer.

---

# 7. Public runtime API model

The public API must be host-neutral and async-first.

A conceptual query contains:

```text
Query {
  universeIdentity
  targetAddress | entityId
  temporalContext
  capability
  property
  modelRegime
  requestedFidelity
  requestedResolution
  budget
  deadline/cancellation
}
```

A conceptual result contains:

```text
Result {
  status
  authority
  model/modelVersion
  value
  units
  uncertainty
  provenance
  assumptions
  limitations
  commitmentDigest
  semanticDigest
  historyDigest
  resourceUsage
}
```

Required result states include at least:

- `VALUE`;
- `UNKNOWN`;
- `UNSUPPORTED`;
- `DEFERRED`;
- `CANCELLED`;
- `BUDGET_EXCEEDED`;
- `VERSION_MISMATCH`;
- `INVALID_CANONICAL_INPUT`.

The runtime must never substitute plausible data when the contract says unknown or unsupported.

---

# 8. Native implementation strategy

## 8.1 Reference implementation recommendation

The preferred implementation experiment is **Rust core/runtime with a stable C ABI**, plus WASM compilation.

This is an implementation recommendation, not a standard requirement.

Before locking Rust as the commercial implementation language, an I0 feasibility spike must verify:

- bit-exact canonical compatibility;
- WASM size/startup;
- Windows/Linux/macOS packaging;
- Unreal/Unity/Godot FFI ergonomics;
- allocator/ownership model;
- panic/error boundary safety;
- cross-compiler deterministic behavior for normative operations.

## 8.2 C ABI rules

The ABI should prefer:

- opaque handles;
- immutable byte buffers;
- explicit allocator ownership;
- no language-specific exceptions across the boundary;
- explicit error/result codes;
- versioned struct sizes;
- feature negotiation;
- stable symbol naming;
- callback/task handles rather than exposing internal threads.

Conceptual surface:

```text
ofu_runtime_create/destroy
ofu_universe_open/close
ofu_query_submit
ofu_job_poll/wait/cancel
ofu_event_propose/commit
ofu_checkpoint_create
ofu_archive_export/import
ofu_provider_register/unregister
ofu_runtime_tick
ofu_runtime_metrics
```

No host engine object may be part of canonical identity.

---

# 9. Migration strategy: no big-bang rewrite

Industrialization must proceed through compatibility layers.

## Stage A — Specification harvest

Freeze and extract existing canonical rules and test vectors without changing behavior.

## Stage B — JavaScript modular seam

Introduce a headless JS-facing internal boundary around existing Core/Runtime behavior while retaining the current global/IIFE application path as a compatibility consumer.

## Stage C — Native shadow implementation

Run native Core beside the existing JS authority on the same corpus and compare canonical bytes/digests/results.

Native output is not authoritative until cross-language parity passes.

## Stage D — Runtime shadow mode

Selected runtime queries execute through both implementations in test/dev modes. Divergence is a hard failure with a minimal witness.

## Stage E — Adapter migration

The reference product consumes the public runtime seam for selected capabilities while preserving exact product tests.

## Stage F — Host SDKs

Only after Core/Runtime contracts are stable enough to avoid making engine integrations disposable.

---

# 10. Industrialization workstreams

## I-GOV — Specification and governance

**Priority:** P0  
**Mission:** freeze normative surfaces, versioning, compatibility and authority rules.

Deliverables:

- protocol inventory;
- normative/informative map;
- ADRs;
- compatibility policy;
- deprecation policy;
- standard extension registry policy;
- semantic-version rules distinct from product versioning.

Exit gate: every canonical byte/state dependency has a named owner and versioning rule.

## I-CONF — Independent conformance

**Priority:** P0  
**Mission:** make conformance independent of one language/runtime.

Deliverables:

- canonical golden corpus;
- malformed/rejection corpus;
- JS reference implementation;
- Python oracle coverage expansion;
- native implementation;
- fuzz/property tests;
- reproducible corpus digest;
- cross-architecture matrix.

Exit gate: JS + Python + native agree on all normative vectors and rejection behavior.

## I-CORE — Native headless core

**Priority:** P0  
**Mission:** implement canonical values, manifests, identity, addresses, derivation and numeric rules with no renderer/browser dependency.

Exit gate: bit-exact corpus parity and stable C ABI candidate.

## I-RUNTIME — Headless runtime

**Priority:** P0  
**Mission:** extract query/provider/materialization/resource state machine.

Deliverables:

- runtime instance lifecycle;
- provider registry;
- async job model;
- deterministic admission;
- cancellation/stale-work semantics;
- scheduler/resource ledger;
- cache keys bound to semantic/history/provider identity;
- observability.

Exit gate: headless CLI can open a universe and answer bounded queries without DOM/rendering.

## I-PERSIST — Durable persistence

**Priority:** P0/P1  
**Mission:** map P4 semantics onto industrial storage without changing P4 truth.

Required capabilities:

- append-only/WAL-compatible event durability;
- atomic checkpoint publication;
- crash consistency;
- portable archive;
- migration/version verification;
- pluggable memory/file/SQLite-or-equivalent backend;
- bounded long-history policies;
- recovery tests.

Later extensions may include replication and branch/revision policies, but not before single-node durability is proven.

## I-PROVIDER — Provider/plugin ABI

**Priority:** P0/P1  
**Mission:** allow domains and third parties to implement capabilities without linking to product internals.

Provider descriptors must include:

- provider ID/version;
- contract version;
- authority;
- capabilities;
- regimes;
- dependencies;
- input/output schemas;
- fidelity profiles;
- cost/budget metadata;
- query/refine/project/reconcile/transition hooks as applicable.

Exit gate: one built-in domain can be moved behind the ABI with no canonical drift.

## I-SEC — Security and hostile-input hardening

**Priority:** P0/P1  
**Mission:** treat archives, provider packets and network-facing future inputs as untrusted.

Required work:

- parser limits;
- canonical rejection tests;
- archive bombs/decompression limits where applicable;
- integer/size overflow review;
- fuzzing;
- memory-safety boundary review;
- timeout/cancellation abuse;
- provider sandbox/capability policy research;
- path/file handling security;
- supply-chain/SBOM process.

## I-SDK — SDK surface and tooling

**Priority:** P1  
**Deliverables:**

- C headers;
- generated bindings where appropriate;
- CLI;
- inspector;
- conformance runner;
- profiler/tracing viewer;
- sample providers;
- API reference;
- integration examples.

## I-UE — Unreal adapter

**Priority:** P1  
Recommended first commercial engine integration because it exercises native ABI, threading, large-world rendering and packaging rigor.

First proof:

`same universe + same address + same history + same property -> same canonical digest in native CLI, browser/WASM and Unreal`.

## I-UNITY — Unity adapter

**Priority:** P1/P2  
C# binding over the same C ABI; no Unity-native semantic fork.

## I-GODOT — Godot adapter

**Priority:** P1/P2  
GDExtension/C++ or equivalent binding over the same native runtime.

## I-WASM — Web/WASM distribution

**Priority:** P1  
The browser reference product should eventually consume the same Core/Runtime semantics through a compatible WASM path where this does not break direct-file/offline requirements.

## I-STD — Open standard publication

**Priority:** P1/P2  
Begins drafting early, but normative 1.0 publication waits for multiple independent conforming implementations.

## I-LIC — Licensing and IP boundary

**Priority:** P0 business blocker  
The GitHub repository currently has no repository-level license declaration. Before external SDK distribution, resolve:

- code license;
- specification/document license;
- conformance vector license;
- third-party notices and redistribution obligations;
- trademark naming policy;
- contributor/IP policy;
- open-standard vs commercial-runtime boundary.

This plan does not choose a license; that requires an explicit founder/legal decision.

## I-DOC — Developer experience

**Priority:** P1  
Documentation must be built around integration tasks, not repository archaeology.

Minimum paths:

- 15-minute headless query;
- create/open universe;
- register provider;
- query a canonical property;
- apply/replay events;
- checkpoint/archive;
- enforce a budget;
- integrate one engine;
- inspect authority/provenance;
- diagnose a conformance failure.

---

# 11. Reference product continuation after M0

M0 is closed, but the earlier product roadmap still contains valuable successors. Reclassify them as post-M0 product tracks rather than unfinished M0 blockers.

## P-M1 — Perceptually vast causal universe

Continue macro scale/depth, world differentiation, visual hierarchy and sense-of-place work, but do not couple these art/product changes to Core standardization.

## P-M2 — Scientific interrogation

Scientific fingerprint, typed WHY graph, provenance/uncertainty and instruments.

## P-M3 — Temporal/persistent exploration

Expose P4 time, snapshots, exact return and Atlas semantics at product level.

## P-M4 — Intelligent exploration

Bounded search, similarity, anomaly/interestingness and discovery assistance.

## P-M5 — Analytical universe

Compare, causal divergence, measurements, controlled counterfactuals.

## P-M6 — Immersive/directable universe

Systemic audio, sonification and Director tools.

## P-M7 — Self-observing quality system

Quality Observatory, mass falsification, perceptual diversity, device and resource campaigns.

## P-M8 — Living/historical universe

Only after scientific/state prerequisites: life, ecology, evolution, deep history, civilization and later local cognition.

These product milestones can proceed in parallel with industrialization where ownership surfaces do not collide.

---

# 12. Product <-> middleware bridge

The bridge is a first-class workstream because an SDK that no longer powers OFU would drift, and a product that bypasses the SDK would fail to validate it.

Bridge rules:

1. Product canonical identity/state remains owned by shared Core/Runtime contracts.
2. Renderer/camera/UX remain product-side consumers.
3. Browser compatibility shims may exist temporarily but may not redefine canonical semantics.
4. Every migrated capability receives dual-path differential tests.
5. Product performance regressions caused by abstraction must be measured, not accepted by architecture preference.
6. Exact single-file/offline packaging remains a supported reference profile even if commercial SDKs use normal library packaging.
7. Migrations are reversible until the new path passes the full applicable evidence gate.

---

# 13. Cross-scale standardization program

OFU's cross-scale work should become more than rendering LOD.

For every reversible claimed bridge, define:

- parent commitment;
- child identity derivation;
- spatial containment;
- coordinate/frame semantics;
- units;
- conserved quantities, if any;
- permitted lossy projections;
- observable aggregation;
- error bounds;
- authority inheritance restrictions;
- unsupported transitions;
- reconciliation failure behavior.

`REFINE` must not mean "draw more polygons". It means introduce a more detailed representation/state under a declared contract without changing the identity of the reality being refined.

`PROJECT` must define what can be safely summarized upward.

`RECONCILE` must detect incompatible child/parent commitments instead of silently averaging contradictions away.

---

# 14. Persistence and future distributed state

## 14.1 First industrial goal: durable single-node runtime

Do not begin with multiplayer consensus.

First prove:

- crash-safe append;
- canonical replay after restart;
- checkpoint equivalence;
- compaction equivalence;
- migration validation;
- bounded archive import/export;
- deterministic recovery.

## 14.2 Later distributed profile

Only after single-node semantics stabilize, define a separate distributed profile covering:

- authoritative event proposal/acceptance;
- replication;
- conflict/branch semantics;
- snapshot synchronization;
- deterministic server/client authority boundaries;
- anti-cheat/trust assumptions for game/simulation use.

Distributed ordering must not be smuggled into P4 without a versioned successor contract.

---

# 15. Performance model for an industrial runtime

Performance claims must distinguish:

- semantic discovery cost;
- provider computation;
- scheduling delay;
- serialization;
- cache hit/miss;
- persistence IO;
- host adapter cost;
- renderer cost;
- GPU presentation cost.

Required profiles:

- `STRICT_DETERMINISTIC_BASELINE`;
- `STANDARD_DESKTOP`;
- `MOBILE_CONSTRAINED`;
- `SERVER_HEADLESS`;
- optional `ENHANCED_GPU`.

Profiles may alter budgets and presentation fidelity. They may not silently alter canonical results.

Every runtime release should report at minimum:

- p50/p95/p99 query latency by capability;
- throughput;
- peak/steady memory;
- cache residency;
- cancellation latency;
- stale-work count;
- checkpoint/replay throughput;
- archive size/IO;
- long-soak growth;
- deterministic result digest.

---

# 16. Conformance and certification model

A future SDK release is not certified by aggregate unit tests alone.

## 16.1 Core conformance

- golden vectors;
- malformed vectors;
- Unicode edge cases;
- numeric boundaries;
- address round-trip;
- manifest/identity vectors;
- property-local derivation;
- independent oracle agreement.

## 16.2 Temporal conformance

- event ordering;
- reducer behavior;
- replay equivalence;
- checkpoint equivalence;
- compaction equivalence;
- archive round-trip;
- migration/version rejection.

## 16.3 Runtime conformance

- query-order invariance;
- worker-order invariance;
- bounded queue/cache/materialization;
- cancellation and stale-result rejection;
- resource-pressure invariance of admitted canonical results;
- deterministic rematerialization after eviction.

## 16.4 Provider conformance

- descriptor validation;
- dependency cycle detection;
- authority non-escalation;
- capability/fidelity negotiation;
- fail-closed unsupported state;
- cross-scale reconciliation.

## 16.5 Host adapter conformance

- identity preservation;
- no host-object-derived canonical IDs;
- same canonical query digest as headless runtime;
- lifecycle/disposal correctness;
- thread/async safety;
- engine restart/reload behavior.

---

# 17. Proposed repository topology

Do not move everything immediately. This is the target topology after the specification harvest proves boundaries.

```text
spec/
  core/
  address/
  authority/
  temporal/
  multiscale/
  runtime/
  conformance/

sdk/
  core/
  runtime/
  ffi/
  cli/
  bindings/
    c/
    cpp/
    csharp/
    wasm/

adapters/
  unreal/
  unity/
  godot/
  web/

domains/
  astronomy/
  planetology/
  environment/
  biology/

conformance/
  vectors/
  malformed/
  fuzz/
  oracles/
  reports/

product/
  web-single-file/

examples/
  headless-query/
  provider-plugin/
  temporal-replay/
```

The existing source tree remains authoritative until migration gates explicitly move ownership.

---

# 18. Execution waves

## IW0 — Industrialization foundation

**Start condition:** this planning overlay accepted.  
**Goal:** specification harvest and architectural seams without changing product semantics.

Parallel-safe lanes:

- I-GOV;
- I-CONF corpus expansion;
- I-LIC analysis;
- I-CORE feasibility prototype;
- I-SEC threat model;
- product read-only bridge audit.

No production path swap in IW0.

## IW1 — Native Core candidate

**Depends on:** normative P2/Core freeze sufficient for implementation.

Deliver:

- native Core;
- C ABI v0;
- JS/Python/native parity;
- WASM build feasibility;
- CLI canonical inspector.

## IW2 — Headless Runtime

**Depends on:** Core candidate + runtime seam contract.

Deliver:

- provider registry;
- query engine;
- scheduler/resource ledger;
- cache/materialization;
- cancellation;
- headless universe/query demo;
- product shadow-mode differential tests.

## IW3 — Persistence + provider SDK

Deliver durable storage adapters, archives, provider ABI and first external/provider example.

## IW4 — Engine integrations

Sequence by contract stability, not calendar pressure:

1. Unreal proof;
2. Web/WASM product bridge;
3. Unity;
4. Godot.

Parallel adapters are allowed only after C ABI/API freeze for the targeted version.

## IW5 — Open draft + external conformance

Publish a draft standard only when it is implementable without reading OFU source internals.

Require at least two materially independent conforming implementations before claiming a stable open standard.

## IW6 — Commercial SDK beta

Requires:

- versioned ABI;
- documented upgrade policy;
- security baseline;
- license/IP clarity;
- supported platform matrix;
- engine sample projects;
- conformance runner;
- observability/debugging;
- product bridge consuming the same semantics.

## IW7 — SDK 1.0 / Standard 1.0 readiness

Requires evidence, not feature count.

No 1.0 if canonical semantics, ABI compatibility or licensing remain ambiguous.

---

# 19. Parallel execution topology

Recommended initial maximum: **6 independent writer lanes + read-only adversarial reviewers**.

| Lane | Mission | Primary ownership | Dependency |
|---|---|---|---|
| `IND-GOV` | protocol inventory/spec/ADRs | `spec/**`, docs only | active R6 base |
| `IND-CONF` | corpus/oracles/conformance harness | additive conformance paths | no production writes |
| `IND-NATIVE` | native Core feasibility | isolated `sdk/core-native-experiment/**` | frozen vector set |
| `IND-SEC` | threat model/fuzz plan | security docs/additive tests | protocol inventory |
| `IND-LIC` | license/IP/third-party inventory | docs only | repository inventory |
| `IND-BRIDGE` | product/runtime seam audit + adapter proposal | docs/tests first | active product interfaces |

After IW0, add runtime/persistence/provider lanes only when ownership boundaries are frozen.

Central canonical files, current browser bootstrap, current renderer, package/build workflows and release metadata remain convergence-owned until an explicit ownership map says otherwise.

---

# 20. Critical technical gaps ranked

## P0

1. Normative protocol inventory and compatibility rules.
2. Cross-language conformance expansion.
3. Native Core feasibility and numeric semantics.
4. Stable host-neutral ABI design.
5. Headless query/runtime boundary.
6. Durable persistence mapping for P4.
7. Provider/plugin ABI.
8. Security/fuzzing boundary.
9. License/IP strategy.

## P1

10. Runtime observability/profiling.
11. Unreal integration.
12. Web/WASM shared runtime path.
13. Unity/Godot bindings.
14. SDK docs/examples.
15. Release packaging/signing/SBOM.
16. Multi-platform conformance farm.

## P2

17. Distributed/server replication profile.
18. OpenUSD/Cesium/3D Tiles interoperability profiles where useful.
19. Optional GPU compute acceleration.
20. Commercial editor/profiler ecosystem.
21. Third-party provider marketplace/registry, only after extension governance is mature.

---

# 21. Decision gates

## Gate G0 — Protocol harvest accepted

No canonical surface remains an unnamed implementation detail.

## Gate G1 — Independent Core parity

JS/Python/native conformance passes bit-exact vectors and rejection cases.

## Gate G2 — Headless runtime proof

A non-browser CLI opens a universe and answers meaningful bounded queries with no rendering dependency.

## Gate G3 — Product shadow parity

Selected reference-product capabilities produce identical canonical results through legacy and new runtime paths.

## Gate G4 — Durable state proof

Crash/restart/replay/checkpoint/archive evidence passes.

## Gate G5 — Provider ABI proof

A domain provider can live behind the public contract without touching product internals.

## Gate G6 — Engine proof

At least one external engine reproduces the same canonical query digest as CLI/browser.

## Gate G7 — Open-draft implementability

A third party can implement the draft specification from the documents/vectors alone.

## Gate G8 — Commercial beta

Security, license, docs, packaging, compatibility and observability are supportable.

## Gate G9 — 1.0

Two independent implementations plus stable ABI/spec versioning and migration policy.

---

# 22. What must not happen

- Do not rewrite working P2/P4 semantics in a new language before freezing their contracts.
- Do not let Rust, C++, WASM, Unreal or any host implementation become the standard itself.
- Do not hash JSON/engine objects when canonical bytes already define identity.
- Do not let renderer geometry become semantic authority.
- Do not let cache/resource pressure alter canonical values.
- Do not call presentation LOD a multiscale scientific refinement unless it satisfies a declared reconciliation contract.
- Do not promote a model because it is deterministic.
- Do not fill `UNKNOWN` with plausible data.
- Do not make AI-generated prose part of replay authority.
- Do not make WebGPU mandatory for semantic correctness.
- Do not start distributed consensus before durable single-node semantics are proven.
- Do not build four engine integrations against an unstable ABI.
- Do not publish an open-standard 1.0 that only OFU itself can implement.
- Do not merge PR #274 or mutate `main` as a side effect of this planning work.

---

# 23. Immediate next executable packet

After this planning PR is accepted, the first implementation program should be a **new isolated industrialization wave**, not an opportunistic edit of current R6 production files.

Create an exact-base control branch from the then-current accepted R6/product authority and execute:

1. `IND-GOV` — harvest P2/P4/PX/XSR normative contracts and produce the first specification index;
2. `IND-CONF` — extend independent vectors/oracles and define the conformance manifest;
3. `IND-NATIVE` — implement only the smallest P2/Core slice necessary to prove byte parity;
4. `IND-SEC` — threat model canonical parsers/archives/provider inputs;
5. `IND-LIC` — produce license/IP/third-party decision dossier;
6. `IND-BRIDGE` — map current browser globals/product seams into a future public runtime API without source migration yet.

The first implementation wave should **not** attempt Unreal, persistence replacement, domain rewrites or renderer migration.

The purpose of IW0 is to prove that the repository's strongest architectural ideas can be extracted without destabilizing the product that currently demonstrates them.

---

# 24. Definition of success

Industrialization is successful when all of the following can be true at once:

- the OFU web/single-file product still works offline and preserves its certified identity/history semantics;
- a headless native process opens the same universe;
- a WASM/browser consumer opens the same universe;
- an Unreal/Unity/Godot adapter can query the same universe;
- the same canonical request produces the same canonical digest across those hosts;
- host rendering quality can differ without changing world truth;
- world state can be evicted and reconstructed without loss of identity;
- canonical history can be replayed after restart from durable storage;
- providers declare authority, provenance and unsupported states explicitly;
- multiscale refinements declare what they preserve and how they reconcile;
- a third party can implement the open protocol from specification and vectors rather than source-code archaeology;
- the commercial runtime adds performance, tooling, integration and support value without making the open interoperability rules proprietary.

At that point One File Universe is no longer only a universe application. It is a reference product built on a reusable deterministic reality substrate that other products can embed.