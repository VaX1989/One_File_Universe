# P3 Universe Skeleton Architecture - Draft

**Status:** pre-freeze prototype; non-normative until rooted in the P2 final candidate.

## Objective

P3 proves that an astronomically large structured address space can be queried sparsely and causally while the materialized working set remains bounded. It does not simulate a whole universe, and it does not claim literal `O(1)` high-level resolution. The requirement is **bounded non-enumerative random access**.

```text
UniverseIdentity + P3 query key
              |
              v
P2 Canonical Address + domain/property separation
              |
              v
bounded dependency ancestors only
              |
              v
canonical astronomy metadata/facts
```

No resolver scans conceptual predecessors, siblings, or a global catalogue. Test code may perform finite scans to discover representative occupied sites; that behavior is not part of the resolver.

## Reality graph

The domain is a graph, not a materialized object tree. Relations currently used are `containedInRegion`, `memberOfGalaxy`, `locatedInSector`, `belongsToSystem`, `orbits`, and `parentBody`. Navigation partitions do not automatically define permanent physical identity.

## Sparse spatial model

A Region spans 32 galaxy-site cells per axis. A galaxy-site cell is 500 kpc, so a Region spans 16 Mpc per axis. Region boundaries are lookup partitions, not physical discontinuities.

Large-scale density is a deterministic three-octave fixed-point field. Octave spans are 32, 128, and 512 galaxy cells (16, 64, and 256 Mpc). Each query evaluates eight lattice anchors per octave and trilinearly interpolates in integer Q16 space. This is a structured generative field, not an N-body cosmology or reconstructed observed density field.

Every global galaxy-site cell has at most one galaxy candidate. Occupancy is a bounded function of the multiscale environment field plus an independently derived draw. A present galaxy derives a compact stellar-mass proxy, morphology, characteristic radius, population age, metallicity proxy, star-formation activity proxy, site offset, and orientation. These variables are correlated rather than sampled as independent cosmetics.

A Sector is a 256 pc computational partition local to a galaxy. It carries local density and system-site occupancy metadata. `computationalPartition: true` is explicit.

Each Sector conceptually contains a 512 x 512 x 512 lattice of 0.5 pc sites, but no lattice is materialized. A system query normalizes `(sector, site)` into an absolute local site coordinate:

```text
absoluteLocalSite = sectorCoordinate * 512 + siteCoordinate
```

The physical System stable key is `galaxyId + absoluteLocalSiteXYZ`; the Sector remains a lookup/location relation and therefore cannot become accidental permanent system identity. Per-sector random occupancy jitter is intentionally absent so partition edges do not inject a random density discontinuity.

Star identity is `systemId + componentIndex`. Planet identity is `systemId + orbitSlot`, deliberately not a mutable host-star navigation path. Moon identity is `planetId + satelliteSlot`.

## Identity rule

P2 Canonical Entity Identity is the only identity primitive. P3 defines domain stable keys and calls the current upstream contract directly as `P2.entityIdentity(UniverseIdentity, namespace, stableKey)`. Universe scoping is owned by P2 rather than duplicated inside a P3 descriptor.

## Coordinates and numeric policy

Identity coordinates are integers. Canonical physical proxies use explicit integer units (`kpc`, `pc`, `milli-pc`, `micro-AU`, `milli-solar`, `milli-Earth`, `ppm`, `milli-dex`, `milli-degrees`). Fixed-point Q16/Q32 quantities are integers. Floating-point rendering coordinates are presentation-only and are not emitted by P3 canonical facts. All entropy enters through P2 domain-separated derivation.

## Canonical / derived / presentation separation

**Canonical candidate facts:** IDs, stable integer astronomy metadata, and declared relations returned by the P3 resolver.

**Derived:** caches, indexes, convenience transformations, search results, aggregate statistics, and benchmark instrumentation.

**Presentation:** camera coordinates, labels, colors, meshes, LOD, rendering precision, and diagnostic visualizations.

The prototype has no renderer dependency.

## Versionability

The current generator identifier is `p3-astronomy-prototype-0` and schema version is `0`. These are explicitly non-normative. The final P3 domain version must be included in the Semantic Generator Manifest before canonical world identity is frozen.
