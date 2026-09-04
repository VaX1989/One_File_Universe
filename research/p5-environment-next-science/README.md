# P5 Environment Next Science Research

Status: **RESEARCH / NON-CANONICAL**.  
Authority: `P5_RESEARCH_DRAFT`.  
Prototype: `ofu-p5-environment-next-research-v2`.  
Frozen canonical upstream: `ofu-p5-p6-environment-v2`.

This lane asks: **what is the smallest scientifically defensible environment state that can unlock composition, pressure, solvent and later climate/escape research without inventing volatile genesis?**

Research v2 keeps the answer source-driven. It does not generate an atmosphere. It hardens the species-resolved volatile-state seam needed before richer environment science can be truthful.

## Research v2 semantics

- bounded reference registry: `ofu-p5-volatile-species-registry-research-v1`, 12 common volatile/gas species;
- reference molecular weights are registry-owned, not caller-supplied, and are explicitly not exact isotopologue masses or abundance priors;
- volatile state is exact per-species reservoir bookkeeping in teragrams with `COMPLETE` / `PARTIAL` composition and an explicit unresolved reservoir;
- every state has an origin class, source ID, source revision, provenance and epistemic status;
- `KNOWN` requires `AUTHORITATIVE_EXTERNAL_STATE`; model/fixture states remain `HYPOTHETICAL_MODEL_VALUE` through derived gas and water diagnostics;
- species are strictly canonicalized by registry identifier; unregistered, duplicate, unsorted and extra-field payloads fail closed;
- global mean column pressure remains the Environment-v2 deterministic spherical law;
- complete gas composition may derive mole fractions and partial pressures only under the explicit `IDEAL_WELL_MIXED_DALTON` assumption;
- IAPWS-IF97 Region 4 remains a bounded water vapor-liquid saturation tendency, not an ocean or climate model;
- saturation requires an explicit surface-temperature state object with authority/provenance; a raw temperature scalar is rejected;
- surface temperature/greenhouse, canonical XUV/escape, geology and geochemical energy remain `UNSUPPORTED`.

No P5 clock, private RNG, global enumeration, climate grid, renderer-derived truth or canonical state is introduced.

## Research evidence

```sh
node tests/p5-environment-next-science/run-research-tests.mjs
python3 tools/p5_environment_next_oracle.py tests/p5-environment-next-science/golden-research-v2.json
node tests/p5-environment-next-science/benchmark-research.mjs
```

The Golden v1 file is retained as historical evidence. Golden v2 is the active research witness.

## Promotion boundary

This branch is not an Environment v3 proposal for immediate merge. OFU still has no canonical producer for species-resolved volatile state. A future promotion transaction would separately need P2 manifest/versioning, a governed registry policy, P4 transition/replay semantics for mutable reservoirs, promotion-grade cross-runtime certification, save/version migration, and P6 eligibility re-adjudication.

**PROMOTION REQUESTED = NO**
