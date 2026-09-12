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

Governance closure PR #33 merged as signed commit
`58d4cbbc3ff8412ddd29a2fa628746b4d8d0557d`; exact-main Environment v2 run
`33760167600` passed its complete five-runtime aggregate seal. Environment v2 uses
unique ADR-019, repository ADR hygiene is executable, and Issue #28 is closed.

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

**P6 v1 — COMPLETE / CANONICAL / FROZEN WITHIN DECLARED SCOPE.** PR #34
promoted candidate `b5d0850d46184700e2764a413db59e314ba6ce83` as signed merge
`79d1817abc446f01825a66db93a2dc16aa379d7b`; both share tree
`f41cb6b18e6af2289f05e898c44320833366b2c8`. Exact-main P1–P6 run
`33762589274` passed the complete five-runtime aggregate seal, and Issue #24 is
closed.

P6 v1 consumes only frozen `ofu-p5-p6-environment-v2` / schema `2` /
`p5-environment-2` / `P5_CANONICAL`. A domain-separated eligibility witness binds
the complete canonical P5 projection, planet identity, P5 environment digest,
P5 and P6 Semantic Manifests, P6 eligibility semantics and Model A identity
policy. A bare `BIOSPHERE_SUPPORTED` label has no authority.

The current real P5 Environment v2 path is honestly
`INSUFFICIENT_ENVIRONMENT / canGenerateBiosphere=false`. Positive
`P6_CONFORMANCE_ONLY` fixtures exist only under `tests/p6/`; they are excluded
from the shipped runtime and cannot create canonical entities, events, saves or
rendering truth.

P6 v1 freezes:

- deterministic integer energy/productivity/biomass/trophic ceilings;
- PHOTOTROPHIC / CHEMOTROPHIC / MIXED / UNKNOWN source distinctions;
- Model A P2 identity derivation for biosphere, lineage and species semantic IDs;
- MACRO → MESO → MICRO refinement invariants without persistent individuals;
- a P4-owned genesis guard whose current upstream preconditions accept no event;
- fail-closed replay/checkpoint/compaction/save semantics for the no-biology state.

Persistent lineage/speciation/extinction transitions are deliberately deferred.
P6 v1 does not freeze an orphanable pseudo-lineage contract merely to preserve a
pre-promotion candidate shape. Future positive biology and lineage lifecycle
semantics require separately versioned scientific authority and a new promotion.

### Exit gate

**PASSED.** Material blocker count zero; exact candidate and exact merged `main` both pass
Foundation, P1–P5, P6 authority/identity/replay, Golden/oracle, deterministic
single-file build, bounded working-set, Worker-order and five-runtime browser
certification. Real Safari/iOS remains `NOT_VERIFIED`.

## First P1–P6 production rendering vertical slice

The `v0.5.0-preview.1` integration owns presentation only. It consumes the
frozen P1–P6 stack, materializes bounded P5 cube-sphere terrain through WebGL2
with a Canvas2D fallback, and exposes the real P6 result without inventing life:
`INSUFFICIENT_ENVIRONMENT / canonical biosphere established: NO`.

Its production gate requires outward indexed terrain, same/cross-face and cube
corner traversal, mixed LOD with presentation-only skirts, exact local-origin
rebasing, bounded CPU/GPU caches, explicit buffer destruction, context-generation
recovery, canonical non-interference, deterministic single-file output, direct
`file://`, offline/zero-required-network execution and five-runtime evidence.
Timing telemetry is measured evidence, not a byte-deterministic semantic gate.

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

---

# Forward development from the V2.0 convergence candidate

This is the **single canonical product-strategy continuation** of the historical P0–P12 roadmap. It does not create P13, rewrite certified history, or change the scientific dependency semantics in [`docs/frontier/WORKSTREAM_DAG.json`](frontier/WORKSTREAM_DAG.json). ADR-024 remains the authority for the complementary forward-frontier DAG.

Detailed competitive research is an input to this section, not roadmap authority. Repository evidence, the Constitution, accepted ADRs, the architecture contracts, the V2 integration ledger, and exact release certification always outrank research recommendations.

## Current release horizon — close V2.0; do not reopen it

