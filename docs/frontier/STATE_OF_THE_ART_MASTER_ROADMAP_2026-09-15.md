# One File Universe — State-of-the-Art Master Roadmap

**Status:** ACTIVE FORWARD-PLANNING OVERLAY / `PLANNING_METADATA_ONLY`  
**Date:** 2026-09-15  
**Repository:** `VaX1989/One_File_Universe`  
**Planning base:** `experiment/spatial-continuum-r6-causal-universe-2026-09-14@27657ab9e8215b2c5fc34e4a6aec8ad947f1cf3a`  
**Planning base tree:** `97c83b4341f23113267910f80952979280106f71`  
**Active product checkpoint represented by that head:** R6-11 plus CI artifact publication; the product changes remain rooted at `e45e86bfd2a2d6feeca8d139bd67b65680c1280c` / tree `892d50af997dab48ebd35e8b8101bcb1c66a3b04`.

This roadmap is an additive successor-planning layer. It does **not** rewrite the certified P0-P12 history in `docs/ROADMAP.md`, does not expand canonical scientific claims, does not authorize a merge/tag/release, and does not make unfinished capability complete by naming it.

The authoritative historical/frontier split remains `docs/frontier/CERTIFIED_HISTORY_AND_FRONTIER.md`. The existing frontier contracts and workstream ownership model remain valid. This document sharpens them into a state-of-the-art product/science/engineering program centered on the live Spatial Continuum reality and on maximum safe agentic parallelism.

---

# 1. North-star product definition

One File Universe should become a deterministic, offline, strict single-file universe in which a user can:

> begin at cosmic scale, choose an arbitrary discoverable destination, travel continuously through galaxy/system/orbit/planet/surface/local/human/material/microscopic/molecular/atomic regimes, interrogate what is seen, understand why it exists, compare it with other places, move through time where the model supports time, record discoveries, return to the same place and state, and never lose identity, spatial context, provenance, scientific honesty or control.

The final experience should not feel like a sequence of generated pages or isolated scenes. It should feel like **one continuous reality with finite active working sets and effectively unbounded addressability**.

A state-of-the-art OFU therefore requires all of the following at once:

1. **Continuous reality** — no visible scene replacement, blank handoff, avoidable freeze or identity discontinuity.
2. **Causal diversity** — different places look and behave different because their generated causes differ, not because a palette was rerolled.
3. **Scientific honesty** — canonical, model-derived, presentation-only, unknown and unsupported states remain distinguishable in both machine state and UX.
4. **Perceptual scale** — the user understands whether they are crossing light-years, kilometres, metres, micrometres or atomic-scale abstractions.
5. **Queryable reality** — every meaningful object can expose identity, provenance, measurements, causal ancestry and uncertainty appropriate to its authority.
6. **Temporal reality** — where time-dependent models exist, `where` and `when` are both first-class coordinates.
7. **Persistent exploration** — places, observations, samples, routes and snapshots can be revisited exactly.
8. **Bounded execution** — an effectively unbounded semantic universe never requires unbounded CPU/GPU/memory residency.
9. **Adaptive presentation** — hardware changes quality, not world truth.
10. **Evidence before promotion** — performance, visual quality, scientific claims, accessibility and persistence are independently falsifiable.

---

# 2. Non-negotiable invariants

Every future lane must preserve these invariants unless a separately governed successor contract explicitly changes them:

- one deterministic single-file artifact;
- direct-file and offline operation remain valid product modes;
- no required runtime network access;
- canonical identity is never inferred from transient renderer geometry;
- canonical/model-derived/presentation/unknown/unsupported authority stays explicit;
- presentation quality never silently changes canonical truth;
- one authoritative selection/focus/camera travel chain;
- renderer-owned picking for rendered geometry, authority-owned semantics for identity and world meaning;
- no renderer-side semantic discovery that reintroduces blocking authority calls;
- deterministic addressability and order independence;
- reversible cross-scale identity and location mapping where a bridge claims reversibility;
- old valid coverage remains visible until replacement coverage is ready whenever progressive materialization is used;
- stale work is cancellable and rejected;
- working sets are bounded independently of universe size;
- unsupported science fails closed rather than being filled with plausible-looking fiction;
- model-derived simulation may be rich, but its assumptions/provenance must remain visible;
- a green CI aggregate never overrides a founder-visible product defect, scientific overclaim or broken primary journey.

---

# 3. Current-state diagnosis

The architecture is materially ahead of the product experience. The state-of-the-art program must therefore prioritize **making the experience catch up to the engine**, not adding another monolithic engine layer.

