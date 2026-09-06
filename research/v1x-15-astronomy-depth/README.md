# V1X-15 Astronomy / Cosmic Depth Research Checkpoint

Authority: **RESEARCH_ONLY**. Base `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19`, tree `3324e6354b5ff1b90156d1693e6051595b6f1219`, contract set `OFU-V1X-CONTRACT-SET-2026-09-06.1`.

This package explores deeper astronomy while preserving frozen `p3-astronomy-1` identity, sparse random access and P4 temporal authority. It never writes canonical P0-P6 files or shared registries. Provider outputs retain `sourceEntityId === canonical.id`; observer context is query-only; `mutationAuthority` is false.

## Models

- `rd15-morphology-posterior-1` — **canonical-successor candidate**, empirically inspired, low/moderate fidelity. Qualitative local-universe stellar-mass/environment trends only; coefficients are stylized and not survey fitted.
- `rd15-stellar-population-evolution-1` — **canonical-successor candidate**, low fidelity. Q16 young/intermediate/old mixture plus deterministic lifetime-progress abstraction; no isochrone interpolation or detailed abundance physics.
- `rd15-multiplicity-orbit-prior-1` — **canonical-successor candidate**, low/moderate fidelity. Coarse primary-mass-dependent period, mass-ratio and eccentricity prior; frozen P3 remains authoritative for component count; no dynamical stability or binary evolution.
- `rd15-cosmic-gradient-prior-1` — **model-derived only**, stylized/hypothetical. Exactly six samples of P3's procedural density field produce a synthetic local axis with `coordinateAuthority: NONE` and `physicalTruthClaim: false`.
- `rd15-observability-proxy-1` — **model-derived query only**, low fidelity. Uses inverse-square and parallax geometry plus a stylized crowding attenuation; explicitly **not** Gaia/TESS/Roman completeness.

## Scientific provenance and validity

1. Chabrier (2003), *Galactic Stellar and Substellar Initial Mass Function*, PASP 115, 763, DOI 10.1086/376392, arXiv:astro-ph/0304382. Supports a future formally specified IMF successor; this lane does not replace frozen P3 IMF bins.
2. Duchene & Kraus (2013), *Stellar Multiplicity*, ARA&A 51, 269, arXiv:1303.3028. Supports primary-mass/evolution dependence and the need to model selection biases.
3. Moe & Di Stefano (2017), *Mind your Ps and Qs*, ApJS 230, 15, DOI 10.3847/1538-4365/aa6fb6, arXiv:1606.05347. Supports period-dependent multiplicity/q/e structure. V1X-15 is a coarse approximation, not their fitted joint PDF.
4. Choi et al. (2016), MIST I, ApJ 823, 102, arXiv:1604.08592. Defines an appropriate future target for admitted stellar-track/isochrone interpolation.
5. Dotter et al. (2026), MIST II alpha-enhanced models, arXiv:2602.22012. Demonstrates that detailed successors must expose abundance assumptions/uncertainty rather than silently assume solar-scaled chemistry.
6. Moffett et al. (2016), GAMA stellar mass budget by galaxy type, MNRAS 457, 1308, arXiv:1512.02342; and Bamford et al. (2009), Galaxy Zoo morphology/environment, MNRAS 393, 1324. Used only for qualitative morphology-mass-environment directionality; P3 synthetic density is not mapped to survey environment quantitatively.
7. Castro-Ginard et al. (2023), Gaia DR3 sub-sample selection function, A&A 677 A37, arXiv:2303.17738. Negative requirement: real selection depends on sky position, magnitude, colour, catalogue processing and sample cuts; the V1X-15 score is not a completeness probability.
8. Coles & Jones (1991), *A lognormal model for the cosmological mass distribution*, MNRAS 248, 1, DOI 10.1093/mnras/248.1.1. Historical phenomenological density-field context only. V1X-15 does not claim P3 is lognormal or cosmologically calibrated.

Relationship labels: inverse-square/parallax are **formal/established**; morphology and multiplicity trends are **empirical but represented approximately**; stellar phase progress is **stylized over an established physical domain**; P3-gradient orientation is **hypothetical/model-derived**.

## Determinism, resource bounds, tests

All executable research arithmetic is integer `BigInt` with Q16/Q32 scales. No floating-point RNG, transcendental function, locale, clock or global catalogue is used. Galaxy enrichment is constant work plus exactly six bounded P3 density queries. System enrichment is bounded by P3's maximum four components and at most three companion candidates. Results are direct random-access sidecars.

`run-tests.mjs` checks normalization/bounds, qualitative distribution directionality, 4096-point multiplicity-frequency sanity, hierarchy consistency, observability monotonicity, six-sample spatial bounds, repeated determinism and identity preservation. `oracle.py` independently reproduces selected morphology/observability integer relationships and `fixtures/oracle-v1.json` freezes them. `p3-compat-smoke.mjs` is an exact-checkout integration test against real frozen P2/P3 APIs.

## Promotion / extraction

Canonical-successor candidates require a new astronomy semantic manifest/version and explicit migration; fitted reviewed distributions with uncertainties; independent oracles and Node/browser vectors; deterministic admitted interpolation tables; P5/P6/P4 compatibility review; and central promotion authority. Never mutate `p3-astronomy-1` in place.

The cosmic-gradient and observability ideas may be reimplemented earlier in a shipping-owned additive provider only with explicit `MODEL_DERIVED_SIMULATION`/presentation-query authority and provenance. Do not blind-merge this research subtree.

Known unsupported: calibrated cosmological clustering/halo occupation/merger trees; physical 3D cosmic-web coordinates; dust/extinction/SED/bandpass photometry; survey completeness; detailed isochrones/nucleosynthesis; mass transfer/tides/common envelope; N-body multiple stability; remnant kicks/mass relations; rotation/activity/variability; calibrated posterior uncertainties.
