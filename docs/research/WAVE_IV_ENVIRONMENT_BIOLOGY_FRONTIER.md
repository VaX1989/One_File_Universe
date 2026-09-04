# One File Universe — Wave IV P5 Environment-next + P6 Biology-v2 Frontier

Status: **RESEARCH ONLY / NON-CANONICAL / NO PRODUCT INTEGRATION / NO PROMOTION**  
Research branch: `research/wave-iv-environment-biology-frontier-2026-09-04`

## Exact research lineage

Wave IV was created from the live combined P6-on-P5 research head:

- P5 Environment-next: `8858e7d65bd12888368ce2d7233f0ce3fe7b81a5`, tree `c94f34e3792da81bbb41383555e1606c1c0acd0c`.
- P6 Biology-v2-on-P5next: `7cb7f46fd6b0dcdfc3cd35ddec662e832b31f2eb`, tree `02a1623a7312a994cd840d6ee837378e4e8c457d`.
- Live compare established the P5 head as the P6 stack merge base; P6 was 14 commits ahead and 0 behind. No restack or file-copy lineage repair was required.

## P5 Wave IV advancement

### Source/producer authority

`ofu-p5-state-producer-record-research-v1` distinguishes canonical input, source-bound external state, derived state, research fixture, and unsupported state. This research branch intentionally rejects attempts to instantiate `CANONICAL_INPUT`; canonical authority requires a separate promotion transaction.

No PRNG volatile occurrence prior or canonical volatile genesis model was introduced.

### Thermal frontier

Wave IV does not infer surface temperature from effective radiative temperature. `surfaceTemperatureFromEffectiveTemperature()` returns `UNKNOWN` deterministically. A separately source-governed surface-temperature state may be compared with effective temperature only through a signed offset interval whose causal attribution is explicitly `NOT_INFERRED`.

The offset is not renamed greenhouse warming because clouds, albedo feedback, redistribution, internal heat and other surface-energy effects can contribute.

### Water/medium frontier

A narrow water-phase plausibility contract combines separately supplied surface temperature, supplied H2O inventory and the pre-existing IAPWS saturation diagnostic. It can state that ordinary liquid water is thermodynamically permitted in a global idealized assessment, but always keeps `globalOceanEstablished=false` and `viableBiologicalMediumEstablished=false` unless those are established independently.

### XUV/escape

The escape witness now makes the minimum dependency set explicit: stellar XUV history, upper-atmosphere composition, absorption-radius model, heating-efficiency model, escape-regime assessment, and accepted P4 history. Even a complete dependency set does not automatically authorize a universal energy-limited escape law.

### Geochemical free-energy supply

`ofu-p5-geochemical-free-energy-supply-research-v1` deterministically multiplies a separately supplied reaction free-energy yield by a separately supplied reaction extent. The fixed-point unit is femtojoules per step when free-energy yield is supplied in microjoules per mole and extent in nanomoles per step.

The result establishes none of: occurrence of the reaction, a geological mechanism, biological capture efficiency, maintenance sufficiency, or nutrient availability. Maximum reactions per query: 16.

### Environment history and P5 -> P6 readiness

P5 transition envelopes are bounded and P4-owned; P5 retains zero private history entries. Readiness v2 records availability, authority, evidence, fidelity and reason for every required dependency. Fully explicit fixtures can become `RESEARCH_POST_GENESIS_ELIGIBLE`, while the same witness always has:

- `canAuthorizeCanonicalBiology=false`;
- `canonicalGenesisAvailable=false`;
- `canonicalPositivePath=false`;
- `abiogenesisStatus=NO_CANONICAL_GENESIS_MODEL`.

## P6 Wave IV advancement

### Claim-law repair for all new work

The frozen predecessor contains metadata where `FORMAL` appears as an evidence class. Wave IV preserves that historical checkpoint but all new contracts enforce the required independent axes:

- evidence: `ESTABLISHED`, `EMPIRICALLY_CONSTRAINED`, `HYPOTHETICAL`, `SPECULATIVE`, `FICTIONAL`;
- fidelity: `FORMAL`, `HIGH_FIDELITY`, `APPROXIMATE`, `STYLIZED`, `METAPHORICAL`.

Formal software semantics are not treated as biological validation.

### Parameter authority

`ofu-p6-biological-parameter-authority-research-v1` removes silent numerical defaults. Every material parameter carries interval, units, authority, evidence, fidelity, source/version, validity domain, assumptions and dependencies. Source and parameter claim metadata must agree.

### Ecology energy accounting

P6 energy accounting accepts separately supplied usable energy and sourced intervals for phototrophic/chemotrophic capture, maintenance and each trophic transfer. The inherited maximum of eight trophic transfers is preserved. No universal 10% transfer rule or other hidden efficiency is encoded.

### Population

Wave IV does not introduce a universal logistic/stress growth law. `populationBalance()` performs exact bookkeeping over supplied births, deaths, immigration and emigration and rejects underflow.

### Trait inheritance / selection