| Domain | Current evidence-grounded state | State-of-the-art gap | Priority |
|---|---|---|---|
| Macro universe | Deterministic branching, bounded macro residency, continuous macro cells | cold/successive macro rebuild tails; insufficient apparent cosmic scale and depth | CRITICAL |
| Planet handoff | shared physical/root-space continuity; global cube-sphere terrain | GLOBAL→REGIONAL→LOCAL still visually weak/dark/coarse and can expose technical structure | CRITICAL |
| HUMAN | coordinate-addressed local environment, bounded residency, real movement | weak sense of place, horizon, hierarchy, scale cues, lighting, density and memorability | CRITICAL |
| Terrain LOD | content-aware cube-sphere LOD, balancing, progressive patch construction | final crack-free seams, morphing, culling, backstop retirement and invisible face boundaries | HIGH |
| Planet-wide travel | real multi-cell movement | seamless indefinite planetary walking/rebasing not yet complete | HIGH |
| Planet diversity | causal model state and multiple presentation families | common visual grammar remains too obvious | HIGH |
| Matter/micro | source-conditioned MATERIAL→ATOMIC continuity | MOLECULAR visual language over-implies exact chemistry; uncertainty presentation incomplete | HIGH |
| Performance | major LOCAL tail fixed by R6-11; GPU not primary bottleneck | macro CPU work, long-duration resource evidence, adaptive quality and low-end/device profiles | CRITICAL |
| Scientific UX | authority exists internally | provenance, uncertainty, causal ancestry and measurement are not yet first-class product interactions | MEDIUM→HIGH |
| Time | strong P4 temporal foundation exists | time is not yet a first-class spatial-continuum exploration axis | MEDIUM→HIGH |
| Exploration memory | deterministic places exist | personal atlas, discovery history, search, anomaly/serendipity and exact journey return need productization | MEDIUM→HIGH |
| Analysis | extensive internal evidence exists | compare, measurements, causal graphs, diversity analytics and quality observatory need first-class systems | HIGH |
| Audio | reserved/systemic direction | no mature causal spatial/systemic audio pillar | MEDIUM |
| Product closure | strong browser automation and exact-head evidence | long physical-device soak, Safari/iOS, accessibility breadth, visual differential and final V1/V2/R6 superiority | CRITICAL before convergence |

---

# 4. Immediate R6 closure program — finish Continuous Reality before starting a new generation

Do **not** open R7 merely because R6 contains many checkpoints. R6 should continue until its remaining architectural and founder-visible continuity defects are materially closed.

## R6-C1 — Bounded progressive macro materialization

### Goal
Make galaxy/universe neighborhood changes as invisible as the R6-11 terrain refinement path.

### Implement
- profile cold UNIVERSE and recurring `macro.rebuild` by phase before optimizing;
- split discovery/materialization into bounded cooperative slices;
- retain previous valid macro context until replacement context is resident;
- add incremental additions/removals instead of scene-level replacement;
- prioritize visible/current-travel-direction work;
- cancel/supersede stale destination work;
- preserve current-relative coordinate rebasing and stable picking;
- bound duplicate residency during handoff;
- avoid main-thread bursts large enough to create user-visible freezes.

### Exit evidence
- no blank/empty macro handoff;
- no stale macro commit after reversal;
- bounded residency through repeated long travel;
- exact identity and branch history preserved;
- phase-level performance shows macro work distributed under profile-specific interactive budgets;
- founder-visible travel no longer reads as page/scene replacement.

## R6-C2 — True detailed GLOBAL→REGIONAL→LOCAL visual handoff

### Goal
The selected orbital point must remain perceptually the same place all the way to the ground.

### Implement
- preserve the last complete detailed surface representation as the blend source;
- stop using a visibly coarse parent as the dominant visual fallback when detailed prior coverage exists;
- unify terrain, atmosphere, horizon, exposure and lighting during scale change;
- maintain selected surface feature/location anchoring across representations;
- reduce UI occlusion during high-information transition frames;
- add transition diagnostics that distinguish identity continuity from perceptual continuity.

### Exit evidence
A blind reviewer should not be able to identify the representation swap point from a normal-speed captured transition except through semantic scale changes that are intentionally visible.

## R6-C3 — HUMAN sense-of-place transformation

### Goal
HUMAN becomes a memorable world surface rather than a technical local sample.

