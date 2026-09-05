# WV-A Compatibility Map Against P3 v1

Status: `RESEARCH_ONLY`; no canonical mutation.

## Frozen P3 authority preserved

The current P3 v1 contract is `schema=1`, `model=p3-astronomy-1`, generator suite `p3-universe-skeleton` v1, baseline epoch `P4_T0`. WV-A does not edit or reinterpret that lineage.

| P3 v1 surface | WV-A treatment |
|---|---|
| RegionFacts | untouched; future successor environment model must use a new namespace/version |
| GalaxyFacts | untouched; successor may add richer latent structure but cannot silently alter P3 facts |
| SectorFacts | untouched; P3 computational partition remains historical contract |
| SystemFacts | untouched; successor birth context is additional research state, not replacement |
| StarFacts | untouched; future detailed evolution must be separately versioned and P4-compatible |
| PlanetFacts | untouched; WV-A does not reroll planets or claim detailed composition |
| MoonFacts | untouched |
| `ofu-p3-p5-planetary-input-v1` | untouched; any successor downstream contract requires a new contract ID |
| P3 semantic manifest/hash | untouched |
| P3 Golden corpus | must remain byte/digest stable |

## Candidate successor-only fields

The following are research candidates that P3 v1 does not own at this fidelity:

- galaxy component mixture / structural priors;
- local age and metallicity population distributions;
- explicit selection-function separation;
- primary-mass-conditioned joint multiplicity research;
- versioned stellar-evolution adapter boundary;
- protoplanetary birth-context priors and uncertainty.

## Future convergence transaction

When Prompt 0 publishes the exact Wave V base and ownership manifest:

1. rebase/recreate the authorized WV-A branch from exactly `WAVE_V_PARALLEL_BASE_SHA/TREE`;
2. prove P3 v1 source and Golden corpus are unchanged;
3. move only ownership-authorized successor code from `research/` into a new astronomy provider namespace;
4. replace the standalone research entropy shim with exact P2 `derive`/Address semantics;
5. define a new explicit schema/model/generator manifest and new namespaces;
6. define an additive adapter from P3 identity/baseline relationships to successor context without changing P3 outcomes;
7. run P2-P6 regressions plus successor deterministic/statistical/cross-runtime tests;
8. submit promotion readiness separately from implementation completeness.

No step authorizes canonical promotion from this research branch.
