# P3 Astronomy Dependency Graph

**Status:** pre-freeze prototype.

```text
Universe semantic configuration
        |
        v
multiscale Region density anchors
        |
        v
GalaxyFacts
  mass / morphology / age / metallicity
        |
        v
SectorFacts (computational local density partition)
        |
        v
SystemFacts
  primary mass / multiplicity / system age / metallicity / solids
        |
        +--------------------+
        |                    |
        v                    v
     StarFacts          PlanetFacts
                           |
                           v
                        MoonFacts
```

## Canonical inputs and bounded work

| Resolver | Canonical query inputs | Bounded ancestors | Prototype behavior |
| --- | --- | --- | --- |
| Region | region i64 XYZ | density anchors | fixed 3 octaves x 8 anchors |
| Galaxy | global galaxy-site i64 XYZ | density anchors | fixed density field + galaxy properties |
| Sector | galaxy-site XYZ + sector XYZ | Galaxy | fixed |
| System | galaxy-site + sector + site | Galaxy, Sector | fixed bounded derivation budget |
| Star | system query + component index | Galaxy, Sector, System | fixed |
| Planet | system query + orbit slot | Galaxy, Sector, System, primary Star | fixed bounded derivation budget |
| Moon | planet query + satellite slot | Galaxy, Sector, System, primary Star, Planet | fixed bounded derivation budget |

The instrumentation demonstrates that cost is independent of the number of conceptual galaxies, systems, or planets preceding the requested entity. Exact counts are prototype diagnostics, not a final performance contract.

## Circular-dependency rule

No child facts are needed to establish parent facts. Planet occurrence does not inspect generated planets; moon occurrence does not enumerate prior moons. System/planet slot counts are derived directly from parent facts and a property-specific P2 derivation.

## Domain separation

Property derivations use explicit namespaces/properties such as `astronomy.region-field / density-anchor`, `astronomy.galaxy / occupied`, `astronomy.galaxy / stellar-mass-log10`, `astronomy.system / primary-mass`, `astronomy.system / multiplicity`, `astronomy.star / mass-ratio`, `astronomy.planet / orbit-base`, `astronomy.planet / composition-class`, and `astronomy.moon / orbital-radius`.

Adding an unrelated property therefore does not consume or shift a shared RNG stream.