### Implement
- physically plausible camera height and embodied motion;
- near/mid/far composition with readable horizon;
- distant landforms and atmospheric depth derived from the same planet/surface context;
- stronger terrain material hierarchy and local variation;
- clustered/structured object placement rather than uniform shard scatter;
- landmarks, silhouette hierarchy and negative space;
- shadows, exposure, fog/haze and sky tuned from star/atmosphere context;
- contextual density rather than indiscriminate object count;
- eliminate oversized/overexposed specimen dominance;
- preserve strict causal link from planetary state to local visual grammar.

### Exit evidence
Multiple sampled HUMAN destinations on scientifically distinct worlds are recognizable as different places without labels and without relying on color alone.

## R6-C4 — Planet-wide HUMAN continuity

### Goal
A user can keep walking without a perceived reset of the world.

### Implement
- continuous body-fixed/tangent-frame migration;
- local origin rebasing invisible to the user;
- persistent canonical surface addresses across cell transitions;
- stable orientation, selected objects, route history and neighboring features;
- bounded streaming of terrain/environment cells;
- reversible mapping to higher-scale planetary coordinates.

### Exit evidence
Long directed traversals cross many local windows without identity discontinuity, coordinate instability, duplicate objects or world reset.

## R6-C5 — Invisible planetary LOD

### Goal
The user cannot infer cube faces, patch borders or technical LOD levels from the final rendered planet.

### Implement
- crack-free cross-patch and cross-face stitching;
- morph/geomorph or equivalent pop suppression;
- conservative content-error bounds;
- frustum/horizon culling;
- stable screen-space refinement under camera motion;
- retire the coarse sphere/backstop where evidence proves coverage is complete;
- verify topology at corners and adversarial camera angles.

### Exit evidence
No visible holes/cracks/pops/face boundaries across automated adversarial journeys and human-reviewed globe-to-ground sequences.

## R6-C6 — Stronger causal visual differentiation

### Goal
`different hash` must become `different perceived place` when the underlying model meaningfully differs.

### Implement
Propagate model differences into multiple independent visual channels:

- atmosphere density/composition proxies → sky/scattering/haze;
- stellar forcing → illumination/exposure/temperature family;
- hydrosphere/volatile state → surface coverage/process families where supported;
- thermal regime → weathering/ice/erosion presentation families;
- gravity → scale/settling/terrain/object presentation consequences where justified;
- geology/process regime → landform grammar;
- composition/material state → terrain/material/microstructure grammar;
- age/history proxies → cratering/weathering/erosion maturity when model authority supports it.

Avoid color-only differentiation and avoid introducing unsupported canonical claims.

## R6-C7 — Epistemically honest molecular/atomic redesign

### Goal
Lower-scale imagery communicates the structure of what OFU knows without pretending exact molecules, bonds or particles that OFU does not know.

### Implement
- replace conventional balls-and-rods where they imply unjustified exact chemistry;
- introduce fields, densities, orientation, motifs, ensembles, distributions or other representations tied to authority;
- expose model/presentation status in Scientist mode;
- keep MATERIAL→MICROSTRUCTURE→MOLECULAR→ATOMIC contextual continuity;
- make ATOMIC explicitly an explanatory/state representation unless exact scientific structure is authoritative.

## R6-C8 — R6 product certification gate

R6 is eligible for convergence discussion only when:

- C1-C7 are materially closed or explicitly adjudicated with evidence;
- long-session memory/resource behavior is bounded;
- real Safari/iOS and representative Android evidence exist where feasible;
- accessibility and reduced-motion journeys pass;
- direct-file/offline and context-loss recovery remain intact;
- V1/V2/R6 visual differential demonstrates R6 is not merely architecturally superior but product-preferable;
- no unresolved founder-visible visual blocker remains;
- no new canonical-science overclaim was introduced.

Only after that should the project decide whether the next development generation is warranted.

---

# 5. State-of-the-art scientific reality program

These tracks may begin as research/model-derived work in parallel with product convergence, but canonical promotion remains independently gated.

## SOTA-SCI-1 — Causal scientific fingerprint

Every world should expose a compact, versioned scientific/generative fingerprint linking:

`formation → star/system forcing → orbit → bulk body → interior → volatile/atmosphere state → climate/environment regime → surface processes → material state → local/micro constraints`.

The fingerprint becomes the backbone for search, compare, WHY, provenance, anti-sameness analysis and debugging. It must distinguish authoritative inputs from model-derived and presentation-only consequences.

## SOTA-SCI-2 — WHY / causal ancestry

Any inspectable feature should be able to answer, to the depth the model actually supports:

- What is this?
- Why is it here?
- Which upstream facts constrain it?
- Which steps are canonical, model-derived, presentation-only, unknown or unsupported?
- What alternative assumptions would change it?