A narrow `BREEDERS_EQUATION_RESEARCH` diagnostic is available only with explicit narrow-sense heritability and selection-differential intervals. It is model conditional, rejects unsupported model classes, and refuses silent clamping when a projected trait leaves its bounded domain.

### Speciation

No universal scalar trait-distance criterion is introduced. Without an explicit species-delimitation criterion, the assessment returns `NOT_ESTABLISHED`. A satisfied explicit research criterion can make a research speciation event eligible, but cannot establish universal taxonomic truth.

### Post-genesis seed and checkpoints

Positive P6 research entry accepts only `EXTERNAL_POST_GENESIS_SEED` or `RESEARCH_FIXTURE_ONLY`, requires a positive research-only P5 readiness-v2 witness, and requires `canonicalGenesisClaim=false`. Returned records state `canonicalBiologyAuthority=false` and `abiogenesisInferred=false`.

Checkpoint bounds preserve <=1024 total lineages, <=256 active lineages, <=32 traits per lineage and P4-owned persistence with zero private P6 history entries.

## Deterministic evidence

P5 frontier v4 golden vector:

- effective T 250,000 mK;
- supplied surface T 288,000..290,000 mK;
- offset 38,000..40,000 mK;
- idealized liquid-water phase plausibility can be true while viable biological medium remains false;
- research post-genesis readiness can be true while canonical positive path remains false;
- missing escape dependencies produce no escape rate.

P5 geochemical vector:

- 50,000 microJ/mol × 2,000 nmol/step = 100,000,000 femtoJ/step;
- overflow rejects.

P6 vector:

- source energy 1000 + 1000 U;
- capture intervals 0.2..0.3 and 0.1..0.2 -> primary 300..500 U;
- maintenance 0.1..0.3 -> allocatable 210..450 U;
- first trophic transfer 0.1..0.2 -> 21..90 U;
- trait 0.5, h² 0.2..0.3, selection differential 0.05..0.1 -> response 0.01..0.03 and projected trait 0.51..0.53;
- missing delimitation criterion -> no speciation event eligibility;
- explicit research criterion -> research-event eligibility only;
- demographic vector -> 1030;
- forged canonical genesis rejects;
- lineage bound exhaustion rejects.

Focused Node tests and independently structured Python oracles pass for all three Wave IV numerical blocks.

## Current dependency frontier

### Engineering-blocked

- promotion-grade shared source-authority registry integration;
- promotion-grade cross-runtime certification of the new research contracts.

### Data/model-blocked

- canonical volatile inventories;
- authoritative planet surface-temperature histories;
- planet-specific stellar XUV histories and upper-atmosphere states;
- source-bound planet-specific reaction inventories/throughput;
- biological usable-energy/capture calibration;
- nutrient/redox authority;
- domain-specific biological parameter datasets.

### Scientifically underdetermined from current upstream state

- general greenhouse surface-temperature prediction;
- tectonic regime or hydrothermal activity from bulk mass/radius;
- universal population-growth law;
- universal trophic efficiency;
- universal speciation threshold.

### Fundamentally unsupported as a canonical predictive path

- predictive planetary abiogenesis trigger/model.

## Promotion-readiness summary

| Block | Readiness | Canonical-ready? |
| --- | --- | --- |
| P5 scientific source governance | `PROMOTION_REVIEW_READY` | no |
| P5 source-bound volatile / pressure / mixture | `ORACLE_READY` | no |
| P5 thermal separation | `ORACLE_READY` | no |
| P5 generic surface-temperature predictor | `RESEARCH_ONLY` | no |
| P5 water-phase plausibility | `ORACLE_READY` | no |
| P5 XUV dependency witness | `IMPLEMENTATION_READY` | no |
| P5 source-bound geochemical free-energy arithmetic | `ORACLE_READY` | no |
| P5 readiness v2 | `ORACLE_READY` | no |
| P6 parameter authority | `PROMOTION_REVIEW_READY` | no |
| P6 ecology energy accounting | `ORACLE_READY` | no |
| P6 population balance | `ORACLE_READY` | no |
| P6 trait-response diagnostic | `ORACLE_READY` | no |
| P6 species-delimitation gate | `IMPLEMENTATION_READY` | no |
| P6 post-genesis seed authority | `ORACLE_READY` | no |
| Abiogenesis | `RESEARCH_ONLY / UNSUPPORTED_PREDICTIVE_CANONICAL_PATH` | no |

## Render-facing descriptors

Canonical render-facing truth remains limited to already canonical upstream descriptors and explicit UNKNOWN/UNSUPPORTED Environment-v2 states.

Research-only render-facing descriptors now include source-bound volatile composition/reservoirs, pressure/mixture diagnostics, non-causal thermal offsets, narrow water phase plausibility, research-only post-genesis readiness, source-bound geochemical energy supply, bounded ecology-energy intervals, model-conditional trait-response intervals, and criterion-gated speciation eligibility. They must be labeled `RESEARCH_ONLY / NOT_CANONICAL_PLANET_STATE / NO_CANONICAL_GENESIS / NO_PRODUCT_TRUTH`.

**CANONICAL BIOLOGY POSITIVE PATH = NO.** This is a scientifically deliberate result, not a failed research mission.