As of the authenticated strategy-integration base, V2.0 is represented by draft PR #237 on `integration/v2x-supreme-total-convergence-2026-09-07`. The composed head declares a provisional V2.0 release candidate, but canonical promotion is **not complete** while exact-SHA release certification remains red and the PR remains unmerged.

The current release scope is therefore **frozen to certification/repair work**. No strategic feature below is admitted into V2.0 merely because it is identity-defining or high value.

Current release closure means:

1. classify and repair the failing exact-source release-conformance gate without weakening or deleting the gate;
2. rerun same-SHA release, browser, artifact, determinism, provenance and resource evidence required by the release transaction;
3. preserve the central authority map and exact artifact composition;
4. merge only the expected certified head through the governed promotion path;
5. recertify the resulting canonical target before any release claim;
6. keep physical mobile and physical assistive-technology claims explicitly unverified until executed evidence exists.

**Acceptance condition:** the exact candidate and resulting canonical promotion satisfy the repository release transaction with no fabricated PASS and no new feature scope.

## Strategic product expression — THE SAME UNIVERSE ACROSS SCALE

The competitive research does **not** replace the founder vision. It makes an existing constitutional/product idea legible as a product promise:

> **The same universe across scale.**  
> The selected thing keeps its identity, the world remembers governed consequences, and the product can explain what is known, derived, modeled, measured, illustrative, or unknown.

This expression is supported by existing architecture rather than being a new authority model:

- canonical identity and selection remain renderer-independent;
- cross-scale continuity uses explicit `REFINE`, `PROJECT`, and `RECONCILE` semantics where supported;
- persistence/replay remains owned by the governed temporal/persistence system;
- model-derived life, civilization, people, matter and interventions remain model-derived unless separately promoted;
- rendering remains presentation authority, not scientific truth;
- WebGL2 remains the portable baseline; WebGPU is optional enhancement only;
- one-file, direct-open/offline operation and deterministic/reproducible build identity remain non-negotiable baseline properties.

The product must make these engineering properties visible to ordinary users. Architecture that cannot be perceived as stable identity, memory, consequence, explanation, ownership or continuity is not yet a product advantage.

## Roadmap admission rule

A major new initiative should materially improve at least **two** of the following:

- identity continuity;
- causal consequence;
- persistent memory / replay;
- explainability / scientific integrity;
- scale legibility / wonder;
- local-first ownership / reproducibility;

and must not create an unacceptable regression in the others, resource bounds, accessibility, or central authority. A feature that adds domain breadth without strengthening the connected product normally stays research/optional rather than entering the critical path.

## Dependency order

Future development is intentionally sequenced to prevent another unconverged breadth wave:

`V2.0 release closure`
→ `cross-scale Identity Thread`
→ `revisit + persistent causal history`
→ `Explain This provenance/uncertainty`
→ `semantic scale legibility`
→ `one gold cross-domain causal journey`
→ `Explore / Inspect / Lab coherence`
→ `cinematic embodiment of those same systems`
→ `causal discovery`
→ `deeper persons / civilization / environment continuity`
→ `deeper matter continuity`
→ `deterministic counterfactual and research frontiers`.

Parallel research may continue where ownership is isolated, but no later family may be used to compensate for a red upstream product-identity gate.

## Next stable evolution — identity, memory, explanation and legibility

No version number is assigned here. This is the next capability horizon after certified V2.0 closure.

### 1. Cross-scale Identity Thread

**Live state:** PARTIAL / architecture already ratified. Stable entity IDs, central selection, retained navigation context and multiple cross-scale bridges exist; continuity is not yet equally strong or equally visible across all model regimes.

**Owners:** kernel/addressing, exploration/navigation, selection, domain providers, persistence.

**Acceptance:** the same selected object can be followed through every supported refinement/projection path and back with machine-verifiable ancestry, no unexplained identity replacement, and explicit `UNSUPPORTED` where a bridge does not exist.

### 2. REFINE / PROJECT / RECONCILE product completion

**Live state:** ALREADY PLANNED / PARTIALLY IMPLEMENTED. These operations are architectural contracts, not a new strategic invention.

**Owners:** architecture-defined provider boundaries plus exploration/navigation and domain-specific adapters.