The output should be a typed causal graph, not free-form explanatory text as authority.

## SOTA-SCI-3 — Explicit uncertainty and evidence

Make uncertainty a first-class product property:

- authority class;
- provenance/source/model version;
- assumptions/applicability;
- uncertainty interval or qualitative uncertainty where mathematically defensible;
- unsupported/unknown state;
- presentation-only warning when visual geometry is illustrative.

The default Explorer surface remains clean; Scientist mode exposes the detail.

## SOTA-SCI-4 — Stronger physical coherence

Increase cross-domain consistency without pretending to simulate all physics:

- mass/radius/gravity consistency;
- stellar forcing/orbit/illumination consistency;
- atmosphere/pressure/temperature-family consistency;
- energy and volatile conservation where declared;
- hydrology/ice/surface-process consistency where authority exists;
- material and microstructure constraints derived from upstream state;
- future mutable processes bound through P4 rather than renderer time.

## SOTA-SCI-5 — Scientific instruments

Add measurement as interaction, not only labels:

- distance/angle/area/slope;
- gravity and acceleration context;
- temperature/pressure where model authority exists;
- atmosphere/composition projections;
- illumination/stellar spectrum proxies where supported;
- surface/material sampling;
- microscope/microstructure probe;
- provenance/evidence inspector.

Every instrument must report its authority and unit/model basis.

## SOTA-SCI-6 — Counterfactual Lab

Create a non-canonical sandbox that can answer controlled questions such as:

- what if stellar forcing were higher?
- what if volatile inventory differed?
- what if atmosphere were removed?

Counterfactuals must never mutate the canonical universe unless a governed action/event explicitly does so. They are derived experiments with reproducible parameter sets.

---

# 6. Time as a fourth exploration dimension

P4 already provides strong temporal foundations. The state-of-the-art product should eventually expose them as an experiential axis rather than leaving time mainly as infrastructure.

## SOTA-TIME-1 — Universal temporal coordinate

Represent an observation as at least:

`Universe identity + spatial address/context + time/epoch + model versions + observer/product state`.

## SOTA-TIME-2 — Timeline control

Provide pause, step, accelerate, decelerate and jump-to-epoch controls where the active model supports those operations.

## SOTA-TIME-3 — Time-visible phenomena

Prioritize phenomena with governed models:

- orbital motion;
- rotational/day-night progression;
- illumination/seasonal effects where supported;
- atmosphere/climate evolution only when a declared model owns it;
- surface evolution/erosion/geology only when versioned authority/model-derived simulation exists;
- stellar/cosmic evolution only under explicit fidelity limits.

## SOTA-TIME-4 — Exact temporal snapshots

A snapshot should record sufficient information to return to the same universe, place, time, camera, mode, selection and observation context without serializing the entire generated universe.

## SOTA-TIME-5 — History inspection

Allow the user to ask not only `what is here?` but `how did it become this way?` when causal history exists. Deep history remains late-materialized and bounded.

---

# 7. Exploration, memory and discovery program

An effectively infinite universe becomes meaningful only if the user can orient, remember, search and discover.

## SOTA-EXP-1 — Personal Atlas

Persist visited destinations and observations as compact references:

- galaxy/system/body/surface/local/material/micro address;
- visit time/epoch;
- user label/favorite;
- selected sample/object;
- screenshot/thumbnail only if bounded and explicitly stored;
- notes/measurements;
- causal fingerprint summary;
- exact return state.

## SOTA-EXP-2 — Discovery journal

Record the sequence of meaningful discoveries without turning normal exploration into a game quest log. Allow replay of the route and return to prior observations.

## SOTA-EXP-3 — Property search

Enable sparse queries such as:

- cold rocky worlds with atmosphere;
- unusually high/low gravity;
- systems with specific stellar families;
- surface regimes matching a material/geological fingerprint;
- places similar to the current sample.

Search must remain bounded, deterministic and explicit about whether results are exhaustive, sampled or approximate.

## SOTA-EXP-4 — Governed serendipity / interestingness

Add `Take me somewhere interesting` based on anomaly, novelty and difference from the user's explored set rather than pure random choice.

Interestingness is a derived ranking, not universe authority. It should combine scientific rarity, perceptual diversity and exploration history while remaining reproducible for a fixed algorithm/version.

## SOTA-EXP-5 — Scientific guided journeys

Examples:

- star → planet → surface → sample → material → atomic context;
- compare two worlds and trace the causal divergence;
- follow the origin of one observed property upstream;
- tour the most unusual known destinations in an explored neighborhood.

