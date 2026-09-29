# PROD-W2-TIME — governed temporal exploration

`PROD-W2-TIME` projects existing P4 state/history references into product exploration without creating a second time, history, camera, renderer or persistence authority.

## Authority boundary

| Surface | Authority | Meaning |
| --- | --- | --- |
| P4 `canonicalTime` / `P4_STATE_REF` | `CANONICAL_P4` | Exact universe/lineage/frontier/state reference owned by existing P4 semantics. |
| Domain time adapter | `CANONICAL` or `MODEL_DERIVED` | Declares exactly which temporal intervals/epochs it can reconstruct and with which versioned model. |
| Time Explorer reference/plan | `REFERENCE_ONLY` | Binds P4 state, canonical subject/place, domain model version and Atlas product context. It cannot mutate canonical history. |
| Pause/rate projection and labels | `PRESENTATION_ONLY` | UI intent only. Animation/wall clocks are never canonical time. |
| Atlas snapshot | existing Atlas `PRODUCT_LOCAL_STATE` | Stores compact semantic references, never mutable world/renderer copies. |

P4 remains the only canonical temporal protocol. The Time Explorer never calls P4 `commit`, edits checkpoints, rewrites accepted history, owns a camera, performs picking, or supplies a renderer clock.

## Governed domain adapter

A domain is explicit and versioned:

```text
{
  id,
  model: { contractId, semanticVersion },
  authority: CANONICAL | MODEL_DERIVED,
  supportMode: REFERENCE_ONLY | EXACT_INTERVALS,
  intervals,
  stepMicros,
  epochs,
  resolveExact
}
```

`REFERENCE_ONLY` means an existing exact P4 snapshot can be displayed/returned to, but the product is not allowed to synthesize another historical instant.

`EXACT_INTERVALS` requires bounded declared intervals and a resolver. A requested time outside those intervals fails before the resolver runs. The resolver may still return `UNSUPPORTED` for an instant inside a coarse declared interval when its owning model cannot reconstruct that state. Unsupported history is not interpolated, animated into existence or guessed.

The resolver receives compact cloned references and a cancellation signal, not a P4 live-world object or renderer/camera handle.

## Exact temporal reference

A serialized Time Explorer reference binds all of the following:

- domain id and exact domain model contract/version;
- model authority classification;
- P4 Universe Identity and lineage;
- canonical subject/place identity;
- canonical P4 frontier time;
- exact W1 P4 state digest/checkpoint/frontier reference;
- Atlas entry id/kind;
- optional W1 scientific fingerprint reference, including its scientific model version;
- optional W1 presentation-only return hint.

Import is canonical-byte and current-model checked. A saved reference from a different domain model version fails closed. Creating a Time Explorer reference from an Atlas snapshot also requires the caller to name the expected time-model version explicitly, so an old exact state cannot be silently rebound to a newer model.

## Navigation semantics

`planTo`, `planStep` and `planEpoch` create immutable navigation plans. Plans declare direction (`REVERSE`, `FORWARD`, `SAME`) and one of two resolutions:

- `REFERENCE_REUSE` for the already-referenced exact state;
- `DOMAIN_RESOLUTION` for a new instant that the declared domain model supports.

Every plan carries:

```text
canonicalMutation: false
cameraMutation: false
timelineAuthorityCreated: false
```

Reverse navigation is therefore exact reconstruction by the owning domain model, not a P4 live-history edit. Pause and playback rate are separately exposed as `PRESENTATION_ONLY`; they never advance P4 time by themselves.

## Bounded materialization and interruption

The Time Explorer stores only a bounded cache of compact temporal references. It does not retain world copies or require whole-universe/whole-history storage.

Materialization is last-request-wins:

- a superseded asynchronous result is returned as `STALE_DROPPED` and is not cached;
- an aborted request is returned as `CANCELLED` and is not cached;
- cache eviction is deterministic and rematerializing the same governed instant must reproduce the same compact temporal reference;
- clearing the cache has no effect on canonical P4 or Atlas state.

## Atlas integration

`saveAtlasSnapshot` writes an existing W1 `SNAPSHOT` observation to the Atlas and returns the associated serialized Time Explorer reference. Atlas remains the storage owner for the saved product entry; the temporal reference remains a compact product reference.

An Atlas snapshot by itself proves an exact P4 state reference, but not a generic domain-time reconstruction model. Temporal navigation therefore does not infer a current model version from an old Atlas entry.

## Evidence

The focused `tests/product/prod-w2-time.mjs` executable falsifies:

- P4 time versus animation-clock authority confusion;
- forward/reverse/epoch/step planning;
- unsupported historical intervals and resolver-level unsupported instants;
- deterministic exact-state return;
- model-version mismatch on Atlas binding, serialized references and resolver output;
- exact target-time and universe/lineage mismatch;
- bounded cache behavior;
- eviction followed by deterministic rematerialization;
- interruption and stale-result admission;
- compact Atlas snapshot behavior;
- network/browser/renderer dependency introduction.

The lane intentionally does not modify shared renderer/product composition, P4, Atlas core, camera/picking, packages, workflows or the central test runner. Broader repository CI remains the regression authority for those shared surfaces.