**Acceptance:** every advertised cross-scale bridge declares its operation, authority and fidelity; round trips preserve parent identity; cached or late-materialized representations reconcile against current authoritative state instead of becoming competing truth.

### 3. Persistent causal history and revisit

**Live state:** PARTIAL. Deterministic save/replay and governed causal-action infrastructure exist, while several V2 model domains still expose bounded projections rather than complete persistent personal/domain history.

**Owners:** temporal, gameplay, persistence, replay, domain reducers.

**Acceptance:** a user can make one governed intervention, leave the context, save/reload or revisit it, and inspect what changed, what persisted, and which accepted event/projection caused the change.

### 4. Explain This — provenance, authority and uncertainty

**Live state:** PARTIAL. Authority classes, provenance metadata and the Living context inspector exist; explanation is not yet universal for every important visible fact/visual.

**Owners:** domain providers, diagnostics, inspector/product UI, evidence metadata.

**Acceptance:** for every major user-visible claim or representation the user can determine whether it is canonical/proven, derived, model-derived, measured runtime evidence, presentation-only, user-authored/event-derived, or unknown/unsupported, and can reach the relevant assumptions/source lineage without reading source code.

### 5. Semantic logarithmic scale navigation

**Live state:** PARTIAL / SHIPPING CANDIDATE. V2 has bounded continuous travel over semantic distance with a central navigation authority; the presentation path explicitly does not claim a physical trajectory.

**Owners:** exploration/navigation, camera presentation, product input.

**Acceptance:** wheel/pinch/keyboard/direct manipulation move through a comprehensible logarithmic scale model while preserving focus and reverse context; semantic regime changes are legible rather than disguised as physically continuous simulation when they are not.

### 6. Physical mobile and accessibility validation

**Live state:** DEFERRED POST-V2. Responsive/coarse-pointer/accessibility code exists, but physical mobile and physical assistive-technology certification is not claimed.

**Owners:** product UX, accessibility, runtime/resource adaptation, certification.

**Acceptance:** defined physical device/assistive-technology journeys pass with truthful capability disclosure and bounded resource behavior.

## Category-leadership horizon — make continuity meaningful

These initiatives follow the next-stable identity/memory/explanation gates. They are not independent feature lanes.

### 7. One gold cross-domain intervention journey

**Live state:** PARTIAL. The V2 causal engine and cross-domain journey tests exist; OFU still needs a founder-visible, comprehensible exemplar where consequences remain inspectable across domains and revisit.

**Owners:** gameplay, temporal/persistence, selected domain adapters, product presentation.

**Acceptance:** one bounded intervention produces causally attributable modeled consequences in at least two connected domains, survives replay/revisit, preserves authority labels, and can be explained without a hidden state inspector.

### 8. Explore / Inspect / Lab progressive disclosure

**Live state:** PARTIAL / ARCHITECTURALLY PLANNED. Exploration and inspection exist; architecture already reserves inspection/lab projections; the experience is not yet one fully coherent tri-modal product loop.

**Owners:** product orchestration, exploration, inspectors, diagnostics/lab projections.

**Acceptance:** the same selected entity moves between Explore, Inspect and Lab without identity reset, state fork, duplicated camera authority, or incompatible terminology; novice exploration stays light while expert detail remains reachable.

### 9. Cinematic scientific embodiment

**Live state:** PARTIAL. The V2 WebGL2 pixel consumer, Living renderer, lighting/material/resource machinery and systemic audio exist, but current embodiment is not the competitive target for premium cosmic/planet/local/micro presentation.

**Owners:** rendering, camera presentation, domain representation providers, product UI, systemic audio.

**Acceptance:** core identity-thread journeys achieve premium framing, motion, lighting/material depth and coherent audio while remaining interactive, bounded, accessible and truth-preserving. Visual continuity must never imply scientific/model continuity that does not exist.

### 10. Causal discovery

**Live state:** NEXT HORIZON. Sparse discovery exists; a general product loop for finding anomalies, historical traces and causal consequences that are grounded in actual state/history is not yet a mature shipping system.

**Owners:** exploration, temporal/history queries, domain providers, product information design.

**Acceptance:** discoveries are derived from actual modeled/canonical state or explicitly labeled presentation/research cues; following a discovery reveals why it is interesting and connects to entity/history context rather than becoming a checklist collectible.

