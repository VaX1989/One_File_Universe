# P5 Planetology, Terrain & Climate Research Architecture

**Status:** Research track; non-canonical; not integration-ready.  
**Branch intent:** `research/p5-planetology`.  
**Upstream baseline inspected:** `main` at `1d6a8390691ebfe2c543745d7d3c24cf0dbdd202`; P2 candidate inspected at `33d84fc6dab7e3f0c78933f305bc35c1936dd798`.

## Safety boundary

This track does not redefine OFU-CBV-1, Canonical Address v1, Universe Identity, Canonical Entity Identity, Semantic Generator Manifest, P2 derivation/numeric semantics, P3 astronomy contracts, or P4 temporal/replay semantics. At the time this document was written, no remote P3/P4 contract snapshot existed in the repository. All astronomy/time inputs used here are therefore synthetic research fixtures.

## Causal pipeline

```text
PlanetGenesisInput (adapter-facing)
  -> bulk class + composition
  -> mass/radius/density/gravity
  -> orbit + stellar luminosity -> irradiation
  -> system age + mass + composition -> interior heat proxy
  -> formation region + composition -> volatile inventory
  -> gravity + temperature + stellar activity proxy -> atmospheric retention
  -> atmosphere + irradiation + albedo -> climate tier
  -> pressure + temperature + water inventory -> hydrosphere state
  -> heat + volatile weakening -> geodynamic regime proxy
  -> geology + hydrosphere -> terrain constraints
  -> surface address + resolution -> late-materialized terrain patch
  -> compact P6 environmental projection
```

The dependency graph is directional. Random draws perturb parameters inside a causal model; they do not independently assign temperature, oceans, atmosphere, terrain, and geology.

## Provisional PlanetGenesisInput

Research adapter contract only:

```text
planetKey              stable fixture identity; replace with P3 entity identity adapter
systemAgeGyr           system age
stellarMassSolar       host-star mass proxy
stellarLuminositySolar host-star luminosity
semiMajorAxisAu        orbit semi-major axis
eccentricity           orbit eccentricity
planetMassEarth        bulk mass supplied by astronomy/genesis layer
metallicityDex         coarse host/system composition proxy
formationRegion:
  snowLineRatio        formation distance relative to coarse snow-line proxy
```

No P3 internal field names are assumed. The future adapter may map stable P3 `StarFacts`, `SystemFacts`, and `PlanetFacts` onto this shape without changing the P5 pure model.

## Candidate canonical facts versus derived detail

Candidate compact canonical facts for later adjudication:

- bulk mass and mean radius;
- coarse composition class/fractions;
- bulk volatile inventory class/quantity;
- persistent major-atmosphere inventory;
- internal heat/geodynamic regime state;
- coarse long-term hydrosphere fractions;
- persistent terrain constraints and macro relief parameters.

Definitely derived/non-identity-bearing in this research track:

- local terrain samples/meshes;
- local sampled climate;
- transient weather;
- texture maps, GPU buffers and rendering parameters;
- diagnostics and benchmark caches.

## Scientific honesty matrix

| Submodel | Evidence class | Fidelity | Research decision |
| --- | --- | --- | --- |
| Rocky mass-radius scaling | EMPIRICALLY_CONSTRAINED | APPROXIMATE | Keep; replace current simplified exponent with validated composition-aware fit before promotion |
| Gravity/density/escape velocity | ESTABLISHED | FORMAL | Keep |
| Stellar irradiation / equilibrium temperature | ESTABLISHED | APPROXIMATE | Keep; albedo remains modeled |
| Atmospheric Jeans-retention proxy | ESTABLISHED mechanism | APPROXIMATE model | Keep as one feature, never as full escape physics |
| Hydrodynamic/XUV erosion | EMPIRICALLY_CONSTRAINED mechanism | STYLIZED implementation | Keep only as bounded proxy until P4 evolution exists |
| Volatile inventory/partitioning | HYPOTHETICAL | STYLIZED | Research only; calibration required |
| Greenhouse temperature increment | EMPIRICALLY_CONSTRAINED idea | STYLIZED | Research only; must be replaced by radiative parameterization/EBM table before canonical use |
| Tectonic regime assignment | HYPOTHETICAL | STYLIZED | Keep categorical proxy; do not claim plate tectonics prediction |
| Hierarchical terrain | FICTIONAL physical mechanism | STYLIZED | Keep as geometry architecture candidate, constrained by canonical macro facts |

