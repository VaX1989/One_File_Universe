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
