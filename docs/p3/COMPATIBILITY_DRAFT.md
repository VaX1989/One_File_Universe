# P3 Compatibility Snapshots for P4 and P5

**Status:** pre-freeze interface draft only. No P4 or P5 implementation is included.

## Minimal P4-facing astronomy snapshot

P3 exposes a domain-neutral envelope conceptually equivalent to:

```text
{
  EntityIdentity,
  EntityType,
  CanonicalFacts,
  Relations,
  SchemaVersion
}
```

Prototype helper: `canonicalEnvelope(entity)`.

This snapshot contains no time, event ordering, replay, checkpoint, history, or mutable-state semantics. P4 may reference P3 entity identities and facts, but must not redefine them.

## P3 Planetary Input Contract for P5

Prototype helper: `planetaryInputContract(ctx, planetKey)`.

Candidate fields include `planetId`, system age/metallicity, stellar mass/state/temperature/luminosity, orbital semi-major axis/eccentricity/insolation/equilibrium temperature, and planet mass/radius/composition class.

This is the maximum P3 handoff. P5 may derive atmosphere, geology, hydrology, terrain, or climate from these inputs, but P3 does not do that work.

## Compatibility rule

If the eventual P2 final candidate changes address, identity, manifest, numeric, Unicode, or derivation semantics, this draft is invalid until rebased and recertified. If P5 research needs an additional P3 fact, the addition must be domain-separated and must not reshuffle any existing canonical property.
