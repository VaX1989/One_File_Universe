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

**P5 — RESEARCH — PROMOTION ARCHITECTURE READY**  
P5 remains deliberately non-canonical. Research may consume the frozen P3/P4 baseline but does not override P3 astronomical facts or P4 temporal authority.

### Objective
Generate planets as causal systems rather than colored noise spheres.

### Candidate mechanisms
- composition and bulk properties;
- orbital/stellar energy inputs;
- stylized-causal geodynamics;
- atmosphere/hydrosphere;
- climate energy balance;
- terrain and erosion approximations;
- planetary/surface LOD;
- mesh generation pipeline.

Specific algorithms (Voronoi plates, dual contouring, etc.) remain evidence-driven choices.

### Exit gate
Bounded-cost planets show coherent causal consequences, stable canonical facts, and meaningful diversity under domain metrics.

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