Guided journeys must use the same navigation authority as free exploration.

---

# 8. UX and control architecture

## SOTA-UX-1 — Three product modes, one universe

### Explorer
Minimal interface, immersion-first, direct manipulation, orientation and essential context only.

### Scientist
Measurements, provenance, causal graph, uncertainty, compare, timeline and instrument controls.

### Director
Camera paths, tracking, time-lapse, scripted scale transitions, framing and capture/replay controls.

Switching modes must not change canonical world state.

## SOTA-UX-2 — Semantic zoom

Zoom is not merely camera magnification. Each scale should reveal the interactions/information appropriate to that scale while preserving identity and location.

## SOTA-UX-3 — Perfect orientation

The user should always be able to answer:

- where am I?
- what am I looking at?
- where did I come from?
- what is selected?
- what scale am I at?
- how far away is the target?
- how do I return?

Implement compact breadcrumbs, scale context, route/history and reversible navigation without covering the viewport.

## SOTA-UX-4 — Scale awareness

Use context-dependent scale references such as light-travel time, planetary radii, human height, micrometres or atomic-scale explanatory markers. These references are presentation aids, not world objects.

## SOTA-UX-5 — Accessible 3D

- keyboard and single-pointer alternatives to drag-only actions;
- touch-first mobile controls;
- reduced-motion transitions;
- screen-reader/semantic selected-object context;
- non-color-only authority/status communication;
- adequate targets and focus order;
- optional descriptive narration of scenes/measurements;
- no essential interaction locked inside an unlabeled canvas gesture.

---

# 9. Visual and immersive program

## SOTA-VIS-1 — Physically coherent illumination

Use the system's star/body state to drive presentation lighting, solar direction, phase, exposure, shadow character and sky/atmospheric appearance to the extent supported by the model.

## SOTA-VIS-2 — Atmosphere, horizon and distance

Develop planet-scale atmospheric depth, aerial perspective, horizon curvature and far-landform readability. These are essential to perceived scale and HUMAN place quality.

## SOTA-VIS-3 — Emergent world identity

World appearance should emerge from scientific/generative fingerprints rather than from a small number of obvious templates. Multi-channel consequences matter more than palette variety.

## SOTA-IMM-1 — Systemic audio

Audio derives from context:

- vacuum has no fictional propagated ambience unless explicitly musical/UI;
- atmosphere/wind presentation depends on environmental model inputs;
- ground/material interactions depend on local material presentation;
- interface/audio cues communicate scale, authority and transitions without masquerading as physical sound.

## SOTA-IMM-2 — Scientific sonification

At scales lacking intuitive visual reference, provide optional sonification of model values, density, energy or variation. Sonification must be labeled as representation, not literal physical sound.

## SOTA-IMM-3 — Camera that teaches scale

Acceleration, travel curves, parallax, field of view, exposure and transition duration should help the user feel the difference between metres, kilometres, astronomical units and interstellar distances.

## SOTA-IMM-4 — Optional future WebXR

Reserve WebXR/immersive display as an optional Enhanced presentation path only after core direct-file, accessibility and performance goals are stable. It must not become required for semantic correctness.

---

# 10. Matter and microscopic program

## SOTA-MAT-1 — Cross-regime continuity

Maintain a traceable chain from selected surface sample to material, microstructure, molecular-context and atomic-context representations.

## SOTA-MAT-2 — Authority-aware visual grammar

Use distinct visual languages for:

- known structural data;
- model-derived ensembles;
- statistical fields;
- presentation-only explanatory abstraction;
- unknown structure.

Avoid familiar scientific iconography when it would falsely imply exact identity or geometry.

## SOTA-MAT-3 — Bounded local materialization

Microscopic depth must remain query-driven and local. Do not simulate or instantiate the entire microscopic universe of a planet.

## SOTA-MAT-4 — Future scientific model adapters

Allow specialized molecular/material/cell solvers later through explicit unit, timescale, uncertainty and authority adapters. A specialized solver does not automatically become canonical universe truth.

---

# 11. Analysis and scientific comparison program

## SOTA-AN-1 — Synchronized compare

Compare two or more places under matched scale, camera and selected metrics:

- worlds;
- surface regions;
- materials;
- microstructures;
- different epochs of the same place.

## SOTA-AN-2 — Causal divergence view

For two worlds, identify where their fingerprints diverge and which downstream consequences differ.

## SOTA-AN-3 — Interactive measurements

Persist measurement sets in the Atlas and allow repeatable comparison.

## SOTA-AN-4 — Explored-universe statistics

