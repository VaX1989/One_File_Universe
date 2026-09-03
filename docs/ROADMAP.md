# One File Universe Roadmap

**Roadmap style:** evidence-gated, not calendar-gated.  
A phase closes when its exit criteria are demonstrated, not because a date has elapsed.

## P0 — Constitution & Foundation

### Objective
Freeze the semantic rules that would be expensive to change after worlds and saves exist.

### Deliverables
- Project Constitution
- Vision and non-goals
- Foundational Architecture
- Determinism Contract
- Record & Certification Specification
- Conformance Model
- Risk Register
- ADR set for irreversible semantics
- foundation validator and CI
- initial source/test/tool structure

### Exit gate
All constitutional documents exist, foundation CI passes, unresolved implementation choices are explicitly classified as experiments rather than silently decided.

---

## P1 — Constitutional Prototype

### Objective
Attempt to break the project architecture before building valuable procedural content.

### Build the smallest end-to-end OFU artifact that demonstrates:
- modular source → deterministic build → one HTML;
- Strict direct-open bootstrap;
- zero required runtime network IO;
- component manifest and internal verification;
- candidate embedded WASM path without committing the entire architecture to WASM;
- Worker + transferable-buffer compute path;
- WebGL2 baseline scene or diagnostic renderer;
- WebGPU capability detection as optional acceleration;
- portable save/export/import round-trip;
- basic addressed derivation and canonical serialization;
- artifact/build reproducibility experiment.

### Adversarial questions
- Does `file://` break any required API on target browsers?
- Can the same HTML work in Strict and Enhanced profiles?
- Are worker/blob policies portable enough?
- Does embedded binary decoding cause unacceptable startup/RAM amplification?
- Can build outputs be byte-stable?

### Exit gate
A P1 artifact and evidence report demonstrating every mandatory item or documenting an architecture-changing failure.

---

## P2 — Deterministic Kernel

**P2 — COMPLETE**

### Objective
Create the portable authority oracle for all future generators.

### Deliverables
- canonical address schema;
- Universe Identity schema;
- Generator Manifest schema;
- domain-separated PRF/derivation implementation;
- deterministic numeric kernel selected by measured domain needs;
- canonical byte serialization;
- hash/digest layer;
- Golden Universe Corpus v1;
- concurrency/order-independence tests;
- cross-engine conformance harness.

### Exit gate
The same corpus produces the same normative digest across the declared executed runtime matrix. Any unavailable target is explicitly unverified.

---

## P3 — Universe Skeleton

**P3 — COMPLETE**  
Canonical schema v1 / astronomy model `p3-astronomy-1` is merged on `main`. The P1–P4 baseline executes real sparse random-access Region/Galaxy/Sector/System/Star/Planet/Moon queries from the shipped single-file artifact, with exact Entity Identity and query-order invariance covered by executable conformance.

### Objective
Prove sparse random access across astronomical scales without materializing the universe.

### Domains
Universe regions, galaxies, sectors, systems, stars, planets and moons as metadata/facts only.

### Requirements
- non-enumerative random access;
- bounded dependency depth;
- stable addressing;
- plausible distributions under an explicit fidelity class;
- no rendering dependency in canonical generation;
- statistical distribution tests and invariants.

### Exit gate
Large deterministic address samples satisfy invariants, distribution expectations and working-set budgets.

---

## P4 — Temporal Kernel & Mutable World

**P4 — COMPLETE**  
Canonical protocol `ofu-p4-temporal-v1` and transition contract `ofu.p4.core-transition@1.0.0` are merged on `main`. Full replay, checkpoints, bounded-tail deterministic compaction, lineage, portable archives and executable P3→P4 invariants are certified in the P1–P4 baseline.

### Objective
Define time before civilization/history depend on it.

### Deliverables
- canonical time/epoch model;
- event ordering semantics;
- event schema versioning;
- replay;
- checkpoints;
- deterministic compaction;
- save/archive format;
- migration/lineage hooks;
- hot/warm/cold/immediate simulation scheduler skeleton.

### Exit gate
Baseline + events → current state is deterministic; checkpointed and full replay resolve to the same canonical digest.

---

## P5 — Planetology, Terrain & Climate

**P5 v1 CANONICAL CORE — COMPLETE / CANONICAL / FROZEN**  
The controlled v1 promotion deliberately closes only the smallest scientifically honest planetary authority that can be frozen without pretending research is settled. The reference P1–P4 release `v0.4.0-preview.1` remains unchanged.

