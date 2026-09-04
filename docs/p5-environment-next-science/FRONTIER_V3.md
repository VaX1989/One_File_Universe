# P5 Environment Next — Frontier v3 Research Checkpoint

Status: **RESEARCH / NON-CANONICAL / NO PROMOTION REQUEST**  
Authority: `P5_RESEARCH_DRAFT`  
Base research contract: `ofu-p5-environment-next-research-v2`  
Frontier contract: `ofu-p5-environment-next-frontier-research-v3`

## Live dependency DAG

The live architecture was re-adjudicated against canonical Environment v2 and the existing Environment-next v2 research rather than inferred from product presentation.

Highest-leverage path:

1. **Canonical P5 physical state + P3 insolation** — already established upstream.
2. **Source-bound species-resolved volatile state** — Environment-next v2 research foundation; no generated volatile genesis.
3. **Bounded volatile state-transition witnesses** — added here. These express externally supplied repartition/loss facts or hypotheses without supplying rates, causes, or occurrence priors.
4. **Atmospheric mass -> global column pressure** — established approximate spherical column law already shared with canonical Environment v2.
5. **Complete species composition + explicit `IDEAL_WELL_MIXED_DALTON` assumption -> mixture diagnostics** — bounded approximate gas bookkeeping.
6. **Surface-temperature state + water partial pressure -> water saturation tendency** — only when temperature is separately supplied with explicit epistemic authority; no effective-temperature substitution.
7. **P5 -> P6 readiness witness** — formal fail-closed interface that enumerates missing biological prerequisites and never authorizes abiogenesis.

Independent blocked branches remain:

- surface temperature / greenhouse: no promoted opacity, transport, cloud/albedo, or heat-redistribution model;
- XUV/escape: needs stellar rotation/XUV history, upper-atmosphere composition, absorption-radius and heating-efficiency laws, and accepted P4 history;
- geology/geochemistry: needs tectonic/thermal/redox/fluid-rock/nutrient state;
- ocean coverage/regional climate: needs physical hypsometry and regional climate authority.

Canonical P5 already owns a radiative-effective-temperature Tier 0 relation. Frontier v3 deliberately does not duplicate it and never equates effective temperature with surface temperature.

## New research block: volatile transfer kernel

A transfer record contains explicit authority, epistemic status, origin, provenance, species identity, source and destination reservoirs, mass, process class, and dependency list.

Supported process classes are deliberately narrow:

- `INTERNAL_REPARTITION_WITNESS`: mass moves only among atmosphere, condensed-surface, and subsurface/interior reservoirs;
- `LOSS_TO_LOST_RESERVOIR_WITNESS`: mass moves from a retained reservoir to `lostTg`.

`lostTg` is terminal in this contract. Reaccretion or external delivery would require a separately versioned external-input model. A transfer may not create an absent species or new volatile mass. Zero-mass events reject. Source underflow and destination overflow reject.

### Scientific classification

The transition algebra is `ESTABLISHED / FORMAL`: it is conservation bookkeeping after an external transition witness exists. The witness itself inherits its source epistemic class. The kernel does **not** establish condensation rates, outgassing rates, sequestration rates, escape rates, volatile genesis, or planetary occurrence.

## Boundedness and determinism

- maximum registry state remains 12 species;
- maximum transfer sequence per pure query is 4096 steps;
- each transfer is O(1) over the bounded species registry;
- no private clock exists;
- no mutable planet-history log is retained;
- retained research history entries: 0;
- future persistent transition history remains P4-owned.

All arithmetic is integer/rational with nearest-ties-to-even where rounding is required. No camera, GPU, browser timing, or runtime randomness participates.

## Mixture summary

For complete species composition under the explicit ideal-well-mixed assumption, Frontier v3 adds a deterministic global mixture summary:

- global column pressure;
- component count;
- mixture mean reference molar mass derived from exact rational species amounts.

The output is `ESTABLISHED / FORMAL` as bookkeeping over supplied state, with the atmospheric mixing assumption itself retaining the existing `ESTABLISHED / APPROXIMATE` validity boundary. Partial composition or an unsupported mixing assumption returns `UNKNOWN` rather than guessing.

## P5 -> P6 readiness witness

`ofu-p5-p6-environment-readiness-research-v1` explicitly separates fields that a future positive Biology eligibility review would need from context that is useful but not by itself sufficient.

Mandatory before a future positive eligibility adjudication:

- canonical volatile-state producer;
- accepted P4 history where mutable environment is claimed;
- complete volatile composition for composition-dependent biology claims;
- authoritative surface-temperature state for the claimed validity domain;
- viable biological medium state;
- usable phototrophic and/or chemotrophic energy state;
- nutrient/redox validity state where required;
- separately adjudicated abiogenesis authority or explicit post-genesis research-fixture authority.

Useful optional context that is not itself an eligibility trigger:

- XUV/escape history;
- geological activity;
- ocean coverage;
- regional climate.

Current research witnesses always return `INSUFFICIENT_ENVIRONMENT`, `canAuthorizeBiology=false`, `canonicalGenesisAvailable=false`, and `ABSTAIN_FAIL_CLOSED`. Even a fully supplied research temperature fixture cannot remove the unsupported energy/nutrient/genesis dependencies.

## Deterministic evidence

Golden vector: `tests/p5-environment-next-science/golden-frontier-v3.json`.

Focused Node test: `tests/p5-environment-next-science/run-frontier-v3-tests.mjs`.

Independent Python oracle: `tools/p5_environment_frontier_v3_oracle.py`, independently structured with Python `Fraction` and its own H2O/N2 reference-mass table.

Reference vector results:

- initial 10,000,000 Tg atmosphere at the test gravity/radius: 192 Pa;
- explicit 250,000 Tg H2O atmosphere -> condensed-surface transfer: 9,750,000 Tg atmosphere, 187 Pa;
- subsequent explicit 50,000 Tg H2O atmosphere -> lost transfer: 9,700,000 Tg atmosphere, 186 Pa;
- mixture reference mean molar mass changes deterministically as H2O leaves the atmosphere.

The independent oracle passes these vectors locally. Promotion-grade browser/OS certification is intentionally not claimed for this research checkpoint.

## Promotion readiness

| Block | Readiness | Scientific reason |
| --- | --- | --- |
| species registry / source-bound volatile state v2 | `ORACLE_READY` | deterministic and bounded, but no canonical state producer/source-governance policy |
| global column pressure | `ORACLE_READY` | mature algebra; source atmosphere is still research state |
| ideal-mixture composition / partial pressure | `ORACLE_READY` | complete-state and validity-assumption gated |
| volatile transfer kernel | `ORACLE_READY` | formal conservation semantics; no physical rate law claimed |
| mixture summary | `ORACLE_READY` | deterministic supplied-state diagnostic |
| water saturation tendency | `ORACLE_READY` | bounded diagnostic; surface-temperature authority remains absent canonically |
| P5 -> P6 readiness witness | `IMPLEMENTATION_READY` | interface is explicit and fail-closed; no positive P6 path exists |
| surface temperature / greenhouse | `RESEARCH_ONLY` | scientifically underdetermined by current upstream state |
| XUV/escape | `RESEARCH_ONLY` | causal stellar/upper-atmosphere/history inputs missing |
| geology/geochemical energy | `RESEARCH_ONLY` | causal tectonic/redox/flux/nutrient inputs missing |

**CANONICAL PROMOTION PERFORMED = NO**
