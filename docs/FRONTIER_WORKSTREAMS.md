# Forward Frontier Workstreams

**Status:** PLANNING / orchestration metadata for the authorized v1.0 program. Not canonical universe state and not an independently activated parallel writer wave.

The authoritative machine-readable companion is `docs/frontier/WORKSTREAM_DAG.json`. Every workstream there includes ID, mission, user-visible outcome, maturity, authority, inputs/outputs, dependencies, consumers, parallel-safe sublanes, shared-file risks, cross-scale invariants, scientific status, performance envelope, evidence requirements, promotion gate and known unsupported areas.

## 1. Workstream model

| ID | Workstream | Current maturity | Dependencies | Can start now? | Safe group | Primary write ownership | Shared contract | Integration order | Certification gate |
|---|---|---|---|---|---|---|---|---|---|
| F-GOV | Canonical contracts & governance | DONE_WITHIN_DECLARED_SCOPE + new seams PLANNED | — | YES, prerequisite | G0 | `docs/contracts`, canonical schemas, ADRs | authority/provider/query/event contracts | 1 | foundation + ADR + compatibility |
| F-EXP | Universal exploration & spatial query | PROTOTYPED | F-GOV | YES after seam freeze | G1 | exploration/query modules | selection/query/scale-regime API | 2 | sparse query + identity + journey |
| F-ASTRO | Astronomy & cosmic structure depth | PARTIAL | F-GOV,F-EXP | YES | G1 | astronomy providers/research | P2/P3-compatible provider boundary | 3 | scientific + distribution + sparse cost |
| F-PLANET | Planetary reality | PARTIAL / RESEARCH ACTIVE | F-GOV,F-ASTRO,F-STATE | YES after seams; canonical promotion separate | G1 | planetology providers/research | environment/planet authority boundary | 3 | scientific oracle + conservation + cross-scale |
| F-LIFE | Life, ecology & evolution | RESEARCH_ONLY beyond frozen P6 v1 | F-PLANET,F-STATE | YES as model-derived work after upstream contracts | G1 | biology providers/research | P5→P6 successor/readiness boundary | 4 | positive env authority + lifecycle/replay |
| F-CIV | Civilization, culture & economy | NOT_IMPLEMENTED | F-LIFE,F-PLANET,F-STATE,F-HISTORY | YES as model-derived work after upstream contracts | G1 | civilization providers/research | population/resource/history APIs | 5 | causal + replay + late-materialization |
| F-HISTORY | Deep history & late materialization | PARTIAL foundation | F-STATE,F-GOV | YES architecture/research | G1 | history/simulation modules | REFINE/PROJECT temporal contracts | 4 | replay/compaction + refinement invariants |
| F-PLAY | Gameplay & governed intervention | NOT_IMPLEMENTED beyond navigation | F-EXP,F-STATE | YES architecture; domain actions gated | G2 | gameplay intent/adapters | canonical action→event boundary | 6 | persistence + consequence journey |
| F-VIS | Rendering & visual quality | PROTOTYPED / ACTIVE | F-EXP,F-ENGINE | YES | G1 | renderer providers/backends | presentation state + scene provider | 6 | visual/resource/device + non-interference |
| F-UX | Product experience & accessibility | PROTOTYPED / ACTIVE | F-EXP | YES | G1 | product/input/accessibility modules | semantic intent + inspection projections | 7 | journey + WCAG-oriented + device evidence |
| F-ENGINE | Runtime, scheduling & portability | PARTIAL | F-GOV | YES, prerequisite | G0/G1 | runtime/resource/build seams | capability/budget/provider registries | 2 | bounded resources + Strict/Enhanced |
| F-STATE | Persistence, lineage & migrations | DONE_WITHIN_P4_SCOPE / EXTENSIONS_PLANNED | F-GOV | YES extension architecture | G1 | temporal/persistence adapters | P4 transition/archive contract | 2 | replay/checkpoint/migration equivalence |
| F-MICRO | Microscopic biology | ARCHITECTURALLY_RESERVED | F-LIFE,F-EXP | YES bounded models after contracts | G1 | microscopic research/providers | organism↔cell regime bridge | 6+ | multiscale reconciliation + bounded materialization |
| F-MATTER | Molecular & atomic representations | ARCHITECTURALLY_RESERVED | F-GOV,F-MICRO | YES bounded models after contracts | G1 | matter research/providers | cell↔molecular/atomic regime bridge | 7+ | model validity + bounded local materialization |
| F-NONCLASS | Non-classical / quantum-compatible research | ARCHITECTURALLY_RESERVED / SPECULATIVE | F-MATTER,F-GOV | YES pure research only | G-R | research docs/prototypes only | explicit regime/observable compatibility | research | no canonical gate defined |
| F-SOUND | Systemic audio | NOT_IMPLEMENTED | F-EXP,F-ENGINE | YES research/presentation | G1 | audio modules | context/audio provider API | 8 | accessibility/resource/non-interference |
| F-CERT | Conformance & release certification | MATURE PER-PHASE / CONTINUOUS | all selected release workstreams | YES framework maintenance | G-C | tests/evidence/governance | evidence manifest + exact-head policy | final | exact candidate + claim mapping |