Provide statistics about what the user has actually explored, clearly separated from claims about the full address space.

## SOTA-AN-5 — Perceptual Diversity Score

Build a quantitative anti-sameness system. It should combine deterministic scene/world descriptors such as:

- silhouette/topographic structure;
- atmosphere/sky regime;
- spatial frequency/roughness;
- material families;
- object density and clustering;
- horizon structure;
- color only as one channel among many;
- causal fingerprint distance;
- microstructure topology.

Use image-based similarity as optional evidence, not the sole authority. Establish thresholds empirically against known repetitive and known distinct baselines rather than inventing a score with no calibration.

## SOTA-AN-6 — Quality Observatory

Create a continuously runnable observatory that samples many deterministic addresses and records:

- correctness/invariant failures;
- generation distributions;
- perceptual diversity collapse;
- blank/degenerate scenes;
- lighting/exposure outliers;
- LOD seams/pops;
- transition continuity;
- CPU/GPU/frame-time tails;
- memory/resource growth;
- stale/cancelled work behavior;
- accessibility journey results;
- scientific authority/provenance coverage.

This observatory is a development instrument, not canonical world state.

## SOTA-AN-7 — Automated falsification campaigns

Run large address/seed/model sweeps specifically to find:

- physically impossible combinations;
- contradictory authority fields;
- unbounded work;
- repeated visual templates;
- renderer/authority leakage;
- coordinate singularities;
- seam failures;
- pathological UI states;
- save/replay mismatches.

Every falsification campaign should produce reproducible witness addresses and exact source/tool versions.

---

# 12. Runtime, adaptive quality and resilience

## SOTA-RT-1 — Invisible streaming everywhere

Apply bounded progressive materialization principles consistently to macro, planet, surface, HUMAN and microscopic regimes.

## SOTA-RT-2 — Adaptive quality profiles

Define capability/quality profiles driven by measured device budget. They may change:

- visual density;
- patch resolution;
- effects;
- sample count;
- refinement distance;
- update cadence;
- audio complexity.

They must not change canonical facts, addresses or deterministic world meaning.

## SOTA-RT-3 — WebGL2 baseline / WebGPU Enhanced

Maintain portable WebGL2-class baseline. Add WebGPU only where measured wins justify it and parity/fallback/resource lifecycle are proven.

## SOTA-RT-4 — Extreme robustness

Test:

- long exploration sessions;
- repeated all-scale traversal;
- context loss/recovery;
- memory pressure;
- suspend/resume;
- resize/orientation changes;
- mobile thermal/quality degradation;
- interrupted progressive work;
- rapid reversal and destination churn.

## SOTA-RT-5 — Exact snapshots and journey replay

Snapshot and journey systems should serialize compact semantic references and state, not a massive scene dump.

---

# 13. Director/cinematic capability

Director mode can turn OFU into a scientific/visual production instrument without contaminating Explorer UX.

Implement progressively:

- camera bookmarks;
- spline/path recording;
- target tracking/orbit;
- deterministic journey replay;
- time-lapse where temporal models exist;
- automated cross-scale journeys;
- framing/exposure controls;
- clean capture mode;
- metadata sidecar/export describing source universe/address/time/authority when capture leaves the one-file environment.

---

# 14. Long-range living-universe program

Do not jump directly to decorative procedural life or civilization. Preserve causal prerequisites.

## LIFE

Only deepen positive life when upstream environment/energy/chemistry contracts can constrain it. Model-derived life is permitted when clearly classified and reproducible; canonical scientific promotion is separate.

Required conceptual chain:

`environmental persistence + usable energy + medium/chemistry constraints → viability niches → bounded organisms/populations → ecology → evolution/history`.

## HISTORY

History should explain current state through bounded macro/meso/micro transitions and late materialization rather than simulating every individual forever.

## CIVILIZATION

Civilization should depend on environment, resources, demography, history, institutions and interaction. Avoid culture as a random cosmetic table.

## LOCAL AI

Retain the existing reserved Local AI program. AI may later explain, query and propose actions through typed OFU tools, but generated prose never becomes canonical authority and AI must not compensate for unresolved core navigation/rendering/product defects.

---

# 15. Agentic development architecture — maximize parallel progress without sacrificing quality

The goal is **maximum independent validated progress per unit of integration conflict**, not maximum branch count.

## 15.1 Control plane

One integration/control owner must maintain:

- exact common base SHA/tree;
- active dependency DAG;
- lane ownership table;
- shared-surface owner list;
- accepted/rejected checkpoint ledger;
- convergence order;
- exact-head evidence policy;
- no-merge/no-release decision until gates are met.

