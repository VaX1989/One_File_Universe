# Wave V Lane WV-B — Planetology / Geology / Hydrology / Climate Frontier

**Status:** RESEARCH_ONLY / NON-CANONICAL  
**Branch:** `research/wave-v-planetology-frontier-2026-09-05`  
**Prototype:** `ofu-wave-v-planetology-frontier-research-v1`  
**Authority:** `P5_RESEARCH_DRAFT`  
**Canonical promotion:** NOT REQUESTED  

## 1. Rebaseline and prior-research adjudication

At lane start, live `main` was reverified at `44f6e068d7d513c8746f23fb7580572758dc2ece`, tree `cac4aef25aec7a9f98e8fe388a60cab7e8e963bc`. No repository-resolved `WAVE_V_PARALLEL_BASE_SHA/TREE` or Wave V ownership manifest was found. Per the Wave V pack, this lane therefore remains **RESEARCH_ONLY**. This branch is a research anchor from live canonical history, not a claim that `main` is the unresolved Wave V parallel base.

Existing P5 research was adjudicated rather than discarded:

1. `research/p5-environment-next-science` at `8858e7d65bd12888368ce2d7233f0ce3fe7b81a5` is the strongest base for volatile/environment successor semantics. Preserve: species-resolved reservoir identity, explicit provenance and epistemic status, bounded mass-conserving transfers, ideal-mixture diagnostics with declared assumptions, and fail-closed P6 readiness. Do not promote its missing genesis as zero or as an implicit prior.
2. `research/p5-planetology` at `978c807a628f61b0923d5f9a73dd80df850cdb41` contains useful causal and multiscale architecture: formation -> composition -> interior -> volatile -> atmosphere -> climate -> hydrosphere -> terrain, plus REFINE/PROJECT thinking. Preserve the architecture; reject its stylized volatile genesis, greenhouse increment, tectonic assignment and terrain as promotion-grade physical truth.
3. `research/p6-biology-v2-on-p5next` is stacked directly on the P5-next head and adds biology research rather than a stronger P5 authority. It does not change the WV-B P5 adjudication.
4. Frozen canonical `ofu-p5-p6-environment-v2` remains authoritative and deliberately uses `NO_CANONICAL_GENESIS`; P6 remains fail-closed. WV-B does not modify P5/P6 certified contracts or runtime surfaces.

## 2. Scientific architecture decision

The successor must be one causal state graph, not parallel random generators:

```text
formation + disk/system composition + accretion history
  -> bulk chemistry / core-mantle partitioning
  -> magma-ocean redox + differentiation
  -> interior thermal state + rheology
  -> volatile inventory by reservoir
  -> outgassing / sequestration / impact delivery-loss / escape
  -> atmospheric inventory + composition
  -> radiative state + transport + seasonality
  -> hydrosphere / cryosphere phase-reservoir constraints
  -> geodynamic regime probabilities / volcanic flux constraints
  -> weathering / erosion / sediment / crater degradation constraints
  -> global basins / relief commitments
  -> sparse regional/local geography
  -> ecological boundary-condition projection
```

No node may manufacture missing upstream authority. A downstream model may emit `UNKNOWN`, a bounded derived quantity, or a hypothetical research distribution; it may not silently convert uncertainty into a canonical fact.

## 3. Literature / provenance matrix

