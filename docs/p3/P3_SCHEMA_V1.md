# P3 Universe Skeleton Schema v1

**Status:** CANONICAL CANDIDATE  
**Schema:** `1`  
**Model:** `p3-astronomy-1`  
**Baseline epoch:** canonical P4 `T0`  
**Generator suite:** `p3-universe-skeleton` / version `1`

P3 v1 is the procedural baseline at P4 `T0`. It is not an eternally-current physical state. Current state is obtained by applying P4 canonical history under versioned domain transition semantics. All persistent numeric authority is integer/fixed-point and is encoded by OFU-CBV-1. Unless stated otherwise, integer interpolation and scaling use integer division with the generator's explicit half-up term where present; table interpolation uses truncation toward zero. Absence is explicit (`status: ABSENT` plus reason), never a fabricated zero-valued entity.

## Spatial identity invariant

System stable identity and canonical Address are defined from `(galaxyId, absoluteSiteX, absoluteSiteY, absoluteSiteZ)`, where `absoluteSite = sectorCoordinate * 512 + localSite`. Local site coordinates are `0..511`. Sector is a computational partition and is not part of System physical identity. Galaxy sites are global 500 kpc cells; Regions are 32 galaxy cells per axis. Sector size is 256 pc; System site resolution is 500 milliparsec.

## RegionFacts

| Field | Unit / range | Evidence / fidelity |
|---|---|---|
| `galaxyCellSpan` | cells, exactly 32 | model contract |
| `galaxyCellSizeKpc` | kpc, exactly 500 | model contract |
| `densityQ16` | dimensionless Q16, 0..65535 | HYPOTHETICAL / STYLIZED |
| `anchorDensityQ16` | dimensionless Q16, 0..65535 | HYPOTHETICAL / STYLIZED |
| `environmentClass` | `VOID|FIELD|FILAMENT|NODE` | HYPOTHETICAL / STYLIZED |

## GalaxyFacts

`morphology` is `DISK|SPHEROID|IRREGULAR`. `massLog10MilliDex` is 7000..12000 milli-dex. `characteristicRadiusPc` is 200..80000 pc. `populationAgeMyr` is 300..13800 Myr. `metallicityMilliDex` is -2200..500 milli-dex. `starFormationActivityQ16` and `environmentDensityQ16` are 0..65535. `cellOffsetPc.{x,y,z}` is -220000..220000 pc. Orientation uses `inclinationMilliDeg` 0..180000 and `positionAngleMilliDeg` 0..359999. Evidence is EMPIRICALLY_CONSTRAINED / APPROXIMATE except the environment-density driver, which remains HYPOTHETICAL / STYLIZED.

## SectorFacts

`sectorSizePc=256`; `systemSiteAxis=512`; `systemSiteResolutionMilliParsec=500`; `distanceFromGalaxyCenterPc>=0`; `localStellarDensityQ16=0..65535`; `systemOccupancyQ32=500000..130000000`; `computationalPartition=true`. Sector existence is determined by the galaxy envelope. Sector density contains no independent per-sector random jitter, preventing partition discontinuities.

## SystemFacts

`stellarComponentCount=1..4`; `baselineAgeMyr=10..13800`; `baselineMetallicityMilliDex=-2500..700`; `baselinePrimaryMassMilliSolar=80..120000`; `baselineBarycentricScaleMilliAu=0..200000`; `protoplanetarySolidBudgetPermille=100..2500`; `planetCount=0..10`; `planetArchitecture=PRIMARY_HOSTED|CIRCUMBINARY`; `normalizedAbsoluteSite.{x,y,z}` is signed i64; `baselineLocalOffsetMilliPc.{x,y,z}` is the deterministic P4-T0 positional baseline. Stellar mass is EMPIRICALLY_CONSTRAINED / APPROXIMATE; multiplicity and planet occurrence are EMPIRICALLY_CONSTRAINED / STYLIZED.

## StarFacts

`baselineMassMilliSolar=80..120000`; `baselineAgeMyr=10..13800`; `baselineMetallicityMilliDex=-2500..700`; `baselineEvolutionaryClass=MAIN_SEQUENCE|EVOLVED|REMNANT`; `baselineTemperatureK=0..60000`; `baselineRadiusMilliSolar=1..200000`; `baselineLuminosityMilliSolar>=0`; `mainSequenceLifetimeMyr>=2`. These are P4-T0 baseline values, not immutable current-state facts. Stellar evolution is ESTABLISHED / STYLIZED; the generator uses coarse deterministic proxy tables rather than a precision stellar-evolution grid.

## PlanetFacts

`baselineSemiMajorAxisMicroAu>0`; `baselineEccentricityPpm=0..240000`; `baselineInclinationMilliDeg=0..5000`; `baselineMassMilliEarth=300..4000000`; `bulkPriorClass=TERRESTRIAL|VOLATILE_RICH|ICE_GIANT|GAS_GIANT`; `baselineInsolationPpm=0..1000000000000`; `moonCount=0..8`; `orbitCenter=PRIMARY_STAR|SYSTEM_BARYCENTER`. `baselineMassMilliEarth` is the P3 formation/population mass committed at P4 T0. `bulkPriorClass` is a coarse formation prior that P5 refines under a versioned mapping. P3 v1 deliberately contains no canonical physical planet radius and no albedo-dependent equilibrium/climate state. Planet occurrence is EMPIRICALLY_CONSTRAINED / STYLIZED; the bulk prior is EMPIRICALLY_CONSTRAINED / APPROXIMATE.

## MoonFacts

`baselineOrbitalRadiusPlanetRadiiMilli=2500..80000`; `baselineMassMilliEarth=1..200000`; `baselineInclinationMilliDeg=0..30000`. The moon population model is HYPOTHETICAL / STYLIZED. P3 v1 deliberately does not freeze a canonical physical moon radius.

## P3 -> P5 adapter

`ofu-p3-p5-planetary-input-v1` exposes only P3-owned baseline constraints: identity, system/host relations, baseline orbit, baseline insolation, baseline formation mass, `bulkPriorClass`, and solid-budget prior. P5 must not reroll these fields and owns detailed composition, physical radius, atmosphere, hydrosphere, climate and terrain.

## Derivation and lineage

All entropy remains address-derived through frozen P2 `derive`; there is no sequential global RNG. Canonical namespaces are `astronomy.region.v1`, `astronomy.region-field.v1`, `astronomy.galaxy.v1`, `astronomy.sector.v1`, `astronomy.system.v1`, `astronomy.star.v1`, `astronomy.planet.v1`, and `astronomy.moon.v1`. The P2 Semantic Generator Manifest includes schema/model/baseline lineage via `generatorSuite=p3-universe-skeleton`, `generatorSuiteVersion=1`, `lawProfile=p3-astronomy-baseline-v1`, and `genesis.baselineEpoch=P4_T0`.