## Longer-term development — deepen the same reality, not separate games

### Bounded persistent individuals

V2 candidate work provides deterministic bounded individual identity/refinement and revisit continuity, but the Living inspector explicitly does not yet claim retained personal memory, mortality-aware refinement, or canonical persons/genealogy. Future work should add those only through bounded, replay-safe contracts.

**Acceptance:** stable model-person identity survives revisit; any retained memory/knowledge/relationship/genealogy claim has explicit authority and bounded history; deaths/retirement never silently rematerialize identities.

### Deeper civilization ↔ environment coupling

Civilization/economy/history projections are model-derived. Extend them only where physical/environmental inputs and causal adapters can support explainable feedback in both directions.

**Acceptance:** at least one civilization action changes an environmental/material constraint through a versioned modeled causal path and the later civilization state can trace that consequence without promoting presentation coordinates or speculative history to truth.

### Stronger matter / micro continuity

V2 matter continuity already preserves selected-source identity into bounded microscopic/molecular/atomic representations and fails closed on unresolved chemistry. Future work should improve scientifically justified property bridges rather than merely increase particle count.

**Acceptance:** every deeper representation identifies its source object/material context, declared model/fidelity, unknown chemistry, and reversible projection target; deeper detail never creates unsupported upstream facts.

### Deterministic counterfactual comparison

Counterfactual branches are not ordinary canonical history. They remain non-canonical experiment/lab state until a future explicit contract exists.

**Acceptance:** from the same baseline checkpoint a user can run bounded deterministic alternative interventions, compare before/after outcomes and return to canonical history without ambiguity about which branch is authoritative.

### Optional WebGPU profile

WebGPU remains optional. It is not a V2 baseline promise and must not become necessary for scientific truth, persistence, navigation or core product access.

**Acceptance:** an Enhanced WebGPU path may ship only when its semantic output/selection/replay contracts are parity-tested against the WebGL2 baseline and absence/failure degrades gracefully without changing universe state.

## Research frontier

Research is encouraged where it can strengthen connected causal chains, but research evidence is not shipping authority. Priority research families are:

- stellar history → atmospheric/climate forcing → biosphere consequences;
- long-horizon civilization ↔ planetary-environment feedback;
- scientifically justified material-property bridges across macro/micro regimes;
- uncertainty-aware rendering that makes model confidence/knownness visible without inventing precision;
- additional validated cross-domain science suitable for bounded deterministic providers;
- optional grounded local inference after the non-AI product is already coherent and useful.

The accepted frontier DAG continues to own scientific workstream dependency/maturity metadata. Research promotion still requires its normal scientific, determinism, provenance, budget and compatibility gates.

## Explicit scope defense — NOT OFU

The following are not direct competitive goals for the baseline product:

- an AAA content-production race or asset-volume competition;
- an MMO or server-dependent universe baseline;
- a generic metaverse or social network;
- a generic game engine;
- a full specialist astrophysics research solver;
- a full molecular-dynamics package;
- a full civilization grand-strategy game;
- disconnected scale-specific mini-apps stitched together by transitions;
- a cinematic landing-page spectacle whose imagery is not backed by persistent explorable state.

Dedicated research tools may inform OFU, and optional enhanced profiles may exist, but they do not displace the core identity: one addressable, persistent, causal, explainable universe that remains locally ownable.

## Strategic reconciliation table

