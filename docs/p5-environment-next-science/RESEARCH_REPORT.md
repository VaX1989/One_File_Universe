# Advanced P5 Environment Next Science — Research Freeze v2

**Status:** RESEARCH / NON-CANONICAL  
**Research authority:** `P5_RESEARCH_DRAFT`  
**Prototype contract:** `ofu-p5-environment-next-research-v2`  
**Species-state contract:** `ofu-p5-volatile-species-state-research-v2`  
**Registry:** `ofu-p5-volatile-species-registry-research-v1`  
**Frozen upstream:** `ofu-p5-p6-environment-v2` remains unchanged and authoritative.  
**Research date:** 2026-09-04

## Live rebaseline and adjudication

The existing research branch was retained because its scientific question remains valid. Its pre-rebaseline tip was `96ce1894aa8107f0bdb6004feb91637a94da7d0d`; current live `main` was revalidated at `ddc31e9f15ae63293d2111782ba643df8524ab2f`. The research branch was brought forward without modifying `main`, Product v0.8 branches, or canonical P5.

Canonical Environment v2 still deliberately owns no generated volatile genesis (`NO_CANONICAL_GENESIS`), no mean surface-temperature/greenhouse authority, no canonical XUV/escape history, and no geology/geochemical-energy authority. Canonical P6 still consumes the frozen Environment-v2 boundary. Product work therefore does not invalidate this lane's dependency graph.

## Research question

**What is the smallest scientifically defensible environment state that unlocks multiple downstream composition, pressure, solvent, climate and escape questions while preserving deterministic/oracleable semantics and refusing to fabricate volatile genesis?**

The answer remains **source-bound species-resolved volatile state**, but the v1 prototype needed stronger identity and authority semantics before that answer was research-grade.

## Why this is the highest-leverage dependency

Rocky-planet atmosphere composition is history-dependent: formation, outgassing/interior exchange, irradiation, escape and sequestration are coupled. A deterministic random atmosphere or Earth-like default would therefore create reproducible fiction rather than scientific authority. Once a governed source supplies species-resolved reservoirs, however, the same state can support pressure, composition, solvent, later radiative/climate research and eventually species-dependent escape without forcing any downstream model into the state producer.

Research v2 therefore advances the **state contract and identity layer**, not the number of derived outputs.

## Authority model

All prototype output remains `P5_RESEARCH_DRAFT` and non-canonical. Species-state records carry explicit `epistemicStatus`, `origin` and provenance.

Allowed origin classes:

- `AUTHORITATIVE_EXTERNAL_STATE` — required for research records marked `KNOWN`;
- `MODEL_HYPOTHESIS` — produces `HYPOTHETICAL_MODEL_VALUE` state;
- `RESEARCH_FIXTURE` — test/research-only state and also `HYPOTHETICAL_MODEL_VALUE`.

Derived gas/water results propagate that distinction. Exact algebra over hypothetical inputs remains `HYPOTHETICAL_MODEL_VALUE`; `DERIVED` is reserved for diagnostics whose required source states are `KNOWN` under the research contract.

This does not define who may create future canonical state. That remains a promotion blocker.

## Bounded species registry

Research v2 introduces a fixed 12-species registry for deterministic identity/reference-mass bookkeeping:

`Ar`, `CH4`, `CO`, `CO2`, `H2`, `H2O`, `H2S`, `He`, `N2`, `NH3`, `O2`, `SO2`.

The profile records NIST Chemistry WebBook SRD 69 reference molecular weights and CAS identifiers, with CIAAW atomic-weight guidance as a governance reminder that natural isotopic composition can vary. These numbers are therefore **reference molecular weights**, not exact isotopologue masses, abundance priors, formation priors or occurrence claims.

Caller-supplied molar masses are rejected. Unknown species are rejected rather than guessed. Species must be strictly sorted by identifier, preventing equivalent compositions from acquiring different output ordering solely from payload order.

## Implemented semantics

### Species-resolved reservoirs

For every registered species:

`total = atmosphere + condensed_surface + subsurface_interior + lost`.

All masses are non-negative u64 teragrams. Aggregate arithmetic is overflow-checked. `COMPLETE` requires zero unresolved mass. `PARTIAL` requires a non-zero explicit unresolved reservoir, preventing omitted composition from silently becoming known zero.

No genesis distribution or mass/radius-conditioned abundance law is implemented.

### Pressure and gas composition

Global mean column pressure retains the frozen Environment-v2 spherical law:

`p = M_atm * g / (4*pi*R^2)`

with `pi=355/113`, integer inputs and nearest-ties-to-even pascals.

Mole fractions and partial pressures are computed from exact rational amount ratios using registry reference molecular weights only when composition is complete and the caller explicitly selects `IDEAL_WELL_MIXED_DALTON`. This remains an approximation with a declared validity domain, not a universal high-pressure/non-ideal atmosphere model.

### Water saturation

The existing fixed-point IAPWS-IF97 Region 4 relation remains bounded to `273.160 K .. 647.096 K`. It is a pure-water vapor-liquid **saturation tendency** diagnostic. It does not establish ocean presence, ocean coverage, rainfall, ice, a regional phase map or biological solvent availability.

