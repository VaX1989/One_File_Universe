# Advanced P5 Environment Next Science — Research Report

**Status:** RESEARCH / NON-CANONICAL  
**Research authority:** `P5_RESEARCH_DRAFT`  
**Prototype contract:** `ofu-p5-environment-next-research-v1`  
**Frozen upstream:** `ofu-p5-p6-environment-v2` remains unchanged and authoritative.  
**Research date:** 2026-09-03

## Decision

The next useful scientific step is **not** a generated Earth-like atmosphere, a greenhouse-corrected surface temperature, an age-only XUV escape history, or a geology/habitability score. The smallest defensible frontier is a composition-aware volatile state that remains source-driven: exact species-resolved reservoir bookkeeping, explicit unresolved composition, and derived gas/solvent diagnostics only when their causal inputs are established. The prototype proves deterministic laws for that frontier. Current canonical planets must remain `INSUFFICIENT_ENVIRONMENT`: Environment v2 still has no canonical volatile-state producer and no authoritative surface-temperature model.

## Literature map and scientific adjudication

### Thermal state

- Del Genio et al. (2019), *Albedos, Equilibrium Temperatures, and Surface Temperatures of Habitable Planets*, ApJ 884:75, DOI `10.3847/1538-4357/ab3be8`.
- Wordsworth & Kreidberg (2022), *Atmospheres of Rocky Exoplanets*, ARA&A 60:159–201, DOI `10.1146/annurev-astro-052920-125632`.

Nominal radiative/equilibrium temperature is not a surface-temperature authority. Albedo, atmospheric greenhouse behavior, composition, rotation/transport and other non-current inputs create substantial degeneracy. A fixed offset/factor is rejected. A grey greenhouse or 1-D radiative-convective model may be useful future research, but neither is a minimal defensible promotion from current inputs.

**Current result:** surface temperature and greenhouse response remain `UNSUPPORTED`. Evidence class for the physical problem: `EMPIRICALLY_CONSTRAINED`; any compact grey model would be `APPROXIMATE`.

### Atmosphere / volatiles

- Steinmeyer et al. (2026), *Evolution and Observable Properties of Rocky Planet Atmospheres*, Space Sci. Rev. 222:56, DOI `10.1007/s11214-026-01308-4`.
- Tomberg & Johansen (2024), *Evolution of gas envelopes and outgassed atmospheres of rocky planets that formed via pebble accretion*, A&A 691:A183, DOI `10.1051/0004-6361/202451114`.

Rocky atmosphere composition is coupled to formation, interior exchange/outgassing, irradiation and escape. A universal generated volatile inventory or Earth-like composition is therefore rejected. What is mature is the state algebra **after** a governed source exists.

Prototype state is species-resolved, exactly conserved and provenance-bearing. `PARTIAL` composition carries an explicit unresolved reservoir so an omitted species cannot silently become a known zero. `COMPLETE` requires unresolved mass to be zero.

**Evidence:** bookkeeping `ESTABLISHED / FORMAL`; a generated universal volatile genesis remains `HYPOTHETICAL / STYLIZED` and is not implemented.

### Solvent / water phase

- IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997, including Region 4 vapor-liquid saturation curve.

The prototype implements IAPWS-IF97 Region 4 deterministically over the deliberately bounded `273.160 K .. 647.096 K` vapor-liquid research domain. Total atmospheric pressure is not H2O partial pressure in a mixture, so saturation assessment requires complete composition, explicit molar masses, an explicit `IDEAL_WELL_MIXED_DALTON` law profile and an authoritative surface temperature.

The result is only a **saturation tendency**. It does not establish oceans, ocean coverage, rain, ice, deep-water phases, or a biological solvent. Below the triple-point research bound the current prototype returns `UNSUPPORTED`; above the critical temperature it explicitly states that no pure-water liquid-vapor boundary exists.

**Evidence:** pure-water saturation relation `ESTABLISHED`; mixed-atmosphere use `APPROXIMATE` under declared ideal-gas/well-mixed assumptions.

### XUV / escape

- Tu et al. (2015), *The extreme ultraviolet and X-ray Sun in Time*, A&A 577:L3, DOI `10.1051/0004-6361/201526146`.
- Owen (2019), *Atmospheric Escape and the Evolution of Close-In Exoplanets*, ARA&E 47:67–90, DOI `10.1146/annurev-earth-053018-060246`.
- Salz et al. (2016), *Energy-limited escape revised*, A&A 585:L2, DOI `10.1051/0004-6361/201527042`.

