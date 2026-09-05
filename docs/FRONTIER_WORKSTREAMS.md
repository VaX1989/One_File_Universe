# Forward Frontier Workstreams

**Status:** PLANNING / orchestration metadata. Not canonical universe state and not an activated development wave.

The authoritative machine-readable companion is `docs/frontier/WORKSTREAM_DAG.json`. Every workstream there includes ID, mission, user-visible outcome, maturity, authority, inputs/outputs, dependencies, consumers, parallel-safe sublanes, shared-file risks, cross-scale invariants, scientific status, performance envelope, evidence requirements, promotion gate and known unsupported areas.

## 1. Workstream model

| ID | Workstream | Current maturity | Dependencies | Can start now? | Safe group | Primary write ownership | Shared contract | Integration order | Certification gate |
|---|---|---|---|---|---|---|---|---|---|
| F-GOV | Canonical contracts & governance | DONE_WITHIN_DECLARED_SCOPE + new seams PLANNED | — | YES, prerequisite | G0 | `docs/contracts`, canonical schemas, ADRs | authority/provider/query/event contracts | 1 | foundation + ADR + compatibility |
| F-EXP | Universal exploration & spatial query | PROTOTYPED | F-GOV | YES after seam freeze | G1 | exploration/query modules | selection/query/scale-regime API | 2 | sparse query + identity + journey |
| F-ASTRO | Astronomy & cosmic structure depth | PARTIAL | F-GOV,F-EXP | YES | G1 | astronomy providers/research | P2/P3-compatible provider boundary | 3 | scientific + distribution + sparse cost |
| F-PLANET | Planetary reality | PARTIAL / RESEARCH ACTIVE | F-GOV,F-ASTRO,F-STATE | YES as research; promotion gated | G1 | planetology providers/research | environment/planet authority boundary | 3 | scientific oracle + conservation + cross-scale |
| F-LIFE | Life, ecology & evolution | RESEARCH_ONLY beyond frozen P6 v1 | F-PLANET,F-STATE | YES as research only | G1 | biology providers/research | P5→P6 successor/readiness boundary | 4 | positive env authority + lifecycle/replay |
| F-CIV | Civilization, culture & economy | NOT_IMPLEMENTED | F-LIFE,F-PLANET,F-STATE,F-HISTORY | YES as research only | G1 | civilization providers/research | population/resource/history APIs | 5 | causal + replay + late-materialization |
| F-HISTORY | Deep history & late materialization | PARTIAL foundation | F-STATE,F-GOV | YES architecture/research | G1 | history/simulation modules | REFINE/PROJECT temporal contracts | 4 | replay/compaction + refinement invariants |
| F-PLAY | Gameplay & governed intervention | NOT_IMPLEMENTED beyond navigation | F-EXP,F-STATE | YES architecture; domain actions gated | G2 | gameplay intent/adapters | canonical action→event boundary | 6 | persistence + consequence journey |
| F-VIS | Rendering & visual quality | PROTOTYPED / ACTIVE | F-EXP,F-ENGINE | YES | G1 | renderer providers/backends | presentation state + scene provider | 6 | visual/resource/device + non-interference |
| F-UX | Product experience & accessibility | PROTOTYPED / ACTIVE | F-EXP | YES | G1 | product/input/accessibility modules | semantic intent + inspection projections | 7 | journey + WCAG-oriented + device evidence |
| F-ENGINE | Runtime, scheduling & portability | PARTIAL | F-GOV | YES, prerequisite | G0/G1 | runtime/resource/build seams | capability/budget/provider registries | 2 | bounded resources + Strict/Enhanced |
| F-STATE | Persistence, lineage & migrations | DONE_WITHIN_P4_SCOPE / EXTENSIONS_PLANNED | F-GOV | YES extension architecture | G1 | temporal/persistence adapters | P4 transition/archive contract | 2 | replay/checkpoint/migration equivalence |
| F-MICRO | Microscopic biology | ARCHITECTURALLY_RESERVED | F-LIFE,F-EXP | YES research only | G1 | microscopic research/providers | organism↔cell regime bridge | 6+ | multiscale reconciliation + bounded materialization |
| F-MATTER | Molecular & atomic representations | ARCHITECTURALLY_RESERVED | F-GOV,F-MICRO | YES research only | G1 | matter research/providers | cell↔molecular/atomic regime bridge | 7+ | model validity + bounded local materialization |
| F-NONCLASS | Non-classical / quantum-compatible research | ARCHITECTURALLY_RESERVED / SPECULATIVE | F-MATTER,F-GOV | YES pure research only | G-R | research docs/prototypes only | explicit regime/observable compatibility | research | no canonical gate defined |
| F-SOUND | Systemic audio | NOT_IMPLEMENTED | F-EXP,F-ENGINE | YES research/presentation | G1 | audio modules | context/audio provider API | 8 | accessibility/resource/non-interference |
| F-CERT | Conformance & release certification | MATURE PER-PHASE / CONTINUOUS | all selected release workstreams | YES framework maintenance | G-C | tests/evidence/governance | evidence manifest + exact-head policy | final | exact candidate + claim mapping |

`Can start now` distinguishes research/architecture from canonical promotion. A `YES` does not authorize a writer branch by itself.

## 2. Current-state gap map