Research v2 removes an authority ambiguity: water-saturation assessment no longer accepts a bare surface-temperature scalar. It requires an explicit surface-temperature state object carrying value, epistemic status, authority and provenance. Hypothetical temperature keeps the diagnostic hypothetical; no temperature state keeps it unknown.

### Explicitly unsupported

Mean surface temperature/greenhouse response, regional climate/weather, physical ocean area/elevation, sub-triple/deep-water phase behavior, canonical stellar XUV/escape history, tectonics, heat flow, geochemical energy/nutrients and gas-giant semantics remain unsupported.

## Determinism and working set

The output path remains integer/fixed/rational only. Species count is bounded by the 12-entry registry. Queries are pure and per-planet; there is no mutable query state, private clock, global planet enumeration, retained climate grid, renderer-derived authority or persistent research history. Pressure and IAPWS evaluation are O(1); gas composition is O(S), `S <= 12`.

A descriptive local run of 50,000 paired pressure + saturation evaluations completed in about 201 ms (~4.02 microseconds per paired iteration) with ~211 kB transient heap delta, zero retained planet records, zero climate-grid cells and zero persistent history entries. These are research observations, not normative SLOs.

## Oracles and tests

Active Golden witness: `tests/p5-environment-next-science/golden-research-v2.json`.

The Node suite checks registry identity/reference values, canonical species ordering, conservation, fail-closed unknown/legacy payloads, origin/epistemic constraints, complete/partial composition, pressure vectors, gas-composition vectors, water epistemic propagation, IAPWS anchors, raw-temperature rejection and continued unsupported status for surface climate/XUV/geochemistry.

The independent Python oracle uses Python `Fraction` and high-precision `Decimal`; it owns a separate frozen reference-mass table and directly evaluates pressure, gas and IAPWS algebra against Golden v2 rather than importing JavaScript implementation code.

Local research freeze results:

- Node research suite — PASS;
- independent Python oracle — PASS;
- bounded 50,000-iteration benchmark — PASS with no retained planet/grid/history state.

Promotion-grade browser/OS equality is intentionally not claimed.

## Established versus hypothetical

| Surface | Research classification | Claim limit |
| --- | --- | --- |
| Registry identity/reference molecular weights | `ESTABLISHED / REFERENCE_DATA` | deterministic reference values only; not isotopologue-exact or abundance priors |
| Reservoir conservation/schema | `ESTABLISHED / FORMAL` | bookkeeping after a source exists; no genesis claim |
| Global column pressure | `ESTABLISHED / APPROXIMATE` | global spherical column weight, not weather/local pressure |
| Ideal-gas mole fractions / partial pressures | `ESTABLISHED / APPROXIMATE` | complete well-mixed ideal-gas state under explicit law |
| IAPWS Region 4 saturation relation | `ESTABLISHED / APPROXIMATE` in mixed-gas use | saturation tendency only in bounded temperature domain |
| Volatile genesis / arbitrary planet abundances | `HYPOTHETICAL / NOT ESTABLISHED` | not implemented |
| Mean surface temperature / greenhouse | `EMPIRICALLY_CONSTRAINED / UNSUPPORTED` | not implemented |
| Canonical XUV history / escape | `EMPIRICALLY_CONSTRAINED / UNSUPPORTED` | not implemented |
| Tectonics / geochemical energy | `EMPIRICALLY_CONSTRAINED / UNSUPPORTED` | not implemented |

## Remaining blockers to canonical promotion

1. **No canonical volatile-species state producer or governed import/state-origin policy.** This remains the primary blocker.
2. The bounded species registry is a research reference profile, not yet a canonical P2-manifest-bound registry contract with frozen source/update policy.
3. No authoritative P5 mean surface-temperature state/model exists, so saturation cannot become a current canonical planet claim and climate remains blocked.
4. Mutable atmosphere/reservoir evolution would need P4-owned event/time/history semantics with replay, checkpointing, compaction equivalence and lineage.
5. Promotion evidence is incomplete: full-domain fixed-point IF97 error bounds, larger independent randomized/metamorphic vectors, browser/OS cross-runtime identity where required, bounded-working-set certification, save/version migration and adversarial review.
6. P6 must separately version and re-adjudicate eligibility against any future richer Environment contract.

## P6 implications

**No canonical P6 behavior changes.** Current canonical planets remain `INSUFFICIENT_ENVIRONMENT`; this research does not establish `canGenerateBiosphere` or `biologyEstablished`. Even a future species-resolved atmosphere must not automatically unlock biology. P6 needs its own evidence threshold and versioned adapter/eligibility transaction.

## Research conclusion

The highest-leverage frontier is not “more atmosphere outputs.” It is a trustworthy, bounded, source-bound **volatile identity and state contract** that can be consumed by many later models without pretending to know where the atmosphere came from. Research v2 materially improves that foundation while preserving the scientific unknowns that canonical Environment v2 correctly exposes.

**PROMOTION REQUESTED = NO**