### Canonical v1 scope
- strict consumption of the real P3 `ofu-p3-p5-planetary-input-v1` producer at P3 schema v1 / `P4_T0`;
- exact preservation of P3-owned planet/system/star identity, orbit, insolation, baseline mass, bulk prior and solid-budget facts as canonical bytes / `BigInt` values;
- P2 Canonical Address and addressed derivation for promoted procedural semantics;
- bounded `TERRESTRIAL` realization for 1–8 Mearth only;
- deterministic integer/fixed-point composition refinement, radius, surface gravity and mean density;
- explicit evidence/fidelity classification and explicit `UNSUPPORTED` behavior outside the promoted model family;
- exact P2-addressed cube-sphere terrain topology with shared vertex identity, seams, refinement, `PROJECT` and `RECONCILE` invariants;
- sparse/direct-random-access terrain generation with bounded operation working set and no global planet heightmap;
- compact `ofu-p5-p6-environment-v1` downstream boundary exposing only promoted environmental constraints;
- P4-owned replay/checkpoint/compaction binding for static P5 genesis facts.

### Advanced P5 Environment v2 canonical successor

**Environment v2 — COMPLETE / CANONICAL / FROZEN.** PR #32 promoted the additive successor `ofu-p5-p6-environment-v2` / `p5-environment-2` without modifying frozen P5 v1 physical, terrain or v1 P5→P6 semantics.

Environment v2 canonically adds:

- explicit epistemic authority/provenance (`KNOWN`, `DERIVED`, `HYPOTHETICAL_MODEL_VALUE`, `UNKNOWN`, `UNSUPPORTED`);
- `ofu-p5-atmosphere-state-v2` with absolute teragram storage and exact volatile mass conservation;
- explicit `NO_CANONICAL_GENESIS` rather than promotion of the research volatile prior;
- deterministic `GLOBAL_SURFACE_COLUMN_PRESSURE` derived from governed retained atmosphere mass plus frozen P5 v1 gravity/radius;
- corrected Tier-0 radiative effective-temperature law `T_eff=[S(1-A)/(4 sigma)]^(1/4)` with integer/rational canonical numerics and Earth anchor `254.578 K` at Earth-normalized forcing and Bond albedo 0.3;
- a dedicated P2-validated Environment v2 Semantic Generator Manifest;
- independent Python oracle, versioned Golden corpus, Worker/query-order invariance, sparse working-set evidence, reproducible build and five-runtime canonical seal.

Frozen Environment v2 evidence:

- Semantic Manifest hash `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`;
- Golden corpus `golden-p5-environment-v2-corpus-v1` digest `ac33ba776976d1381a841426fb7e0fbb0276877e98565261bfdec2bca598d7a4`;
- promotion merge `ace38aac27b9098a9c01b390eeaa82933077f4be`, tree `838fc20d0028e77e33f8d54ac5c495e6422a5950`;
- first exact-main Environment v2 seal run `33737515944` — SUCCESS.

Environment v2 does **not** claim mean surface temperature. Actual Bond albedo remains `UNKNOWN`; greenhouse response, surface temperature, water phase/EOS, XUV evolution, endogenous atmospheric escape, geology/geochemical energy, actual ocean area and physical terrain elevation remain `UNSUPPORTED`. P4 remains sole owner of canonical time, events, replay, checkpoints, compaction and lineage. Future greenhouse/XUV/geology research is routed separately in issues #29, #30 and #31.

### Scientific disposition
The canonical v1 rocky mass-radius realization is an **EMPIRICALLY_CONSTRAINED / APPROXIMATE** bounded model. The deterministic terrestrial composition refinement is **HYPOTHETICAL / STYLIZED** and is not presented as inferred mineralogy. Gravity/density relationships are **ESTABLISHED / APPROXIMATE** under quantized inputs. Cube-sphere topology is **ESTABLISHED / FORMAL**. The current terrain elevation signal is **FICTIONAL / STYLIZED**, dimensionless and never represented as physical metres.

Environment v2 atmosphere conservation is **ESTABLISHED / FORMAL**; global spherical column pressure and the declared Tier-0 radiative law are **ESTABLISHED / APPROXIMATE** under their explicit assumptions. The rejected volatile genesis prior remains **HYPOTHETICAL / STYLIZED** and is not canonical world fact.

