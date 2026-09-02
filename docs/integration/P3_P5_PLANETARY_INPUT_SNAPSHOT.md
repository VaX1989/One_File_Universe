# P3 -> P5 Planetary Input Boundary

> Historical note: this file originally documented `ofu-p3-p5-planetary-input-snapshot-v0` against a pre-freeze P3 prototype. That v0 snapshot is **SUPERSEDED** and is not a canonical integration contract.

The living cross-phase registry remains [`docs/INTEGRATION_MATRIX.md`](../INTEGRATION_MATRIX.md). This document is explanatory only and does not create a second registry.

## Current producer

Canonical P3 schema v1 exposes the executable producer:

`OFU.p3Astronomy.planetaryInputSnapshot(ctx, key)`

Current contract requirements:

- `contractId === 'ofu-p3-p5-planetary-input-v1'`;
- `p3SchemaVersion === 1n`;
- `baselineEpoch === 'P4_T0'`;
- byte identities remain canonical P2 Entity IDs;
- baseline integer facts remain `BigInt` and must not be routed through floating `Number` authority.

The v1 snapshot fields are:

```text
P3PlanetaryInputV1 {
  contractId
  p3SchemaVersion
  baselineEpoch
  planetId

  system {
    systemId
    baselineAgeMyr
    baselineMetallicityMilliDex
    planetArchitecture
  }

  host {
    starId
    baselineMassMilliSolar
    baselineEvolutionaryClass
    baselineTemperatureK
    baselineLuminosityMilliSolar
  }

  orbit {
    orbitSlot
    orbitCenter
    baselineSemiMajorAxisMicroAu
    baselineEccentricityPpm
    baselineInclinationMilliDeg
    baselineInsolationPpm
  }

  formation {
    baselineMassMilliEarth
    bulkPriorClass
    protoplanetarySolidBudgetPermille
  }
}
```

## Authority

P3 owns and P5 must consume without rerolling:

- planet/system/star identity and relations;
- system age and metallicity baseline;
- stellar baseline state;
- orbit slot, geometry and centre;
- baseline insolation;
- committed baseline planet mass;
- coarse `bulkPriorClass`;
- protoplanetary solid-budget prior.

P5 may own a versioned detailed physical realization only where it preserves these constraints. P3 schema v1 intentionally does **not** publish a canonical detailed composition, physical radius or albedo-dependent equilibrium temperature, avoiding duplicate P5 authority.

## Temporal boundary

This P3 snapshot is genesis/static input. It defines no private clock or history.

`P3 procedural baseline + P4 accepted canonical history + versioned P5 transition semantics = current persistent planetary state`.

P4 remains the sole authority for canonical time, accepted event identity/order, replay, checkpoints, compaction, lineage and archives. A P5 transition contract is needed only when P5 promotes genuinely mutable physical state.

## Executable acceptance

A canonical P5 candidate must test this boundary by invoking the real P3 producer, not a hand-written v0 fixture. Tests must reject the historical v0 contract and prove byte/value preservation for identity, orbit, insolation, mass and bulk prior.
