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

Planetary presentation is downstream only from planet/system scientific state and the body's presentation seed. A selected local sample may condition material and microscopic grammar, but it cannot recolor or otherwise mutate its parent planet's visual identity.

## R5-04 bounded galaxy streaming

The former eight-galaxy universe is now an eight-galaxy active window. The user can traverse positive or negative galaxy-field coordinates through visible controls or bracket keys. Window addresses use unbounded integer coordinates supplied to the existing P3 exploration authority; only one window and a bounded LRU working set are active.

Window revisit rematerializes the same identities independent of visit order. Checkpoints retain the galaxy-window coordinate so a branch can return across streamed fields. The working node index is rebuilt from the active window instead of accumulating every galaxy ever seen.

## R5-05 durable deterministic bookmarks

A versioned bookmark serializes the open-universe address, active galaxy window, body-fixed surface point, selected source sample, camera/scale state, and generator/science/representation integrity hashes. Restoration reconstructs through the same authority path and fails closed if any recorded version or hash differs.

The active world lifecycle can be explicitly released before restoration. This makes exact revisit evidence prove reconstruction after disposal, and the JSON-safe bookmark can also cross a full document reload rather than relying on retained in-memory object identity.

Continuum bootstrap and subsequent discovery now use the experiment's isolated read-only authority runtime. The released Living runtime is disposed after authority startup but is never driven through scale or selection as a data-query shortcut; this prevents an experimental inspection from contaminating V2's persisted semantic navigation state.

## R5-06 cross-galaxy causal diversity

A dedicated browser falsification traverses three independently selected galaxies through three regions, systems, supported solid bodies, surface contexts, local samples, and every material/microscopic landmark to `ATOMIC`, then performs the complete conceptual reverse for each. The sample records scientific and presentation state separately and requires diversity in physical inputs, terrain relief/frequency descriptors, planetary palettes, and microscopic layouts. Unsupported physical domains remain explicit blockers.

The test found and removed an inverted dependency: local `sample.kind` had been allowed to choose the parent planet's palette. Planet appearance now derives only from planet/system scientific state plus the body's presentation stream; sample identity is confined to local material and microscopic grammar. Three audited worlds differ across radius, gravity, mass, insolation, terrain spectra, palettes, and microscopic layouts without promoting presentation geometry to scientific fact.