Young-star high-energy histories depend strongly on rotational evolution; a unique age-only law is rejected. Energy-limited escape also depends on heating efficiency, absorption/expansion radius and physical regime. The prototype therefore requires stellar rotation history, XUV history, upper-atmosphere composition, absorption-radius law, heating-efficiency law and P4-accepted history before even considering a future transition, and still marks a generic energy-limited result as diagnostic rather than universal authority.

**Current result:** XUV evolution and escape remain `UNSUPPORTED`, evidence `EMPIRICALLY_CONSTRAINED / APPROXIMATE`.

### Geology / geochemical energy

- Baumeister et al. (2025), *Fundamentals of Interior Modelling and Challenges in the Interpretation of Observed Rocky Exoplanets*, Space Sci. Rev. 221:123, DOI `10.1007/s11214-025-01248-5`.
- *Exo-Geoscience Perspectives Beyond Habitability* (2026), Space Sci. Rev., DOI `10.1007/s11214-026-01265-y`.

Mass-radius observations are compositionally/interior-degenerate, and tectonic predictions depend on additional interior properties and thermal/rheological assumptions. Current P5 bulk inputs do not justify a tectonic flag, heat-flow index, nutrient index or chemotrophic-energy budget.

**Current result:** geology and geochemical energy remain `UNSUPPORTED`.

## Alternatives evaluated

| Domain | Alternative | Verdict | Reason |
| --- | --- | --- | --- |
| Thermal | fixed `T_eff -> T_surface` offset/factor | REJECTED | hides greenhouse/albedo/transport assumptions |
| Thermal | grey greenhouse | RESEARCH ONLY | optical depth/composition not established upstream |
| Thermal | 1-D radiative-convective column | DEFERRED | stronger science, too many missing causal inputs for minimal successor |
| Volatiles | Earth-like generated composition | REJECTED | hidden Earth default |
| Volatiles | mass/radius-conditioned random inventory | REJECTED | deterministic does not make genesis scientifically valid |
| Volatiles | source-driven species-resolved reservoirs | RETAINED | formal conservation and provenance, no genesis overclaim |
| Water | use `T_eff` as surface temperature | REJECTED | wrong authority and physics |
| Water | infer ocean coverage from stylized terrain | REJECTED | rendering/topology is not physical elevation |
| Water | IAPWS saturation tendency with authoritative inputs | RETAINED | established bounded physical relation |
| XUV | universal age-only XUV decay | REJECTED | rotational-history dependence |
| Escape | fixed-efficiency energy-limited rate | REJECTED | efficiency/radius/regime are not universal |
| Geology | mass-based plate-tectonics flag | REJECTED | interior/geodynamic degeneracy |
| Geochemistry | synthetic chemotrophic-energy score | REJECTED | no causal redox/fluid-rock/nutrient inputs |

## Prototype architecture

The research library is pure and per-planet. It creates no P5 clock, event log, universe identity, RNG tree, global enumeration or renderer-derived truth.

### Species-resolved volatile state

`ofu-p5-volatile-species-state-research-v1` permits at most 32 named components. Each carries:

- `speciesId`;
- explicit `molarMassNanoKgPerMol` input with provenance expected from a future bounded registry;
- `atmosphereTg`;
- `condensedSurfaceTg`;
- `subsurfaceInteriorTg`;
- `lostTg`;
- exact `totalTg`.

For every component:

`total = atmosphere + condensed_surface + subsurface_interior + lost`.

`COMPLETE` versus `PARTIAL` composition and the unresolved reservoir preserve epistemic honesty.

### Pressure and gas composition

Global column pressure retains the Environment-v2 spherical law:

`p = M_atm * g / (4*pi*R^2)`

with `pi=355/113`, integer inputs and nearest-ties-to-even output Pa. Gas mole fractions and partial pressures are derived with exact rationals only for complete composition under the named ideal well-mixed law.

### Water saturation

IAPWS-IF97 Region 4 is evaluated in Q1e14 fixed point. Published decimal coefficients are frozen as exact scaled integers; square root uses integer arithmetic; irreversible reductions use nearest ties-to-even. Output is integer Pa.

### Unsupported families retained explicitly

Surface temperature, greenhouse forcing, regional climate/weather, ocean area/physical elevation, sub-triple and deep high-pressure water phase, endogenous XUV/escape, tectonic regime, heat flux, geochemical energy and nutrient availability remain unsupported.

## Deterministic semantics

