# P3 -> P5 Planetary Input Contract Snapshot v0

**Contract ID:** `ofu-p3-p5-planetary-input-snapshot-v0`  
**State:** STABLE_SNAPSHOT for parallel development; not a P3 or P5 schema freeze.  
**Reviewed P3 prototype:** `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a`  
**Reviewed P5 research:** `efe2b8ce29267deb26f3f34d18433c96947c467e`

## Goal

Give P3 and P5 one non-overlapping authority boundary before either phase freezes persistent planet facts.

P3 owns astronomical identity, architecture and formation/population facts. P5 owns the detailed physical realization of a planet. A P5 model may refine a P3 prior, but it may not silently replace a fact that P3 has declared canonical.

## Input snapshot

The future adapter should expose a compact structure conceptually equivalent to:

```text
P3PlanetaryInputSnapshotV0 {
  contractId
  p3SchemaVersion
  planetId

  system {
    systemId
    ageMyr
    metallicityMilliDex
    planetArchitecture
  }

  host {
    starId
    massMilliSolar
    evolutionaryClass
    temperatureK
    luminosityMilliSolar
  }

  orbit {
    orbitSlot
    orbitCenter
    semiMajorAxisMicroAu
    eccentricityPpm
    inclinationMilliDeg
    insolationPpm
  }

  formation {
    massMilliEarth
    bulkPriorClass
    protoplanetarySolidBudgetPermille
  }
}
```

Exact field names and integer ranges remain P3-owned until P3 schema v1. P5 must consume the adapter rather than depending on P3 internal resolver/query keys.

## Ownership decisions

### P3 authoritative

- `planetId` and all entity relationships;
- system/star identities and host relation;
- orbit slot and orbit geometry;
- orbit centre / architecture;
- system age and metallicity astronomical facts;
- stellar mass/state/temperature/luminosity facts;
- astronomical incident flux / insolation;
- planet formation/population mass;
- coarse formation/bulk prior category;
- protoplanetary solid-budget or equivalent formation prior if retained by P3.

P5 consumes these values. It must not use an independent random draw to replace them.

### P5 authoritative

- detailed composition fractions and material realization;
- canonical mean physical radius for the future physical-planet contract;
- density and gravity derived from the authoritative mass/radius model;
- volatile partitioning;
- interior and geodynamic state;
- atmosphere and escape/evolution model outputs;
- hydrosphere and phase state;
- albedo-dependent planetary energy state;
- climate;
- terrain macro constraints and terrain realization.

## Required P3 schema-v1 adjustment

P3 schema `0` currently emits both `radiusMilliEarth` and `compositionClass` as PlanetFacts. P5 research independently derives a composition realization and radius. Freezing both current outputs would create duplicate canonical authority.

Before P3 schema v1 is frozen:

1. keep `massMilliEarth` as the authoritative P3 formation/population mass;
2. rename or redefine P3 `compositionClass` as an explicitly coarse formation/bulk **prior** (for example `bulkPriorClass`); P5 may refine it under a documented mapping but may not contradict it silently;
3. demote/remove P3 `radiusMilliEarth` from canonical P3 facts, or explicitly label it as a non-canonical coarse prior/diagnostic;
4. if P3 instead elects to freeze a canonical physical radius, ownership changes: P5 must consume that radius as a hard constraint and must not publish a competing canonical radius. That alternative requires explicit integration-board adjudication before P3 freeze.

The recommended path is P5 ownership of physical radius because P5 is the phase responsible for composition-aware mass-radius physics.

## Equilibrium-temperature naming rule

P3 schema `0` also emits `equilibriumTempK`, while P5 derives equilibrium temperature using a P5 albedo model.

These must not become two facts with the same semantic name.

P3 schema v1 may either:

- omit this field and expose only authoritative insolation; or
- define it as an explicitly named **reference equilibrium-temperature proxy** using a frozen reference-albedo convention.

P5 owns the albedo-dependent planetary equilibrium/energy and climate state. The two concepts must remain semantically distinguishable.

## Refinement rule

A P5 refinement must preserve the upstream P3 constraints. Examples:

- P3 `TERRESTRIAL`/rocky-like prior may refine to a P5 rocky or iron-rich composition consistent with that prior;
- P3 gas-giant prior may refine envelope/composition fractions but not become a canonical terrestrial planet without an explicit migration/model-version change;
- P5 radius may change when the P5 physical-model version changes, but the P3 planet identity, orbit and committed mass remain stable unless their owning contract explicitly migrates.

A refinement mapping that changes persistent semantics must be versioned and conformance-tested.

## Temporal handoff

This snapshot is a genesis/static input contract only. It defines no clock, event order, checkpoint or replay behavior.

When a P5 property becomes time-evolving canonical state:

- P4 supplies canonical time, event ordering, replay, checkpoint and lineage;
- P5 supplies the versioned planetary transition semantics;
- P5 must not create a private canonical event history.

## Acceptance tests for later integration

- P3 -> P5 adapter preserves `planetId`, system/star relations, orbit and mass byte-for-byte/value-for-value.
- Reordering P5 queries or Worker execution cannot change the consumed P3 snapshot.
- P5 cannot reroll an upstream authoritative P3 field.
- P5 refinement output remains compatible with the declared P3 `bulkPriorClass` mapping.
- Changing a P5 physical-model version may change P5-owned facts without changing P3-owned identity/orbit/mass.
- A P4-driven planetary transition consumes P4 canonical time/events and does not introduce a P5-private clock.
