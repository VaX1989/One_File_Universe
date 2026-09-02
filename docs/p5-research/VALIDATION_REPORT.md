# P5 Research Validation and Performance Report

**Model:** `p5-research-planet-v0.1`  
**Status:** exploratory evidence, not certification.

## Deterministic/property checks

Executed `tests/p5-research/model-tests.mjs`:

- repeat generation is structurally identical;
- radius/gravity positive;
- surface pressure non-negative;
- atmospheric mass never exceeds volatile inventory;
- increased irradiation in a controlled pair increases equilibrium temperature;
- higher-mass controlled fixture increases the heavy-gas Jeans retention proxy;
- random-access terrain patch is stable for the same address/resolution;
- P6 environment projection remains bounded.

All checks passed.

An early Earth-like fixture produced ~26 bar surface pressure. The volatile partitioning coefficient was reduced before recording this version; the same fixture now produces ~3.35 bar. This is still not an Earth calibration target and demonstrates that atmosphere/volatile partitioning remains a primary research uncertainty.

## Deterministic population experiment

10,000 synthetic planets were generated over broad deliberately non-observationally-weighted ranges (0.08-80 Earth masses; 0.05-12 AU; ages 0.2-11.5 Gyr; eccentricity up to 0.45). This is a stress population, not an inferred exoplanet occurrence distribution.

Observed class counts:

- ROCKY: 4,133
- WATER_RICH: 2,884
- GAS_GIANT: 1,363
- ICE_GIANT: 979
- IRON_RICH_ROCKY: 641

Invalid numeric/state outputs: **0 / 10,000**.

Irradiation metamorphic test over the first 1,000 eligible fixtures: **0 monotonic failures** for the equilibrium-temperature relation.

The broad sample intentionally contains many extreme worlds: ~27.7% have `Teq > 500 K`, ~28.7% have `Teq < 150 K`. Mean pressure is not scientifically meaningful because giant-planet envelope pressures and the stress-sample distribution dominate it; this metric is retained only as an alarm signal, not a calibration statistic.

## Performance observation

One local Node execution reported approximately:

- 10,000 planet genesis calls: ~108 ms total (~10.8 microseconds/planet);
- 5,000 terrain patch samples: ~9.2 ms total (~1.85 microseconds/patch).

These are development-machine observations, not portable performance guarantees. They support the architectural hypothesis that bounded analytic/proxy models and random-access terrain can be inexpensive enough for OFU. Browser/runtime matrix testing remains required.

## Known weaknesses discovered

1. Volatile inventory and atmospheric partitioning dominate pressure uncertainty.
2. Gas/ice giant radius and surface notions are placeholders and must be separated from solid-surface planet logic more strongly.
3. The global greenhouse increment is too stylized for canonical climate semantics.
4. Current hydrosphere phase logic is coarse and lacks high-pressure ice/supercritical regimes.
5. Terrain detail is deterministic and bounded but does not yet project to a measured parent spectrum/ocean statistic.
6. No canonical numeric portability claim is possible until the P2 adapter replaces the research fixture derivation and numeric policy is adjudicated.