| Strategic recommendation | Live implementation status | Canonical placement | Primary owner / subsystem | Dependency | User-visible acceptance condition |
|---|---|---|---|---|---|
| Same Universe Across Scale thesis | Already implicit in Vision/ADR-023; partially visible | Product expression / roadmap principle | product + architecture-wide | Constitution + identity authority | User recognizes one persistent reality rather than scene/minigame replacement |
| Identity Thread | Partial | Next stable evolution | kernel + exploration + providers + persistence | V2 closure | Follow selected object down/up supported scales with verifiable ancestry |
| REFINE / PROJECT / RECONCILE | Architecture already defines; partial implementations | Next stable evolution / conformance | domain providers + exploration | Identity Thread | Advertised bridges round-trip identity and reconcile stale representations |
| Persistent causal history / revisit | Partial | Next stable evolution | temporal + gameplay + persistence | Identity Thread | Intervene → leave/reload → return → inspect persistent consequence |
| Explain This / provenance | Partial | Next stable evolution | providers + diagnostics + inspector | history/selection context | Major visible claims expose authority, assumptions and unknowns |
| Semantic logarithmic scale navigation | Partial / V2 candidate | Next stable evolution polish | navigation + camera + input | Identity Thread | Continuous focus-preserving travel with honest regime transitions |
| Gold cross-domain intervention | Partial infrastructure | Category-leadership horizon | gameplay + temporal + domains | history + explainability | One action yields persistent, attributable multi-domain consequence |
| Causal discovery | Not mature | Category-leadership horizon | exploration + history queries | gold causal journey | Discoveries arise from real state/history and explain why they matter |
| Cinematic art direction | Partial | Category-leadership horizon | rendering + product + audio | identity-thread journey | Premium presentation without authority/performance/accessibility regression |
| Explore / Inspect / Lab | Partial / architecturally planned | Category-leadership horizon | product orchestration | explainability + scale legibility | Same selection/context flows across all three modes |
| Bounded persistent individuals | Partial model identity | Longer-term | individuals + demography + temporal | revisit/history | Stable people with only bounded, authority-honest retained state |
| Deeper civilization/environment coupling | Partial model systems | Longer-term / research-backed | civilization + planet/environment + causal engine | gold causal journey | Bidirectional consequence is inspectable and provenance-honest |
| Matter/micro continuity | Partial V2 candidate | Longer-term strengthening | matter + micro + exploration | Identity Thread | Source identity survives deeper regimes; unresolved chemistry stays unknown |
| Deterministic counterfactuals | Not shipping | Longer-term / Lab | temporal + simulation + product Lab | robust replay | Compare deterministic alternatives without confusing canonical history |
| Optional WebGPU | Architecture reserved; not baseline support | Optional enhancement | rendering/runtime | WebGL2 parity evidence | Same semantics with graceful fallback |
| One-file/offline preservation | Constitutional and shipping baseline | Invariant / admission gate | build + runtime + persistence + release | none | Core product opens locally without required network/server and remains reproducible |
| Explicit scope exclusions | New strategic clarification consistent with non-goals | Roadmap scope defense | product strategy + governance | none | New initiatives cannot silently turn OFU into a disconnected specialist/AAA/server product |

## Reserved successor overlay — Local AI and Ultimate Complexity

The previously reviewed `OFU-AI-ULTIMATE-SPEC` remains a **reserved long-range successor**, not an active replacement for the product sequence above. Its durable constraints remain:

- generated tokens never directly author canonical truth/state;
- unknown/unsupported remains unknown/unsupported;
- OFU Standard remains useful and complete without local inference;
- inference backend/model size/quantization are measured experiments;
- WebGPU is optional acceleration only;
- AI feasibility must not displace identity, revisit, explanation, scale legibility, causal product or certification work.

See [`docs/frontier/AI_AND_ULTIMATE_COMPLEXITY.md`](frontier/AI_AND_ULTIMATE_COMPLEXITY.md) and [`docs/frontier/AI_ULTIMATE_SUCCESSOR_PROGRAM.json`](frontier/AI_ULTIMATE_SUCCESSOR_PROGRAM.json) for the reserved successor research/program metadata.

---

## Canonical planning pointers

- **Certified historical roadmap and product-strategy sequence:** this file.
- **Scientific/frontier workstream dependency metadata:** [`docs/frontier/WORKSTREAM_DAG.json`](frontier/WORKSTREAM_DAG.json).
- **Human-readable frontier view:** [`docs/FRONTIER_WORKSTREAMS.md`](FRONTIER_WORKSTREAMS.md).
- **Live V2 integration/release evidence:** [`docs/parallel/V2_INTEGRATION_LEDGER.json`](parallel/V2_INTEGRATION_LEDGER.json) and the exact PR/workflow state.
- **Architecture contracts:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) and accepted ADRs.
- **Constitutional invariants:** [`docs/CONSTITUTION.md`](CONSTITUTION.md).

Research reports, lane ledgers, integration records, issues and PR descriptions may inform or execute this roadmap, but they do not become competing roadmap authority.