No agent may silently become a second convergence owner.

## 15.2 Lane contract required for every writer

Each lane must declare before writing:

- lane ID and authority class (`CANONICAL`, `MODEL_DERIVED`, `PRESENTATION`, `RUNTIME`, `TEST`, `RESEARCH`, `READ_ONLY`);
- exact base SHA/tree;
- owned modules/files;
- shared read-only modules/files;
- APIs/contracts it may consume;
- APIs/contracts it may change, if any;
- forbidden semantic surfaces;
- performance/resource budget;
- evidence to produce;
- handoff SHA/tree;
- integration dependencies;
- rollback/abandon condition.

If two lanes need the same central file, they are not independent lanes until a seam/registry makes them independent.

## 15.3 Immediate R6 high-throughput topology

After a short control-plane freeze at the current R6 head, use approximately **8–10 productive lanes**, but only where real file ownership is separable:

| Lane | Mission | Class | Dependency | Conflict rule |
|---|---|---|---|---|
| R6-A | progressive macro materialization | RUNTIME | current scheduler/macro contracts | sole owner of macro materialization shared surface |
| R6-B | globe→regional→local representation handoff | PRESENTATION | current terrain representation contract | sole owner of transition/blend surface |
| R6-C | HUMAN composition/sense-of-place | PRESENTATION | stable local-environment inputs | must not redefine scientific fields or navigation authority |
| R6-D | planetary LOD stitching/morph/culling | RUNTIME/PRESENTATION | terrain patch contract | if same files as R6-B, stack/sequence rather than parallel-write |
| R6-E | causal planet visual consequences | MODEL_DERIVED/PRESENTATION | scientific fingerprint inputs | no canonical promotion; outputs consumed by renderers |
| R6-F | molecular/atomic epistemic visual language | PRESENTATION | source-sample authority | no exact-chemistry claim without authority |
| R6-G | Quality Observatory + diversity metrics | TEST/ANALYSIS | read-only production interfaces | should mainly add tooling/tests/reports, not product authority |
| R6-H | physical-device/accessibility/long-soak evidence | TEST | stable candidate checkpoints | read-only product code unless a designated fix lane exists |
| R6-I | UX orientation/scale-awareness prototype | PRESENTATION | selection/scale APIs | avoid editing central navigation owner until contract allows |
| R6-J | systemic-audio research/prototype | RESEARCH/PRESENTATION | environmental context API | isolated additive module; no critical-path dependency |

Read-only adversarial reviewers should run concurrently for: science, visual/product quality, performance/resources, accessibility/mobile, architecture/authority and determinism.

## 15.4 Second parallel wave after R6 continuity seams stabilize

Start up to ~10 lanes in parallel:

- time/timeline product projection;
- scientific fingerprint + WHY graph;
- scientific instruments;
- Atlas/snapshots/journey history;
- property search + interestingness;
- compare/causal divergence;
- Explorer/Scientist/Director mode shell;
- adaptive quality/WebGPU research;
- systemic audio/sonification;
- Quality Observatory expansion/falsification.

These lanes share contracts but should own separate providers/projections. The integration owner composes them in dependency order.

## 15.5 Scientific research wave

Parallel research may proceed on:

- stellar/cosmic distributions;
- planet interiors/giant families;
- atmosphere/volatile evolution;
- greenhouse/surface climate;
- geology/hydrology/physical elevation;
- life readiness/ecology/evolution;
- material/microstructure models;
- civilization/history models.

Research branches do not become canonical through age, complexity or visual plausibility. Promotion requires separate scientific/governance transactions.

---

# 16. Integration and convergence order

Default convergence order for a major wave:

1. shared contracts/seams and schema compatibility;
2. deterministic/persistence/temporal adapters;
3. canonical scientific providers in upstream dependency order;
4. model-derived causal providers/cross-scale projections;
5. runtime/scheduling/resource platform;
6. rendering/representation providers;
7. UX/input/Atlas/analysis projections;
8. audio/sonification/director adjuncts;
9. focused lane evidence;
10. cumulative journey/visual/device/resource/science certification;
11. founder-visible review;
12. only then promotion decision.

Avoid continuous merging of half-integrated shared-surface work. Prefer coherent lane checkpoints and periodic convergence candidates.

---

# 17. Evidence model for state-of-the-art claims

Each capability needs evidence appropriate to its claim.

## Scientific
- provenance/reference/model version;
- authority class;
- assumptions/applicability;
- independent oracle/falsification where feasible;
- invariants/conservation;
- explicit unknown/unsupported behavior;
- cross-scale reconciliation.

