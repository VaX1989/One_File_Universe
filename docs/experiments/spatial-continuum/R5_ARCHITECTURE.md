# Spatial Continuum R5 — deterministic generative universe

R5 is stacked on the exact R4 checkpoint `1f45d11be404c37a520150f056c60609d969ad05` / tree `a058db472f62c4fa2b93ec5f9a39ab5d6518e4e4`. It does not modify released V2.

## Proving contract

R5 must separate four identities which R4 still partially conflated:

1. a canonical hierarchical address;
2. versioned deterministic scientific/model state;
3. a separately versioned presentation description;
4. a bounded materialized working set.

The intended derivation is order-independent:

```text
child seed = HASH(generator version, parent seed, canonical address, domain tag)
scientific state = SCIENCE(scientific model version, canonical inputs, scientific seed)
representation = ADAPT(representation version, scientific state, presentation seed)
```

Scientific state hashes must not change when only presentation changes. Revisit proof must destroy the materialized context, reconstruct it from address and versions, and recover identical scientific and representation hashes.

## R5-01 correctness boundary

Before generative claims, R5 closes three R4 debts:

- all of `MATERIAL`, `MICROSTRUCTURE`, `MOLECULAR`, and `ATOMIC` require an explicitly selected source sample;
- the exact active `world:<body>:<latitude>:<longitude>:<sample>` cache entry is pinned;
- world contexts expose an idempotent disposal lifecycle, while the cache records eviction, callback, model-session, representation, and resource disposal separately.

These are prerequisites for trustworthy revisit, collision, and resource-soak evidence. They are not evidence that the generative-universe hypothesis is proven.

## Acceptance state

Current recommendation: `CONTINUE_EXPERIMENT`.

## R5-02 versioned seed tree

The experiment owns a small synchronous canonical hashing contract so seed derivation works identically in the offline browser artifact and in development tests. Values are type-tagged, object keys are sorted, non-finite numbers and cyclic/non-plain records fail closed, and SHA-256 is used for each domain boundary.

The three independent version axes are:

- generator: `ofu-spatial-continuum-generator-r5-1`;
- scientific model: `p3-astronomy-1+p5-planet-physical-1+ofu-v1-model-suite-1`;
- representation: `ofu-spatial-continuum-representation-r5-1`.

Changing representation input or version cannot mutate a scientific-state hash. A bounded 4,096-address collision and order audit is part of the rapid suite; it is useful falsification evidence, not a proof that SHA-256 can never collide.

## R5-03 scientific state to visual grammar

The first representation adapter consumes existing P3/P5 authority rather than introducing a second planet model. Canonical astronomy and P5 physical values are normalized into a versioned scientific state. Separate planet, surface, sample, and complete-context hashes are retained. Planet texture, atmosphere, terrain wavelengths/amplitudes/palette, local density, and contextual microscopic seed then derive from a separate presentation stream.

The causal trace explicitly lists influences, non-influences, and unknowns. Terrain elevation, palettes, local scatter, molecular layout, and atomic layout remain `PRESENTATION_ONLY`; their conditioning by mass, radius, gravity, insolation, source location, and sample kind is not promoted into a physical measurement claim.
