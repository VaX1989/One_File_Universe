# V1X-12 history / visual consumer handoff

This lane intentionally does not modify shared UI, scene, renderer, selection, scale, persistence, or P4 core files. Consumers should integrate the additive V1X-12 API rather than duplicating those authorities.

## API surface

After additive component composition, use `OFU.v1x12GovernedActions`.

- `catalog()` returns the bounded supported intervention catalog and semantic-scale availability envelope.
- `availability(kind, parameters)` is the non-mutating capability/context probe. It reuses the current Wave IV selected target and existing V1 agency provider admission.
- `createIntent(kind, parameters)` creates a deterministic, versioned intent bound to target, canonical key, semantic scale, provider contract, persistence contract, authority and mutation policy.
- `admit(intent)` revalidates the intent immediately before mutation and rejects stale target/scale/provider context.
- `commit(intent)` delegates to the frozen V1 P4-backed session transition and returns event ID plus before/after P4 state digests.
- `save()` / `load(bytes)` delegate to the authoritative portable V1 session archive.
- `revisit(targetId?)` projects replayed player-overlay consequence state for history/visual presentation.

`OFU.v1x12TemporalBridge.inspectPortable(bytes)` exposes a non-presentation persistence/checkpoint witness for diagnostics and test consumers.

## Recommended consumer sequence

1. Read current canonical selection and semantic-scale state through the existing product runtime; do not copy them into a second authority.
2. Ask `availability` before rendering an action affordance. Disabled/unsupported actions must remain visibly unavailable rather than silently becoming no-ops.
3. On activation, create an intent as late as practical and call `admit`/`commit`; handle stale-intent rejection by refreshing context rather than force-applying the old intent.
4. Render consequences from `revisit()`. Treat `authority: MODEL_DERIVED_SIMULATION` and `canonicalMutation: false` as part of the user-facing provenance contract where scientific interpretation matters.
5. Save/export with `save()` and restore with `load(bytes)`. After load, refresh selection/scale views from their existing owners; do not reconstruct them from a parallel UI cache.

## Visual/history interpretation

The stored intervention is a governed player-overlay event, not a newly discovered canonical fact. A visual consumer may depict that the player performed an intervention and may present deterministic derived consequence metadata, but must not relabel the overlay as `CANONICAL_PROVEN` astronomy, planetology, biosphere, or civilization truth.

Useful presentation fields from `revisit()` include target identity, intervention count, last intervention kind/parameters, P4 replay state digest, and the explicit mutation/authority flags. The event ID returned by `commit()` is the stable history anchor for an action receipt or timeline item.

## Unsupported / deliberately absent

- No AI-authored state changes.
- No direct P4 state mutation.
- No direct mutation of canonical P0-P6 providers.
- No alternate session codec or browser-storage authority.
- No action at a semantic scale outside the lane rule for that action.
- No arbitrary parameter bags: unsupported fields are rejected, including fields that could masquerade as invented scientific facts.
- No physical-device certification; status remains `NOT_VERIFIED`.

## Integration dependency

The convergence owner must include the namespaced component and conformance descriptors through the existing additive discovery mechanisms. No central composition-file edit belongs to this lane.