### Explicitly deferred research
The following are not silently approximated into canonical truth and remain future versioned research:
- water-rich / high-pressure EOS;
- sub-Neptune, ice-giant and gas-giant radius/evolution families;
- volatile genesis/partition calibration;
- atmosphere composition and greenhouse response;
- mean surface temperature and regional climate transport;
- XUV history/efficiency and calibrated escape evolution;
- detailed geodynamics/rheology and geochemical energy;
- physical terrain elevation scaling, oceans, plates, craters and erosion.

P5 v1 promotes no mutable physical transition contract. Environment v2 likewise promotes no endogenous atmospheric-loss transition generator. P4 remains the only canonical time, event ordering, replay, checkpoint, compaction, lineage and archive authority. A future mutable P5 model must introduce a versioned P5 reducer consumed by P4 and independently pass replay/checkpoint/repeated-compaction equivalence before promotion.

### Exit gate
P5 v1 closed after its actual candidate and exact main passed all frozen upstream, P3→P5, P4 binding, Golden, evidence, reproducible-build and cross-runtime gates. Environment v2 closed only after the same preservation discipline plus corrected scientific references, dedicated manifest lineage, independent oracle, Golden Environment corpus, Worker scheduling invariance and the five-runtime Environment seal passed on exact main. Unsupported research families do not block closure because they remain explicitly outside frozen scope.

---

## P6 — Biosphere & Evolution

### Objective
Make life constrained by environment and resources rather than assembled independently.

### Deliverables
- productivity/energy budgets;
- ecological niches and trophic relationships;
- morphology/genome generative grammar;
- evolutionary pressures/history abstraction;
- extinction/speciation event semantics;
- semantic simulation LOD.

### Exit gate
Generated biospheres satisfy energy/constraint invariants and diversity tests; late refinement does not contradict committed ecological facts.

---

## P7 — Civilization, Culture & Economy

### Objective
Generate societies as consequences of environment, history, resources and interaction.

### Domains
Population, settlement, institutions, technology, trade, language, culture, economy, factions, diplomacy/conflict.

### Exit gate
Civilizations exhibit causally explainable differences and can move between COLD/WARM/HOT states without semantic discontinuity.

---

## P8 — History & Late Materialization

### Objective
Create deep history without simulating every individual across cosmic time.

### Model
- macro history: aggregated/closed-form or coarse stochastic-deterministic transitions;
- meso history: states/events for regions, polities and settlements;
- micro history: constrained late materialization of people, artifacts, ruins, texts and local causal chains.

### Exit gate
Refinement property tests demonstrate that generated detail obeys previously committed facts and constraints.

---

## P9 — Exploration & Gameplay

### Objective
Convert systems engineering into a meaningful player experience.

### Candidate loops
Discovery, navigation, observation, survival/resource interaction, trade, intervention, archaeology/history reconstruction, diplomacy, construction and consequences.

Gameplay scope is validated against procedural-system strengths rather than added as disconnected mechanics.

### Exit gate
A repeatable end-to-end play loop changes canonical world state, survives save/export/import and reveals meaningful systemic diversity.

---

## P10 — Rendering, Audio & Product Maturity

Rendering evolves throughout earlier phases, but P10 focuses on product-level quality:
- WebGL2 portable renderer maturity;
- optional WebGPU accelerated path;
- procedural materials and atmosphere;
- scalable LOD/streaming;
- procedural/modular AudioWorklet path where supported;
- accessibility and control profiles;
- profiling and quality adaptation.

### Exit gate
Named quality profiles meet documented performance budgets without altering canonical state.

---

## P11 — Certification Candidate

### Objective
Make extraordinary claims independently auditable.

### Deliverables
- release manifest;
- artifact SHA-256;
- source commit/tree identity;
- pinned build/toolchain manifest;
- independent rebuild comparison;
- cross-runtime conformance report;
- record vector;
- certified functional payload inventory;
- benchmark data;
- internal self-test dashboard;
- security/offline audit.

### Exit gate
Every public claim maps to evidence and the claim taxonomy.

---

## P12 — Scale Campaign

Only after correctness, portability and meaning are established do we deliberately grow the artifact.

Growth is admitted through useful capability:
- richer deterministic models;
- generator families;
- scientific/static reference tables with provenance;
- additional shaders/material grammars;
- deeper self-tests and diagnostics;
- accessibility/localization;
- optional high-value embedded assets.

Raw size is measured, but artificial inflation remains excluded from Certified Functional Payload.

## Roadmap rule

A later phase MAY prototype earlier to reduce risk, but no prototype silently overrides an upstream constitutional contract. Discoveries that invalidate an ADR must update the ADR and compatibility story before dependent stable generators proceed.