## Climate hierarchy decision

The recommended progression is:

- Tier 0: stellar flux + equilibrium temperature;
- Tier 1: global energy-balance state with pressure/composition feedbacks;
- Tier 2: latitude/season EBM using obliquity, eccentricity, heat capacity and diffusive transport;
- Tier 3: coarse spatial climate cells constrained to project back to Tier 1/2 statistics;
- Tier 4: local weather as non-canonical/temporal late materialization unless gameplay later proves otherwise.

Tier 0 and a deliberately stylized Tier 1 proxy are implemented. Tier 2 is the next scientific prototype. A GCM is rejected for P5 baseline because byte cost, CPU cost, cross-runtime numerical portability and random-access behavior are poor relative to present OFU needs.

## Terrain architecture comparison

| Model | Scientific value | Determinism | Random access | CPU | Memory | Byte cost | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Whole-planet heightmap | Low-medium | High | Poor | Medium | Very high | High | Reject |
| Spectral global synthesis | Medium | High with care | Poor-medium | High | Medium-high | Low | Research reference only |
| Pure hierarchical noise | Low physical | High | Excellent | Low | Low | Low | Insufficient alone |
| Global Voronoi/plate tessellation | Medium stylized | High | Medium | Medium | Medium | Low | Candidate macro constraint layer |
| Hierarchical constrained patches | Medium | High | Excellent | Low | Low | Low | **Selected architecture baseline** |
| Full erosion simulation | Medium-high visual/geomorphic | Hard cross-runtime | Poor | Very high | High | Medium | Reject as canonical baseline |
| Local deterministic erosion approximation | Medium | High if integer/quantized | Good | Medium | Low | Low | Future candidate |

Selected architecture: persistent macro constraints + addressable hierarchical residuals. Parent/coarse statistics set relief/ocean/basin constraints; finer octaves add bounded detail. Future plate/crater/erosion features should enter as separately domain-separated constrained fields, not one global mutable generator stream.

## REFINE / PROJECT / RECONCILE

Research contracts:

- `REFINE(parentFacts, surfaceAddress, resolution) -> childDetail`
- `PROJECT(childSamples) -> parentStatistics`
- `RECONCILE(parentFacts, projectedStats) -> invariant report`

Required future tests:

1. refinement order independence;
2. same address/resolution exact stability;
3. parent coastline/ocean fraction respected statistically;
4. projected mean relief remains within declared tolerance;
5. fine detail never changes bulk planet identity/facts;
6. presentation parameters cannot influence canonical terrain fields.

## Temporal classification for P4 integration

| Variable | Expected temporal behavior |
| --- | --- |
| Bulk composition/mass | Genesis/static except explicit catastrophic events |
| Mean radius | Very slow evolution / model-version dependent |
| Internal heat inventory | Slowly evolving |
| Tectonic/geodynamic regime | Slowly evolving with possible regime transitions |
| Atmospheric inventory | Slow-medium; event/evolution driven |
| Mean climate state / ice fraction | Medium |
| Weather | Immediate/derived |
| Terrain macro constraints | Slow; changed by canonical geological events only |
| Local render mesh | Immediate/derived |

P5 will not implement these event transitions; P4 owns ordering/replay semantics.

## P6 Environmental Contract draft

```text
version
energyAvailability
meanTemperatureK
pressureBar
liquidSolventFraction
iceFraction
oceanLandFraction
geologicActivity
habitatReliefM
```

Future additions should include radiation environment, atmospheric major species, seasonality and geochemical resource proxies, but only after their P5 sources are defensible.

## Promotion blockers

P5 must remain research-only until P2 is closed, P3 provides stable star/system/planet facts, P4 provides stable time/evolution interfaces, the climate/atmosphere parameterizations have stronger calibration, terrain REFINE/PROJECT tests exist, and cross-runtime deterministic numeric behavior is demonstrated through the P2 adapter.
