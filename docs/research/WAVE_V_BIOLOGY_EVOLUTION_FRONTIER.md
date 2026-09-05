# One File Universe — Wave V Lane WV-C Biology v2 / Evolution / Ecology Frontier

Status: **RESEARCH ONLY / NON-CANONICAL / NO PRODUCT INTEGRATION / NO PROMOTION**  
Authorized branch: `research/wave-v-biology-evolution-2026-09-05`  
Research contract: `ofu-wave-v-biology-evolution-research-v1`  
Research model: `wave-v-biology-evolution-research-1`

## 1. Execution-mode adjudication

The Wave V pack requires `RESEARCH_ONLY` while `WAVE_V_PARALLEL_BASE_SHA` and `WAVE_V_PARALLEL_BASE_TREE` remain unresolved. Live repository inspection found no Prompt-0 exact Wave V base commit, tree, or ownership manifest at the time this lane was created. Therefore this lane does **not** claim `FULL_ISOLATED_LANE` status and does not modify shared production/runtime surfaces.

To preserve rather than restart the prior science, this research branch was created from the exact Wave IV combined environment/biology research head:

- Wave IV research head: `56e44c8708338309f90a6354ce16f4140ea87ca0`
- Wave IV tree: `f158b3f9aa2d6bdb5f0ed059740122e38cb8f8ba`
- stacked P5-next/Biology-v2 ancestor: `7cb7f46fd6b0dcdfc3cd35ddec662e832b31f2eb`
- P5 Environment-next ancestor: `8858e7d65bd12888368ce2d7233f0ce3fe7b81a5`

Live ancestry comparison established that Wave IV is 19 commits ahead of the stacked Biology-v2/P5-next head and 0 behind. No research-history rewrite was needed.

This research base is **not** represented as the missing Wave V parallel production base.

## 2. Certified-history preservation

Canonical P6 v1 remains untouched:

- contract `ofu-p6-biosphere-v1`
- model `p6-biosphere-evolution-1`
- transition scope `GENESIS_GUARD_ONLY_NO_ACCEPTED_P5_V2_PATH`

Its current canonical result remains fail-closed: `INSUFFICIENT_ENVIRONMENT`, `biologyEstablished=false`, with no accepted positive genesis path. WV-C neither replaces nor weakens that result.

P2 remains Entity Identity authority. P4 remains the only authority for time, accepted event identity, transition ordering, replay, checkpoints, compaction, archive, and mutable biological history. WV-C owns research payload/model semantics only and records zero private biological history.

## 3. Prior-research adjudication

WV-C preserves the material repairs already made by Biology-v2 and Wave IV:

1. lifetime biological persistence is bounded independently of P4 event-tail compaction;
2. aggregate ecology cannot double-spend one biosphere energy ceiling across multiple lineages;
3. material parameters have explicit source/version, validity domain, assumptions, units, uncertainty, evidence and fidelity rather than silent defaults;
4. population arithmetic is bookkeeping over supplied demographic flows, not a universal logistic/stress law;
5. quantitative-genetic response is model-conditional rather than an automatic adaptation law;
6. speciation requires an explicit criterion/witness; scalar trait distance alone is not taxonomic authority;
7. positive research entry is post-genesis only and cannot claim canonical abiogenesis;
8. P4 owns all persistent transition semantics;
9. canonical P6 v1 remains fail-closed.

WV-C advances from those repairs rather than re-implementing them under new names.

## 4. State-of-the-art research synthesis

### 4.1 Energy and metabolism

Known terrestrial life spans energy regimes far below conventional culture-derived maintenance estimates. Consequently WV-C does not freeze one universal minimum maintenance constant. Energy accounting accepts explicit source-energy and capture-efficiency intervals and keeps conversion to biomass/population capacity `NOT_INFERRED` unless a separately sourced model supplies that relationship.