| Capability | Evidence-grounded state | Long-range gap |
|---|---|---|
| Deterministic foundation | DONE_WITHIN_DECLARED_SCOPE | extend only through versioned successor contracts |
| Sparse universe/addressing | DONE_WITHIN_DECLARED_SCOPE | generalized exploration queries and richer domains |
| Astronomy | DONE_WITHIN_P3_SCOPE | richer galaxy/stellar physics/distributions and arbitrary product traversal |
| Time/history infrastructure | DONE_WITHIN_P4_SCOPE | domain reducers, branching/revision policy if ever required, richer history models |
| Planetary physics | PARTIAL | interiors, volatile genesis, giant families, mutable evolution and richer physics |
| Terrain | PARTIAL | physical elevation/hypsometry, geology, erosion, hydrology; current canonical signal is stylized |
| Climate/environment | PARTIAL + RESEARCH | canonical surface temperature, greenhouse, transport, clouds/weather, oceans/ice where justified |
| Biology | P6 v1 DONE_WITHIN_FAIL_CLOSED_SCOPE; positive biology RESEARCH_ONLY | authoritative environment, energy/nutrients, genesis policy, persistent lifecycle/evolution |
| Universal target selection | PROTOTYPED | arbitrary supported address/query discovery, not fixed destinations |
| Galaxy traversal | PROTOTYPED in current Wave IV development | product-grade arbitrary traversal, scale continuity, certification |
| Planet/orbit/approach | PROTOTYPED | generalized targets, final navigation/visual quality |
| Arbitrary surface exploration | PROTOTYPED/PARTIAL presentation only | canonical/geographically constrained global→local spatial freedom |
| Cross-scale continuity | PARTIAL | authoritative planet→region→local and bio/civ/micro reconciliation |
| Graphics | PROTOTYPED/ACTIVE | state-of-the-art honest astronomy/planet/surface/life/city quality; WebGPU Enhanced path |
| UI/UX | PROTOTYPED/ACTIVE | viewport-first direct manipulation, contextual Inspect, expert Lab, journey polish |
| Mobile/accessibility | PARTIAL | broad physical-device/AT verification and mature touch-first product |
| Persistence | DONE_WITHIN_P4_SCOPE | future domain lineage/migration and very long history growth policies |
| Civilization | NOT_IMPLEMENTED | entire causal society/culture/economy stack |
| Gameplay/intervention | NOT_IMPLEMENTED beyond navigation/product controls | governed canonical action loops and consequences |
| Microscopic reality | ARCHITECTURALLY_RESERVED | organism/tissue/cell models and bridges |
| Molecular/atomic | ARCHITECTURALLY_RESERVED | bounded scientific models/visualization and regime transitions |
| Non-classical/quantum | ARCHITECTURALLY_RESERVED / SPECULATIVE | research only; no brute-force promise |
| Audio | NOT_IMPLEMENTED as mature systemic pillar | procedural/systemic accessible audio architecture |
| WebGPU | ARCHITECTURALLY_RESERVED / capability-probe level | optional Enhanced backend with parity/non-interference evidence |
| Performance/resources | PARTIAL, explicit bounded policies exist | broader streaming/scheduling/large-artifact startup and long-soak evidence |
| Certification | STRONG phase evidence; current Wave IV NOT READY | product-quality/device gates must remain equal to semantic gates |

## 3. Current Wave IV evidence boundary

At rebaseline:

- `main = 44f6e068d7d513c8746f23fb7580572758dc2ece`;
- PR #48 head = `0563b5ccfdc19c072e1cee42751471186b6d0b90`;
- Foundation, P1, P2, P3, P4, P1–P4 baseline, P5, P5 Environment v2, P6 and Wave IV Massive Convergence Development pass at that exact head;
- Rendering Production run `33926461219` fails, including the v0.8 Explore selection/navigation step on multiple browser jobs;
- founder/release readiness therefore remains false.

Wave IV also demonstrates useful runtime-contract experiments: single scale owner, normalized input intent, canonical selection bridge, scene providers, local frame/floating origin and bounded presentation terrain. These are CURRENT DEVELOPMENT evidence, not final universal-exploration or physical-geography contracts.

## 4. Science critical path

The current research evidence makes the positive-life dependency explicit:

`P3/P5 physical baseline → governed volatile/environment state → authoritative surface-temperature/medium/energy/nutrient state → fail-closed biology readiness → positive Biology successor (if justified) → ecology/evolution → civilization/history`.

The `research/p5-environment-next-science` branch has useful non-canonical volatile-transfer/readiness work. `research/p6-biology-v2-on-p5next` has useful bounded lifecycle/identity/replay research. Neither is canonical promotion evidence, and both are based on older/diverged ancestry relative to current `main`; future promotion must reconcile deliberately rather than merge blindly.

## 5. Product critical path

`shared provider/query seams → universal exploration query/selection → continuous reversible scale/regime travel → canonical/geographically constrained surface targeting → product journey/accessibility → high-quality rendering/resource evidence → device/release certification`.

Science and product paths interact but do not need to serialize all work. Rendering/UX can improve using existing authority as long as they remain presentation-honest.

## 6. Maximum safe initial parallelism

After the parallelization-enabling seam transaction lands, the recommended first high-throughput wave supports about **10 independent writer/research lanes**, plus read-only adversarial review. Before that seam freeze, pushing beyond roughly **4 shared-surface writers** is counterproductive because bootstrap/build/selection/scene/test ownership still collides.

The ten-lane proposal is documented in `PARALLEL_DEVELOPMENT_ARCHITECTURE.md`. It is a topology proposal only, not an activated wave.

## 7. Promotion discipline

Every future workstream must pass its own domain gate plus cross-domain integration. Scientific work needs provenance, evidence/fidelity, independent falsification/oracle where appropriate and explicit unknown/unsupported states. Rendering needs visual correctness, resource/lifecycle and canonical non-interference. UX needs journey, input, accessibility and device evidence. Runtime needs bounded resource and Strict/Enhanced behavior. Persistence needs replay/lineage/migration equivalence.

No green CI aggregate may override a material founder-visible visual defect, scientific overclaim or broken primary journey.