- integer/fixed/rational only in the prototype output path;
- mass: teragrams (`10^9 kg`), non-negative u64;
- gravity: integer micro-m/s^2;
- radius: integer m;
- temperature: integer mK;
- pressure: integer Pa;
- gas fraction: integer ppm;
- molar mass: integer nanokg/mol;
- rounding: nearest ties-to-even;
- species count: `<=32`;
- duplicate species IDs reject;
- no mutable query state, so query order cannot alter results.

## Oracle / Golden evidence

Golden corpus: `tests/p5-environment-next-science/golden-research-v1.json`.

The JavaScript implementation and independent Python `Decimal`/`Fraction` oracle agree on all frozen pressure, gas-composition and saturation vectors. IAPWS anchors include:

- `273.160 K -> 612 Pa`;
- `300.000 K -> 3537 Pa`;
- `373.150 K -> 101418 Pa`;
- `500.000 K -> 2638898 Pa`;
- `647.096 K -> 22064000 Pa`.

The Python oracle evaluates the algebraic IF97 relation directly rather than reproducing the JavaScript Q1e14 implementation.

## Working set / performance

Complexity is `O(S)` per queried planet, with `S <= 32` species; IAPWS evaluation is `O(1)`. No climate grid, planet enumeration, retained regional cache or persistent history is required.

A local research run of 50,000 paired saturation + pressure evaluations reported about `206.5 ms` total (`~4.13 us` per paired iteration), `~198 kB` transient heap delta, `0` retained planet records, `0` climate grid cells and `0` history entries. These are descriptive research numbers, not normative SLOs.

## Promotion-readiness answer

### Is a small subset scientifically mature enough to become a future Environment v3 candidate?

**YES as a candidate specification, CONDITIONALLY; NO as a promotion request today.**

The mature law/schema subset is:

1. species-resolved conserved volatile reservoirs with `COMPLETE/PARTIAL` composition and explicit unresolved mass;
2. total column pressure derived from the resulting atmospheric mass;
3. optional ideal-well-mixed mole/partial-pressure derivation under a named validity law;
4. optional IAPWS H2O vapor-liquid saturation tendency when authoritative P5 surface temperature and complete H2O gas composition exist.

Current canonical upstream has no scientifically justified producer for the species-resolved volatile state and no surface-temperature authority. Promoting only the empty schema would add interface surface without adding environmental truth.

### Required upstream inputs before an actual v3 promotion candidate

- a P5/P4-governed genesis/transition/import source for species-resolved volatile reservoir masses;
- a versioned chemical-species/molar-mass registry with provenance;
- for water saturation: a separately promoted P5 surface-temperature state/model with explicit uncertainty/domain;
- for mutable reservoirs: P4-accepted event/time/history with replay/checkpoint/compaction equivalence.

### Fields remaining unknown/unsupported in the first candidate

Generated volatile inventory without a producer; surface temperature without a climate model; greenhouse response; regional climate/weather; ocean fraction/elevation; sub-triple/deep-water phases; XUV history/escape; geology/tectonics; geochemical energy/nutrients.

## Effect on P6

Current canonical P6 remains exactly `INSUFFICIENT_ENVIRONMENT`, `canGenerateBiosphere=false`, `biologyEstablished=false`. This research branch creates no canonical life. Even a future species-resolved atmosphere slice must not automatically unlock biology; P6 must version and re-adjudicate its own eligibility policy against real P5 evidence.

## MATERIAL BLOCKERS

1. No canonical volatile-species genesis/state producer.
2. No authoritative P5 surface-temperature model/state.
3. No canonical stellar rotation/XUV history plus upper-atmosphere state for escape.
4. No defensible geodynamic/redox/fluid-rock/nutrient upstream state for geochemical energy.
5. Cross-runtime browser conformance and full fixed-point IF97 error sweep are not yet promotion evidence; current evidence is local Node + independent Python only.

## IMPORTANT NON-BLOCKERS

- Extend water physics below the triple point and into high-pressure phases only if future P6 requirements justify it.
- Evaluate non-ideal gas/fugacity treatment before high-pressure composition use.
- Replace free molar-mass payloads with a bounded canonical species registry before promotion.
- Add full-domain fixed-point error bounds and randomized independent metamorphic vectors.

## Integration-owner handoff

Do **not** merge this research branch as a P5 successor. A future promotion request should supply an exact upstream source for species-resolved state, new P2 manifest lineage/contract IDs, exact-head Node + independent oracle + Golden evidence, browser cross-runtime equality, P4 replay/checkpoint/compaction evidence for mutable state, P6 negative/positive eligibility review, bounded working-set proof, save/versioning strategy and adversarial review with `MATERIAL BLOCKERS = 0`.