`Can start now` distinguishes authorized model-derived implementation from canonical scientific promotion. The active program supplies implementation authority in its explicit branch order; a table entry does not authorize an extra writer branch.

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
| Galaxy traversal | TECHNICALLY_CERTIFIED Wave IV slice | product-grade arbitrary traversal, scale continuity, certification |
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
| Certification | STRONG phase evidence; Wave IV technically promoted | product-quality/device gates must remain equal to semantic gates |

## 3. Reconciled Wave IV evidence boundary

This planning revision is based on the Wave-IV-containing main
`e33156ee8ed9c6e906d0d4e0b8142fa235a833c7`, tree
`5d46fd5e346fd6440cc1efd8cbc67fa13a9390c4`. PR #48's exact candidate
`f4df1452529cb5f121e4065f567b4a3da52d2b75` passed Rendering Production
`33959845666`, Wave IV convergence `33959845605`, Foundation and P1-P6/cumulative
gates before normal protected merge. The previous failing heads are retained
as defect evidence. Physical Android/iOS remain `NOT_VERIFIED`.

Wave IV supplies the preserved technical baseline, not all v1.0 capabilities.
The [active program contract](governance/V1_IMPLEMENTATION_CONTRACT.md) requires
actual PX implementation followed immediately by shipping research conversion.
Maturity entries above are not upgraded merely because that work is authorized.

## 4. Canonical science and model-derived product paths

The current research evidence makes the positive-life dependency explicit:

`P3/P5 physical baseline → governed volatile/environment state → authoritative surface-temperature/medium/energy/nutrient state → fail-closed biology readiness → positive Biology successor (if justified) → ecology/evolution → civilization/history`.

The `research/p5-environment-next-science` branch has useful non-canonical volatile-transfer/readiness work. `research/p6-biology-v2-on-p5next` has useful bounded lifecycle/identity/replay research. Neither is canonical promotion evidence, and both are based on older/diverged ancestry relative to the current product. The v1.0 owner must extract and reimplement eligible work against the new contracts rather than merge blind ancestry. Explicit `MODEL_DERIVED_SIMULATION` is an authorized shipping path, not an excuse for an empty product or a claim of canonical scientific promotion.

## 5. Product critical path

`shared provider/query seams → universal exploration query/selection → continuous reversible scale/regime travel → canonical/geographically constrained surface targeting → product journey/accessibility → high-quality rendering/resource evidence → device/release certification`.

Science and product paths interact but do not need to serialize all work. Rendering/UX can improve using existing authority as long as they remain presentation-honest.

## 6. Maximum safe initial parallelism

After the parallelization-enabling seam transaction lands, the recommended first high-throughput wave supports about **10 independent writer/research lanes**, plus read-only adversarial review. Before that seam freeze, pushing beyond roughly **4 shared-surface writers** is counterproductive because bootstrap/build/selection/scene/test ownership still collides.

The ten-lane proposal is documented in `PARALLEL_DEVELOPMENT_ARCHITECTURE.md`. It is a topology proposal only, not an activated wave.

## 7. Promotion discipline

Every future workstream must pass its own domain gate plus cross-domain integration. Scientific work needs provenance, evidence/fidelity, independent falsification/oracle where appropriate and explicit unknown/unsupported states. Rendering needs visual correctness, resource/lifecycle and canonical non-interference. UX needs journey, input, accessibility and device evidence. Runtime needs bounded resource and Strict/Enhanced behavior. Persistence needs replay/lineage/migration equivalence.

No green CI aggregate may override a material founder-visible visual defect, scientific overclaim or broken primary journey.