| Domain | Research basis | WV-B interpretation | Epistemic class |
| --- | --- | --- | --- |
| Rocky-planet volatile distribution during differentiation | Grewal et al., *Frontiers in Earth Science* (2023), DOI 10.3389/feart.2023.1159412 | H/C/N/S partitioning depends strongly on redox, P-T conditions and metal-silicate/magma-gas partitioning; no universal volatile prior | EMPIRICALLY_CONSTRAINED |
| Experimental H/C/N/S partitioning | Progress in Earth and Planetary Science (2024), DOI 10.1186/s40645-024-00629-8 | Core/mantle/atmosphere partition coefficients require condition-specific calibration and uncertainty | EMPIRICALLY_CONSTRAINED |
| Early atmosphere / core formation | *Earth and Planetary Science Letters* 629 (2024) 118618 | Core formation and magma-ocean redox can dominate retained volatile partitioning | EMPIRICALLY_CONSTRAINED |
| Pebble-accretion atmosphere + magma-ocean coupling | Johansen et al., *Astronomy & Astrophysics* (2024), article aa51114-24 | Envelope loss, crystallization and outgassing are coupled; water can remain interior while CO2 outgasses more readily | MODEL_CONSTRAINED |
| Primary-atmosphere loss and secondary retention | *Nature Communications* (2024), DOI 10.1038/s41467-024-52642-6 | Escape cannot be modeled independently from magma-ocean thermal/volatile partitioning | MODEL_CONSTRAINED |
| Rocky-atmosphere evolution review | rocky-atmosphere evolution review, 2026 | Atmospheres evolve by source flux, sequestration and escape; static composition is generally insufficient | REVIEW_SYNTHESIS |
| Atmospheric escape | Owen, *Annual Review of Earth and Planetary Sciences* (2019), DOI 10.1146/annurev-earth-053018-060246; Tian (2015) | Energy-limited escape is only a bounded approximation; detailed upper-atmosphere physics/chemistry are needed for authority | ESTABLISHED_MECHANISM / APPROXIMATE_KERNEL |
| Tectonic regime diversity | Weller/O'Neill lineage; *Geoscience Frontiers* review (2018) | Hot stagnant, episodic, mobile and cold stagnant regimes can occur; history matters | MODEL_CONSTRAINED |
| Thermal evolution with regime transitions | *Physics of the Earth and Planetary Interiors* (2020) | Nu-Ra scaling differs by regime; time lag between mantle state and surface heat flux matters | MODEL_CONSTRAINED |
| Multi-regime lid classification | *Nature Communications* / PMC (2025) "Dissecting the puzzle of tectonic lid regimes" | At least mobile, stagnant, sluggish, episodic and plutonic-squishy behaviors are plausible in modeled terrestrial interiors | MODEL_CONSTRAINED |
| Carbon from disk to habitable worlds | Bergin, Hirschmann & Izidoro, *Annual Review of Astronomy and Astrophysics* 64 (2026), DOI 10.1146/annurev-astro-043024-121518 | Formation environment and solids delivery must condition bulk carbon; composition is not an independent draw | REVIEW_SYNTHESIS |
| Seasonal/orbital climate forcing | terrestrial exoplanet GCM studies and eccentric-planet studies (2023+) | Obliquity/eccentricity/rotation alter climate transport and loss; global mean flux alone is insufficient for seasonality | EMPIRICALLY/MODEL_CONSTRAINED |
| Impact crater degradation | Grant & Schultz, JGR Planets (1993), DOI 10.1029/93JE00121; Oufella et al., *Earth and Space Science* (2026), DOI 10.1029/2025EA004634 | Crater morphology is overprinted by erosion/deposition; crater presence is not immutable topography | ESTABLISHED_PROCESS / CALIBRATION_NEEDED |
| Habitability boundary | Lineweaver & Chopra, *Annual Review of Earth and Planetary Sciences* 40 (2012), DOI 10.1146/annurev-earth-042711-105531 | Temperature/water are necessary but not sufficient for positive biosphere authority; WV-B additionally requires geochemical/nutrient state | REVIEW_SYNTHESIS |

This matrix is intentionally conservative. A literature citation establishes that a mechanism or parameterization has scientific precedent; it does not by itself authorize its universal use across all rocky planets.

## 4. Scientific assumption ledger

### ESTABLISHED / FORMAL

- mass/reservoir conservation after a source state exists;
- gravity-column pressure relation for a spherical global mean;
- radiative effective temperature as an equilibrium diagnostic under explicit albedo/emissivity assumptions;
- deterministic address identity and parent/child conservation algebra;
- energy conservation accounting within a declared reduced climate model.

### ESTABLISHED MECHANISM, APPROXIMATE IMPLEMENTATION

- XUV-driven atmospheric escape represented only as an energy-limited upper-bound witness;
- idealized latitudinal energy-balance transport;
- global pressure from total atmospheric mass;
- phase/capacity bounds once authoritative pressure/temperature/composition exist.

### EMPIRICALLY CONSTRAINED, REQUIRES CALIBRATION

- volatile metal/silicate partition coefficients;
- magma-ocean solubility and outgassing;
- mantle viscosity/rheology and heat-flow scalings;
- volcanic/outgassing fluxes;
- weathering and erosion coefficients;
- sediment transport laws;
- crater degradation rates;
- albedo/cloud feedbacks and longwave parameterizations;
- nutrient/redox fluxes.

### PLAUSIBLE / HYPOTHETICAL

- probability of tectonic regime for a generic exoplanet from sparse bulk inputs;
- impact history for an unobserved arbitrary planet;
- magnetic dynamo state from coarse thermal proxies;
- exact ocean/land fraction without topography and volatile-history authority;
- detailed mountain/basin geometry from limited upstream facts.

### NOT AUTHORIZED

- Earth plate tectonics as a default;
- oceans inferred from radiative effective temperature;
- current presentation terrain as physical elevation;
- a positive biosphere/habitability state derived only from temperature + water;
- atmospheric composition invented from mass/radius/orbit alone.

## 5. Versioned provider boundaries

Candidate research providers are deliberately separable so future promotion can accept some layers without accepting all layers:

- `PlanetFormationCompositionProvider/r1`: consumes P3/system formation context; emits distributions over refractory composition and initial volatile element inventory with provenance.
- `DifferentiationMagmaOceanProvider/r1`: consumes formation/composition + accretion/thermal boundary; emits core/mantle partition state, redox state and retained melt/solid volatile distributions.
- `InteriorThermalProvider/r1`: consumes composition, mass/radius, age and heat-source state; emits bounded heat-flow/rheology state plus uncertainty.
- `VolatileLedgerProvider/r1`: exact reservoir identity and conservation; preserves P5-next species/state semantics where compatible.
- `AtmosphereEvolutionProvider/r1`: applies outgassing, sequestration, impact and escape transitions; no transition without cause/provenance.
- `ClimateBoundaryProvider/r1`: separates radiative effective temperature from surface climate; reduced EBM outputs remain hypothetical until calibrated/validated.
- `GeodynamicsProvider/r1`: emits regime likelihood/evidence, never "plate tectonics=true" from a single proxy.
- `SurfaceProcessProvider/r1`: weathering/erosion/sediment/crater modification constraint producer.
- `SparseGeographyProvider/r1`: addressable global->regional->local refinement constrained by parent budgets; no full-planet materialization required.
- `EcologicalBoundaryProjection/r1`: fail-closed projection only; cannot authorize biology.

Every future provider must declare: model/version, source provenance, validity domain, excluded regimes, epistemic class, numerical contract, uncertainty representation, dependency set, and failure semantics.

## 6. Dependency DAG

```text
P3 star/system/orbit facts
          +
formation/disk composition evidence
          |
          v
[FormationComposition]
          |
          v
[Differentiation + Magma Ocean]
      |               |
      v               v
[InteriorThermal]  [Initial Volatile Ledger]
      |               |
      +-------> [Geodynamics/Volcanism]
                      |
                      v
                [Outgassing]
                      |
P3 XUV/history ------>+------>[Atmosphere Evolution]<--- impacts/sequestration
                              |
                              v
                        [Atmosphere State]
                              |
P3 orbit/rotation ----------->+------>[Climate/Seasonality]
                                      |
[Interior/Geodynamics]--------------->|
                                      v
                           [Hydrosphere/Cryosphere]
                                      |
                    [Surface Processes / Basins]
                                      |
                                      v
                            [Sparse Geography]
                                      |
                                      v
                         [Ecological Boundary]
```

Mutable arrows require P4 transition/replay authority before canonical use.

## 7. Implemented research prototype

`research/wave-v-planetology-frontier/frontier-research-v1.mjs` implements bounded, isolated research mechanisms only:

1. fixed-point radiative effective-temperature diagnostic; output is not surface temperature;
2. fixed-point global column pressure from atmospheric mass, radius and gravity;
3. energy-limited XUV escape **upper bound** with explicit efficiency parameter;
4. exact conserved volatile ledger across core/mantle/atmosphere/surface-condensed/lost reservoirs;
5. irreversible `lost` reservoir unless a separately versioned reaccretion model exists;
6. hydrosphere capacity bound that explicitly refuses to authorize an ocean;
7. deterministic addressable geography cells derived by SHA-256 addressing, with exact parent->child water-budget conservation and `physicalElevationAuthorized=false`;
8. a reduced latitude-coupled EBM for climate transport/sensitivity research; all output is `HYPOTHETICAL_MODEL_VALUE` and `surfaceTemperatureAuthorized=false`;
9. fail-closed P6 boundary witness.

The prototype intentionally does **not** yet implement a universal volatile-genesis prior, magma-ocean chemistry, geodynamic-regime classifier, magnetic dynamo, weathering/erosion solver, sediment network, crater-population generator, or nutrient/redox authority. Their boundaries are designed, but scientific calibration remains prerequisite.

## 8. Conservation and cross-scale constraints

### Volatiles

For every ledger state:

```text
initial_inventory = core + mantle + atmosphere + surface_condensed + lost
```

Every transfer is zero-sum across retained/lost reservoirs. Lost mass is terminal in this version.

### Hydrology/geography

A parent water budget is split deterministically among four addressed child cells. `PROJECT(children)` must reproduce the parent budget exactly. Relief/basin values are research basis functions, not meters and not physical elevation.

### Energy

The climate EBM exposes top-of-atmosphere residual rather than declaring convergence. A nonzero residual is evidence of transient/non-equilibrium reduced-model state, not silently discarded error.

## 9. Sensitivity and uncertainty witness

The deterministic fixture varies Bond albedo from 0.26 to 0.34 while holding other EBM parameters fixed. The modeled global mean temperature shifts from approximately 291.627 K to 278.516 K, with the nominal 0.30 case at approximately 285.071 K. This ~13.1 K spread is a parameter sensitivity witness, not a probabilistic confidence interval.