## Determinism/persistence
- query-order invariance;
- replay/checkpoint equivalence;
- snapshot exact-return tests;
- migration/version behavior;
- stale-work rejection.

## Performance/runtime
- phase-level CPU/GPU timing;
- p50/p95/p99 and worst-path analysis;
- long-soak memory/resource counts;
- low/mid/high device profiles;
- context loss/recovery;
- no idle work when settled;
- bounded cache/residency.

## Visual/product
- all-scale temporal visual captures, not only stills;
- blinded V1/V2/current comparisons;
- multi-world anti-sameness review;
- globe-to-ground continuity review;
- HUMAN sense-of-place review;
- lighting/exposure/outlier review.

## UX/accessibility
- keyboard/touch/mouse/pen where applicable;
- reduced motion;
- semantic focus/selected-object context;
- mobile viewport/orientation;
- screen-reader relevant projections;
- essential-function alternatives.

## Exploration/analysis
- bounded sparse search;
- reproducible interestingness;
- exact return to Atlas entries;
- compare state alignment;
- measurement provenance.

---

# 18. Milestone ladder

This ladder is evidence-gated, not calendar-gated.

## M0 — R6 Continuous Reality closure
Macro streaming, visual handoff, HUMAN, planetary walking, LOD and lower-scale epistemic defects materially closed.

## M1 — Perceptually vast causal universe
Cosmic scale/depth, world diversity, illumination/atmosphere and causal presentation make destinations feel genuinely distinct and continuous.

## M2 — Scientific universe
Fingerprint, WHY, provenance, uncertainty and instruments allow users to interrogate what they see without scientific overclaim.

## M3 — Temporal and persistent universe
Time, snapshots, Atlas and journey replay make `where + when + what I observed` durable.

## M4 — Intelligent exploration
Property search, similarity, anomaly/interestingness and guided journeys make an effectively infinite address space navigable.

## M5 — Analytical universe
Compare, causal divergence, measurements, explored-universe statistics and counterfactual Lab support genuine analysis.

## M6 — Immersive/directable universe
Systemic audio, sonification and Director mode turn OFU into an experiential and visual-scientific instrument.

## M7 — Self-observing quality system
Perceptual diversity, mass falsification, performance/resource observatory and physical-device evidence continuously detect regressions and sameness.

## M8 — Living/historical universe
Only after prerequisites: governed life/ecology/evolution/history/civilization and later local cognition.

---

# 19. What must not happen

- Do not replace the current architecture with a new monolithic engine because product quality lags.
- Do not call a new generation complete because many commits/checkpoints exist.
- Do not solve diversity with uncontrolled random noise.
- Do not solve scientific gaps with plausible visual fiction labeled as fact.
- Do not add life/civilization as decorative templates detached from environment/history.
- Do not let AI-generated explanations become authority.
- Do not let Director/Scientist UI contaminate Explorer immersion.
- Do not make WebGPU, XR or local AI mandatory for baseline semantic correctness.
- Do not create many writer agents that edit the same bootstrap/renderer/registry files.
- Do not merge a technically green candidate while founder-visible continuity/HUMAN/visual defects remain.

---

# 20. Definition of the final state-of-the-art experience

A user opens one offline file and sees the universe.

They travel toward an interesting galaxy without a visible loading boundary. They select a star system, inspect a planet and descend through atmosphere to the exact chosen surface location. The same terrain remains recognizable during the descent. They walk for as long as they want while the planet streams invisibly around them.

The world looks different because its causes are different. Its star, atmosphere, gravity, volatile state, surface processes and material regime visibly matter.

They notice an unusual formation, select it and ask **WHY**. OFU shows the causal ancestry and clearly marks what is canonical, model-derived, illustrative or unknown. They measure it, sample it, descend into the material and continue toward microscopic and atomic-context views without being shown fake exact chemistry.

They compare the world with another one, identify where the causal histories diverge, move the timeline where supported, save the observation to an Atlas, and later return to the same place, time, sample and camera context.

If they want discovery, OFU can find unusual or scientifically relevant destinations. If they want immersion, the interface recedes. If they want analysis, Scientist mode exposes evidence. If they want a cinematic journey, Director mode uses the same underlying universe.

Throughout the entire experience:

- no required network;
- no semantic scene reset;
- no unbounded world materialization;
- no loss of identity;
- no unsupported science disguised as truth;
- no hardware quality setting that changes the universe itself.

That is the target this roadmap defines as **One File Universe at the state of the art**.
