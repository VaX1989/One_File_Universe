# P3 Astronomy Contracts - Draft

**Contract status:** schema version `0`, pre-freeze and non-normative.

All IDs are 32-byte P2 Canonical Entity Identity digests. All addresses are P2 Canonical Address v1 bytes. Integer ranges are validated before address construction.

## Query context

Every resolver receives `masterSeed: Uint8Array(32)` and `semanticManifestHash: Uint8Array(32)`. No renderer, worker, cache, observer, time, or LOD state is a canonical input.

## RegionFacts

Stable key: `{ x:i64, y:i64, z:i64 }`.

Facts: `galaxyCellSpan`, `galaxyCellSizeKpc`, `densityQ16`, `anchorDensityQ16`, and `environmentClass: VOID | FIELD | FILAMENT | NODE`.

## GalaxyFacts

Stable key: `{ siteCellX:i64, siteCellY:i64, siteCellZ:i64 }`.

Facts for a present galaxy: `morphology: DISK | SPHEROID | IRREGULAR`, `massLog10MilliDex`, `characteristicRadiusPc`, `populationAgeMyr`, `metallicityMilliDex`, `starFormationActivityQ16`, `environmentDensityQ16`, `cellOffsetPc.{x,y,z}`, and orientation in milli-degrees. Relation: `containedInRegion`.

An unoccupied global site returns explicit `ABSENT / UNOCCUPIED_GALAXY_SITE` rather than an invented entity.

## SectorFacts

Query key: galaxy-site XYZ plus sector XYZ. Stable key: `{ galaxyId, x, y, z }`.

Facts: `sectorSizePc`, `systemSiteAxis`, `systemSiteResolutionMilliParsec`, `distanceFromGalaxyCenterPc`, `localStellarDensityQ16`, `systemOccupancyQ32`, `computationalPartition: true`. Relation: `memberOfGalaxy`.

## SystemFacts

Query key contains galaxy XYZ, sector XYZ, and site XYZ. Site coordinates are constrained to `[0,511]`.

Physical stable key:

```text
{
  galaxyId,
  localSiteX = sectorX*512 + siteX,
  localSiteY = sectorY*512 + siteY,
  localSiteZ = sectorZ*512 + siteZ
}
```

Facts: `stellarComponentCount` `[1,4]`, `ageMyr`, `metallicityMilliDex`, `primaryMassMilliSolar`, `barycentricScaleMilliAu`, `protoplanetarySolidBudgetPermille`, `planetCount` `[0,10]`, `planetArchitecture: PRIMARY_HOSTED | CIRCUMBINARY`, `localSite`, and `localOffsetMilliPc`. Relations: `locatedInSector`, `memberOfGalaxy`.

## StarFacts

Stable key: `{ systemId, componentIndex }`.

Facts: `massMilliSolar`, `ageMyr`, `metallicityMilliDex`, `evolutionaryClass: MAIN_SEQUENCE | EVOLVED | REMNANT`, `temperatureK`, `radiusMilliSolar`, `luminosityMilliSolar`, `mainSequenceLifetimeMyr`. Relations: `belongsToSystem`, `memberOfGalaxy`.

## PlanetFacts

Stable key: `{ systemId, orbitSlot }`.

Facts: `semiMajorAxisMicroAu`, `eccentricityPpm`, `inclinationMilliDeg`, `massMilliEarth`, `radiusMilliEarth`, `compositionClass: TERRESTRIAL | VOLATILE_RICH | ICE_GIANT | GAS_GIANT`, `insolationPpm`, `equilibriumTempK`, `moonCount` `[0,8]`, `orbitCenter: PRIMARY_STAR | SYSTEM_BARYCENTER`. Relations: `belongsToSystem`, `orbits`, `memberOfGalaxy`.

## MoonFacts

Stable key: `{ planetId, satelliteSlot }`.

Facts: `orbitalRadiusPlanetRadiiMilli`, `massMilliEarth`, `radiusMilliEarth`, `inclinationMilliDeg`. Relations: `parentBody`, `orbits`, `belongsToSystem`.

## Failure semantics

Invalid representations or out-of-contract integer ranges throw an explicit P3 error. Valid but non-existing astronomical addresses return an `ABSENT` result with a stable reason code. The resolver never silently substitutes a different model or clamps an invalid identity coordinate into another identity.

## Determinism class target

The final contracts target D3 serialized canonical facts. Schema version `0` has only prototype evidence and MUST NOT be described as D3-certified until P2 is formally frozen, P3 bytes are reviewed, a Golden/Conformance corpus is frozen, and the declared cross-runtime matrix passes.
