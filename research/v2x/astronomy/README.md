# V2X-15 Astronomy Frontier Research

Authority: `RESEARCH_ONLY`

This lane provides bounded, falsifiable astronomy diagnostics and promotion packets. It does not register shipping providers, alter canonical runtime state, or claim calibrated observational truth.

## Implemented research kernels

- `pairwiseHillScreen`: low-cost circular/coplanar two-planet mutual-Hill screening. Output is a diagnostic classification, never an N-body stability claim.
- `rockyRadiusPrem`: source-bounded PREM-style rocky mass-radius reference for 1-8 Earth masses and CMF 0-0.4.
- `hydrostaticScaleHeight`: ideal-gas isothermal atmospheric reference.
- source/authority ledger in `SOURCE_LEDGER.json`.

## Scientific boundary

Unknown stays unknown. Inputs outside declared source domains return `UNSUPPORTED` instead of extrapolating silently. Pairwise Hill stability does not establish Lagrange stability, resonance safety, or long-horizon multi-planet stability. The rocky relation is not a unique composition inference and must not be used below 1 Earth mass or above 8 Earth masses as source-backed truth.

## Promotion packet

`ASTRO-STABILITY-01` is suitable for later review as a research diagnostic only: a mutual-Hill screen for low-eccentricity, approximately coplanar two-planet systems. Richer systems require AMD/N-body analysis and remain outside this packet.