Redox/electron-transfer structure is retained as a first-class constraint because terrestrial metabolism is fundamentally tied to redox chemistry. The research model does not universalize NAD(H), ATP, Earth electron carriers, or a fixed metabolic catalogue to extraterrestrial life.

### 4.2 Nutrients and productivity

Bulk elemental presence is not equivalent to biological availability. Nitrogen and phosphorus literature demonstrates strong dependence on chemical form, recycling, redox state, and biological transformation. Positive post-genesis research eligibility therefore requires explicit nutrient-availability and redox-gradient witnesses rather than assuming that an element inventory automatically supports productivity.

WV-C intentionally does not declare nitrogen, phosphorus, DNA, proteins, chlorophyll or any Earth-specific biochemical implementation universal to exobiology.

### 4.3 Ecology

Ecological interaction networks are represented explicitly, including trophic, competition, mutualism, facilitation, parasitism and symbiosis classes. Trophic demand is bounded against explicitly available population energy.

Network topology does **not** authorize ecosystem stability, specialization, coextinction risk or causal ecological law. Modern network-ecology reviews show that abundance, diversity, sampling and representation can strongly affect apparent network properties; WV-C therefore treats topology as a constrained state representation rather than a shortcut to ecological truth.

### 4.4 Population dynamics and life cycles

WV-C provides exact stage-structured demographic bookkeeping over supplied counts, mortality, transitions and births. It conserves population within the declared flows and records `endogenousGrowthLaw = NONE`.

Lifecycle graphs are explicit model inputs. Lifecycle transitions bind a P4 operation key and can propose mutable truth only through P4. The model does not assume direct development, metamorphosis, sex, meiosis, multicellularity or any Earth lifecycle pattern as universal.

### 4.5 Evolution, speciation and extinction

Mutation, selection, drift, migration, recombination, horizontal transfer, symbiosis and developmental innovation are explicit mechanism witnesses. Their terrestrial reality does not imply a universal mapping from short-timescale trait change to macroevolutionary diversification.

Recent speciation-model literature reinforces the danger on both sides: coarse lineage-particle birth/death models cannot reveal mechanism, while excessively detailed microscopic models do not automatically yield robust macroevolution predictions. WV-C therefore emits **criterion-bound event eligibility**, not a universal speciation rate or universal trait-distance threshold.

Extinction is similarly separated into exact model state and causal prediction. A population count of zero establishes demographic extinction in that modeled state. Nonzero-population extinction causation or future extinction probability remains model/witness dependent; no universal extinction rate exists in WV-C.

### 4.6 Multicellularity, development and morphology

Known multicellular complexity arises through historically contingent combinations of cooperation, division of labour, development and evolving interdependence. WV-C consequently refuses a body-part/mesh roulette generator.

A morphology candidate may be checked only against explicit lineage trait envelopes, environmental tags, ecological-role tags and lifecycle state. Passing these constraints means only `constraintSatisfied=true`; it does not prescribe geometry or establish an alien body plan. `bodyParts` are deliberately rejected by the current research contract.

### 4.7 Exobiology boundary

No empirically observed extraterrestrial biosphere, lineage, species or organism exists to calibrate a universal alien taxonomy, morphology law or abiogenesis probability. WV-C keeps the required status categories separate:

- `ESTABLISHED_GENERAL`
- `EARTH_EMPIRICAL`
- `PLAUSIBLE_HYPOTHESIS`
- `SPECULATIVE_EXOBIOLOGY`
- `GENERATIVE_FICTIONAL`

Deterministic software behavior never upgrades an empirical/scientific status category.

## 5. Successor research architecture

### 5.1 Positive-life eligibility

`positiveLifeEligibility()` requires all of:

- a positive **research-only** P5 post-genesis readiness witness;
- viable biological medium established by an upstream witness;
- usable energy established;
- nutrient availability established;
- redox gradient established;
- authority exactly `EXTERNAL_POST_GENESIS_SEED` or `RESEARCH_FIXTURE_ONLY`;
- `canonicalGenesisClaim=false`.

