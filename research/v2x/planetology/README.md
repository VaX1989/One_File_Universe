# V2X-15 Planetology Frontier — RESEARCH_ONLY

This directory contains bounded planet-physics research kernels and scientific applicability contracts. It is **not** canonical truth and is not registered as a shipping provider.

## Implemented research capability

- mass-radius composition-degeneracy contract separating rocky, water-rich and H/He-envelope scenarios;
- P–T/version/hash/phase-source-gated high-pressure water-EOS interpolation;
- explicit separation between EOS density lookup and planetary-radius authority;
- source-family-bounded 4-D Lopez–Fortney sub-Neptune interpolation over mass × H/He × irradiation × age;
- finite thermal source/sink ledger that rejects overflow/NaN rather than returning false conservation;
- provenance/critical-Rayleigh-gated convection classification;
- explicitly unnormalized Nu–Ra scaling-shape and context-bound lag scenarios;
- 0-D, transient and 2–256-zone equal-area reduced energy-balance climate kernels with explicit parameter provenance and conservation residuals;
- no silent zonal-insolation renormalization and fail-closed negative-linear-OLR behavior;
- provenance-bound atmospheric-escape regime screen;
- energy-limited escape using only the explicit `ERKAEV2007_RP_RXUV2` convention `π η F_XUV R_p R_XUV² / (G M_p K)`;
- `R_XUV >= R_p` geometry guard and depletion-capped atmospheric mass ledger;
- volatile total-conservation plus non-negative individual-reservoir invariants;
- bounded Schlichting-style impact-loss scenario;
- provenance/time-unit-gated stream-power incision and bounded uplift-minus-incision step.

## Authority / non-claims

These kernels do **not** establish weather, GCM-equivalent climate, habitability, plate tectonics, deterministic thermal/tectonic history, universal atmospheric escape, unique composition, universal ocean–mantle cycling, calibrated erosion, or reconstructed impact history.

EOS/interpolation machinery requires exact versioned scientific datasets. Conservation bookkeeping does not itself supply physical transfer laws.

## Verification

Primary executable gate:

```text
node research/v2x/run-tests.mjs
```

Independent numerical witnesses:

```text
python3 research/v2x/reference-oracle.py
```

The reference oracle independently evaluates selected rocky, Hill/AMD, hydrostatic, radiative, impact and Erkaev energy-limited escape witnesses.

## Convergence

- Source/limitation provenance: `research/v2x/planetology/SOURCE_LEDGER.json`
- Selective promotion contracts: `research/v2x/PROMOTION_PACKETS.json`
- Definitive lane handoff: `research/v2x/astronomy/HANDOFF.json`

A convergence owner should bind exact data IDs, versions, digests, units, domains, uncertainty and consumer authority before promoting any data-driven evaluator.
