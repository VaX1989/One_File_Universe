# Environment v3 Promotion Gap

This is a research handoff, not a promotion request.

## Smallest plausible future delta

A future `ofu-p5-p6-environment-v3` should be **additive** over frozen v2. The first plausible delta is species-resolved volatile state plus derived composition diagnostics, not a climate or geology package.

Candidate additions once upstream authority exists:

- `volatileSpeciesState` with exact per-species atmosphere / condensed-surface / subsurface-interior / lost masses;
- `compositionCompleteness` plus an explicit unresolved reservoir;
- `gasComposition` under a named, bounded mixing law;
- optional `waterVaporSaturation` under an IAPWS law when surface temperature and H2O partial-pressure prerequisites are actually known.

No change to frozen v2 semantics or identity is implied. A v3 projection must retain the full v2 witness or bind its exact source digest.

## Required promotion evidence

- P2 manifest lineage and new contract IDs;
- canonical state-origin policy for volatile species;
- P4 transition descriptor if mutable;
- independent oracle and Golden digest;
- full-temperature-domain error analysis for fixed-point IF97;
- Chromium / Firefox / WebKit / Windows / macOS cross-runtime byte equality where OFU certification policy requires it;
- P6 adapter versioning and negative eligibility regression on current real planets;
- save/version migration decision;
- no renderer-derived inputs;
- exact-head and exact-main certification by the integration owner.

Until the state-origin blocker is closed, verdict is **CANDIDATE NOT READY** despite the maturity of several underlying deterministic laws.