Even when all are present, the result has:

- `state = RESEARCH_POST_GENESIS_ELIGIBLE`;
- `canonicalBiologyAuthority=false`;
- `canonicalGenesisAvailable=false`;
- `abiogenesisInferred=false`;
- `abiogenesisProbability=null`.

This deliberately separates post-genesis conformance from origin-of-life prediction.

### 5.2 Energy budget

The Wave V energy model accepts one to sixteen source records with:

- available energy interval;
- explicit capture-efficiency interval;
- energy class;
- scientific status category.

It calculates captured, maintenance and allocatable energy intervals with integer ppm arithmetic. No hidden trophic/capture efficiency exists. Biomass and population capacity remain uncomputed.

### 5.3 Ecological network

The bounded network supports up to 256 materialized population nodes and 2048 interaction records per query. Trophic edges carry explicit demand intervals and fail if the total outgoing demand for a population exceeds its explicit allocatable-energy upper bound. Non-trophic interactions cannot smuggle trophic-energy demand.

This is an accounting/reconciliation rule, not a universal ecosystem law.

### 5.4 Population and lifecycle model

`stageStructuredStep()` supports at most 16 stages and 64 explicit stage transitions. It applies integer mortality/transition probabilities, rejects probability overcommitment, checks demographic conservation and has no endogenous growth-rate formula.

`lifecycleTransition()` validates only declared state transitions and binds them to P4 operation keys. It does not persist a private lifecycle history.

### 5.5 Lineage/evolution model

`evolutionTransitionWitness()` binds a lineage, explicit mechanism witnesses, proposed bounded trait changes and a P4 operation key. It may **propose** a P4 transition but never automatically accepts one. `microToMacroPrediction=false` is explicit.

### 5.6 Speciation/extinction

`speciationWitness()` requires distinct parent/child lineage identity plus an explicit criterion, criterion status, evidence witness and P4 operation key. It always reports `universalSpeciesThresholdUsed=false` and `taxonomicTruthEstablished=false`.

`extinctionWitness()` distinguishes zero-population model truth from model-dependent causes and reports `predictiveExtinctionProbability=null`.

### 5.7 Morphology constraints

`morphologyConstraintWitness()` validates candidates against:

`environment + ecological role + lineage trait envelope + lifecycle stage`.

It does not generate anatomy. Arbitrary body-part lists are rejected. Synthetic trait envelopes are allowed for deterministic conformance but remain `GENERATIVE_FICTIONAL` unless a stronger source explicitly establishes otherwise.

## 6. Hierarchical biological state and materialization

WV-C maps the requested hierarchy to bounded semantic materialization:

```text
planetary biosphere
→ biome/ecosystem
→ populations
→ lineage/species
→ organism
```

Materialization policy:

- `COLD`: biosphere commitments only; no ecosystem/population/lineage detail instantiated;
- `WARM`: ecosystem and population commitments may materialize; lineage detail remains absent;
- `HOT`: lineage/lifecycle/evolution detail may materialize;
- `IMMEDIATE`: bounded organism samples may materialize for a specific local query.

IMMEDIATE organisms are always:

- `persistent=false`;
- `individualIdentityPromoted=false`;
- bound to an already materialized population and lineage;
- unable to change coarse population counts merely by being sampled.

`reconcileHierarchy()` rejects fine samples that contradict coarse population/lineage commitments, rejects organisms for a zero population, and forbids abundance inference from a local sample.

Thus refinement does not become truth replacement.

## 7. Mutable history / P4 compatibility

Every research transition that could become persistent carries a P4 operation key. WV-C defines no private clock, event ID, event ordering, replay log, checkpoint schedule or archive format.

Future promotion would need separate versioned P4 transition descriptors for any accepted lifecycle, population, adaptation, speciation or extinction event. This lane does not promote those descriptors.

## 8. Deterministic synthetic corpus and falsification targets