Uncertainty policy for successor work:

- epistemic uncertainty: distributions/ranges over poorly constrained model inputs;
- aleatory/statistical variability: distributions only where an empirical population or calibrated process supports them;
- model structural uncertainty: compare alternative physically defensible kernels rather than hide differences in a single scalar error bar;
- numerical error: tracked separately from scientific uncertainty;
- unsupported authority: represented as UNKNOWN/UNSUPPORTED, never as a wide invented distribution.

## 10. Independent oracles / deterministic corpus

Focused Node tests cover fixed-point laws, volatile conservation, invalid reverse loss, effective-vs-surface-temperature separation, hydrosphere non-authorization, geography query-order identity, parent/child budget reconciliation, climate sensitivity and fail-closed P6 status.

`tools/wave_v_planetology_frontier_oracle.py` independently evaluates:

- radiative temperature using `Fraction` + high-precision `Decimal`;
- pressure using rational arithmetic;
- escape upper bound using rational arithmetic;
- SHA-256 geography addressing and budget projection;
- the reduced EBM independently in Python.

The active deterministic witness is `tests/wave-v-planetology-frontier/golden-frontier-v1.json`.

Local isolated execution before repository freeze:

- Node focused suite: **PASS**;
- independent Python oracle: **PASS**.

These are research checks, not promotion-grade browser/OS/cross-runtime certification.

## 11. P4 transition plan for mutable planetary evolution

Future canonical mutable state must be event/reducer-driven under P4. Candidate transition classes:

- `IMPACT_DELIVERY` / `IMPACT_EROSION`;
- `MAGMA_OCEAN_PARTITION`;
- `VOLCANIC_OUTGASSING`;
- `MANTLE_SEQUESTRATION`;
- `ATMOSPHERIC_ESCAPE`;
- `CONDENSATION_EVAPORATION_TRANSFER`;
- `ICE_SEQUESTRATION_RELEASE`;
- `TECTONIC_REGIME_TRANSITION`;
- `MAJOR_RESURFACING`;
- `EROSION_SEDIMENT_REPARTITION`.

Each accepted event must carry event identity, P4 time/order, cause/model version, source/provenance, uncertainty/epistemic status, precondition digest, and conserved deltas. Checkpoint/compaction must be replay-equivalent. Research fixtures may supply transitions for conformance but are never historical evidence for canonical worlds.

## 12. Future canonical-promotion field map

### Potentially eligible after separate validation/promotion

- exact volatile reservoir ledger schema and conservation invariant;
- fixed-point global column pressure when atmospheric mass is authoritative;
- radiative effective temperature as an explicitly named diagnostic, never surface temperature;
- deterministic sparse geography address/refinement identity;
- parent/child conserved scalar budgets;
- P4-bound transition schemas;
- provider provenance/epistemic metadata;
- bounded physical-domain envelopes.

### Not eligible from this candidate

- generated initial volatile inventory or composition;
- magma-ocean redox/partition state for arbitrary planets;
- canonical atmospheric composition;
- canonical XUV/escape history;
- canonical mean/local surface temperature;
- ocean existence, area or depth;
- cryosphere extent;
- plate tectonics or any single tectonic regime as truth;
- volcanic fluxes;
- magnetic-field/dynamo truth;
- physical elevation/topography;
- mountain/basin/crater locations as canonical geography;
- erosion/weathering/sediment rates;
- geochemical energy or nutrient sufficiency;
- any positive P6 biosphere eligibility or biology-established claim.

## 13. Promotion-readiness vs implementation completeness

**Research implementation completeness:** materially advanced. The lane now has a versioned provider architecture, conservation kernel, climate/escape/geography prototypes, independent oracle, deterministic corpus, sensitivity witness and P4 transition plan while preserving prior P5-next work.

**Canonical promotion readiness:** BLOCKED. Required blockers include: exact Wave V base/ownership freeze; calibrated formation/composition priors; magma-ocean/differentiation parameterizations with uncertainty; authoritative XUV/stellar-history interface; regime-aware interior/tectonic model validation; radiative-convective/climate calibration; physical geography process calibration; P4 event/replay binding; promotion-grade deterministic numeric contract; cross-runtime certification; and independent science/adversarial review.

**Positive environment authority remains unjustified and therefore fails closed.**

## Verdict

`PLANETOLOGY FRONTIER ADVANCED — RESEARCH CANDIDATE READY FOR CONVERGENCE REVIEW; CANONICAL PROMOTION BLOCKED BY UNRESOLVED WAVE V BASE AND SCIENTIFIC AUTHORITY GAPS`
