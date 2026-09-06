# V1X-16 Deep Planetary Causality Research Prototype

Authority: `RESEARCH_ONLY_MODEL_DERIVED_SIMULATION`.

This directory is intentionally standalone from shipping registries and frozen P0-P6 code. It can be executed with Node without importing OFU runtime code.

## Run research diagnostics

```sh
python3 research/v1x-16-planetary-causality/oracles/generate_oracle.py
node research/v1x-16-planetary-causality/tests/run.mjs
```

The Python step is an independent high-precision oracle generator. The JavaScript tests validate deterministic fixed-point/rational formulas, exact conservation ledgers, bounded sparse cross-scale behavior and the non-canonical P4 proposal boundary.

## Model IDs

- `rd16-rocky-interior-fixed-1`
- `rd16-energy-limited-escape-fixed-1`
- `rd16-grey-atmosphere-fixed-1`
- `rd16-thermal-ledger-regime-1`
- `rd16-zonal-energy-transport-fixed-1`
- `rd16-water-reservoir-ledger-1`
- `rd16-planet-region-budget-seam-1`
- `rd16-stylized-terrain-envelope-1`
- `rd16-giant-family-envelope-1`
- `rd16-p4-transition-proposal-1`

Scientific contracts and source registry are under `docs/evidence/v1x-16-planetary-causality/`.