The Wave V corpus exercises a positive research-only environment without representing a canonical planet as alive.

Expected arithmetic witnesses include:

- phototrophic source 1000..1200 U at 0.2..0.3 capture;
- chemotrophic source 500..700 U at 0.1..0.2 capture;
- captured energy 250..500 U;
- maintenance 25..100 U at 0.1..0.2;
- allocatable energy 200..450 U;
- stage population 100 juveniles + 50 adults;
- 10% mortality for both stages;
- 40% juvenile→adult transition;
- 20 external births;
- resulting 70 juveniles + 85 adults = 155 total.

Falsification tests include:

- forged canonical-genesis claim rejection;
- missing/negative research eligibility inputs remain insufficient;
- duplicate energy source IDs reject;
- trophic oversubscription rejects;
- unknown interaction population references reject;
- stage probability overcommitment rejects;
- demographic conservation is exact;
- undeclared lifecycle transition rejects;
- speciation never establishes universal taxonomic truth;
- body-part roulette rejects;
- WARM materialization cannot instantiate lineage detail;
- non-IMMEDIATE organism samples reject;
- persistent/promoted individual organism identity rejects;
- fine samples contradicting coarse population/lineage reject;
- zero-population organism materialization rejects.

The independent Python oracle re-derives the energy and population arithmetic without importing the JavaScript implementation.

## 9. Dependency frontier

### Dependency-eligible and implemented in WV-C research

- positive post-genesis eligibility gate;
- explicit energy-budget interval arithmetic;
- bounded ecological-network accounting;
- stage-structured population bookkeeping;
- lifecycle transition validation;
- evolution mechanism/trait-change witnesses;
- criterion-bound speciation witness;
- extinction witness;
- environment/ecology/evolution-constrained morphology witness;
- COLD/WARM/HOT/IMMEDIATE materialization;
- cross-scale population/lineage/organism reconciliation;
- deterministic synthetic corpus;
- independent arithmetic oracle;
- scientific claim matrix and source provenance registry.

### Research/design only because input authority is insufficient

- planetary-scale endogenous primary-productivity prediction;
- nutrient/redox availability prediction from arbitrary planet bulk chemistry;
- calibrated population carrying capacity;
- ecological succession dynamics across arbitrary worlds;
- biogeographic range dynamics with promoted planetary geography;
- environment-driven evolution rates;
- calibrated speciation/extinction rates;
- predictive multicellular innovations;
- extraterrestrial morphology/taxonomy law.

These should be revisited when upstream P5 successor contracts provide source-bound climate/geography/energy/nutrient histories and when scientific validation supports a narrower model domain.

### Canonically blocked

- positive canonical biosphere establishment;
- predictive/canonical abiogenesis;
- canonical lineage/species/organism truth for current shipped worlds.

## 10. Promotion-readiness vs implementation completeness

**Implementation completeness:** `RESEARCH_CANDIDATE_IMPLEMENTED_FOR_DEPENDENCY_ELIGIBLE_BLOCKS`.

**Canonical promotion readiness:** `BLOCKED`.

Material blockers:

1. exact Wave V production base/ownership manifest was unresolved when this research candidate was developed;
2. no canonical P5 positive environment/energy/nutrient/redox authority is available for life;
3. no scientifically defensible predictive abiogenesis model is available;
4. no empirical extraterrestrial biology exists to validate universal alien taxonomy/morphology;
5. any promoted mutable biology requires separately versioned P4 transition, save/migration and cross-runtime certification work.

No attempt is made to turn research completeness into canonical promotion authority.

## 11. Final lane verdict

**BIOLOGY V2 / EVOLUTION / ECOLOGY FRONTIER ADVANCED — RESEARCH CANDIDATE READY FOR CONVERGENCE; CANONICAL POSITIVE-LIFE PROMOTION BLOCKED BY UPSTREAM P5 AUTHORITY AND ABIogenesis SCIENCE.**
