# P4 Temporal Kernel Contract

**Status:** semantic-closure candidate  
**Upstream authority:** frozen P2 final candidate `9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883`  
**Temporal protocol:** `ofu-p4-temporal-v1`  
**Evidence architecture:** `phase-evidence-architecture-v1`

## Scope and authority

P4 defines deterministic mutable-world time, accepted event ordering, replay, checkpoints, bounded history, lineage and temporal scheduling. It reuses P2 OFU-CBV-1, Unicode, Universe Identity, Canonical Entity Identity, hashing and canonical byte rules. P4 does not own astronomy, climate, biology, civilization or domain transition physics.

The persistent world equation is:

```text
CurrentCanonicalWorld = ProceduralBaseline + VersionedTransitionContract + AcceptedCanonicalHistory
```

A long-running live representation is:

```text
VerifiedCheckpoint(discarded prefix) + BoundedCanonicalTail
```

A checkpoint is an authority-preserving replay accelerator and commitment to the discarded prefix result; it is not a second world truth.

## Canonical time

The canonical epoch is Universe Genesis T0. Canonical time is:

```text
{ seconds: u64, micros: u64 in [0, 999999] }
```

Negative canonical time is not admitted in v1. Browser `Date`, wall-clock arrival time, animation time and Worker scheduling are non-canonical presentation/runtime metadata.

## Event identity and total order

A canonical event commits Universe Identity and lineage, canonical time, event type and positive version, `operationKey`, canonical target Entity IDs, payload, bounded `causes` references and optional `preconditionStateDigest`.

`EventId` is the domain-separated SHA-256 commitment to the OFU-CBV-1 event descriptor. Total order is `(time.seconds, time.micros, EventId bytes)`. Arrival/insertion order, browser scheduling and random UUID ordering never break ties.

## Historical reconstruction versus live admission

`replay()` / `reconstructHistory()` may receive an already-known bounded historical event set in arbitrary delivery order. They canonical-sort the set, deduplicate exact Event IDs and replay it deterministically. This does not mean that a newly arriving live event may revise accepted history.

`commit()` operates on a live world and accepts a new event only when its canonical order key **strictly advances** the current accepted frontier. The frontier is the last retained tail event, otherwise the checkpoint frontier. Therefore an event ordered before the frontier is rejected; a same-time event is accepted only if its Event ID sorts after the frontier Event ID; an exact retry of the current frontier Event ID is an idempotent duplicate no-op; an older duplicate is not a history-edit command and is rejected by the same monotonic rule; and compaction cannot change live mutation legality.

Retroactive history editing requires a future explicit history-revision/branching operation and is not ordinary P4 v1 commit semantics.

## Frozen v1 meanings

- `causes` are provenance/reference links only. P4 v1 does not infer dependency scheduling, rejection or causal propagation from them.
- `operationKey` is semantic material inside the Event ID descriptor. It distinguishes otherwise identical logical operations; it is not a separate global idempotency identity.
- `preconditionStateDigest` is checked only when a **new** live Event ID is admitted. Replay of an already accepted event does not re-adjudicate the historical command precondition.
- a checkpoint commits the discarded-prefix result, accumulated history root, covered event count and accepted frontier.

## Transition semantic authority

Canonical event bytes are not self-interpreting. Persistent interpretation is bound to a transition contract descriptor containing `transitionContractSchemaVersion`, `contractId`, `semanticVersion`, `compatibility` and `eventFamilies`.

P4 v1 supports exact compatibility only. `semanticVersion` uses SemVer core `MAJOR.MINOR.PATCH` form. A runtime transition implementation must explicitly provide reducers whose keys exactly match the declared event families.

The built-in P4 transition contract is `ofu.p4.core-transition` version `1.0.0`, compatibility `exact`, with families `core.field.set@1`, `core.counter.add@1`, `core.set.add@1`, `core.set.remove@1`, `core.relation.set@1` and `core.tombstone.set@1`.

The transition descriptor is embedded in canonical state and bound by checkpoints, archives and live worlds. Replay/checkpoint/archive operations require a runtime implementation whose descriptor exactly matches the persisted descriptor. Missing, mismatched or unsupported contracts fail closed.

This mechanism is deliberately not a generic plugin framework. P5/P6/P7 may provide explicit versioned domain transition contracts through the same narrow boundary; they do not modify P4 time/order semantics.

## Checkpoints and extendable history commitment

Checkpoint schema v2 records Universe Identity and lineage, transition contract descriptor, total covered event count, accumulated event-history root, last covered order key, canonical state and state digest, and protocol/schema versions.

The event-history root is an ordered domain-separated accumulator over Event IDs. This permits deterministic extension from a prior checkpoint without restoring discarded Event IDs while producing the same root as the corresponding complete ordered prefix. `advanceCheckpoint()` accepts only suffix events strictly after the prior checkpoint frontier and extends count/root/state deterministically.

## Bounded live history and deterministic compaction

A live world stores Universe Identity and lineage, baseline, transition descriptor, optional verified checkpoint, bounded event tail and declared compaction policy `{ threshold, retainTail }`. `threshold` is bounded by the P4 tail hard limit and `retainTail < threshold`.

When a successful live commit reaches the threshold, P4 deterministically folds the oldest tail prefix into the checkpoint and retains exactly the declared newest tail count. If a checkpoint already exists, it is advanced rather than reconstructing the discarded prefix.

Required invariant across any number of cycles:

```text
Replay(full accepted history)
==
ReplayLiveWorld(repeatedly compacted checkpoint + tail)
```

The one-shot historical reconstruction limit does not cap total live-world lifetime. Checkpoint `coveredEventCount` is u64 and can advance beyond the historical collection bound while the retained tail remains bounded.

## Archive v2

A portable P4 archive is OFU-CBV-1 encoded and contains the live representation: Universe/lineage, transition descriptor, baseline, compaction policy, optional checkpoint and bounded suffix, plus a domain-separated integrity digest.

Import verifies integrity, schema versions, transition compatibility, checkpoint authority, baseline equality, Universe/lineage equality and suffix ordering before constructing a live world. Browser IndexedDB/localStorage remain caches only.

## Transaction boundary

For a live mutation:

```text
verify live world + transition contract
-> replay checkpoint + bounded tail
-> canonicalize candidate event
-> exact current-frontier retry => duplicate no-op
-> require candidate order > accepted frontier
-> evaluate new-event precondition
-> apply transition
-> append to tail
-> compact deterministically if threshold reached
-> return new immutable-by-convention world/state result
```

Validation failure never partially mutates the input world.

## Scheduler

COLD/WARM/HOT/IMMEDIATE remains only a deterministic work-planning abstraction. Simulation LOD cannot alter canonical results unless a later domain/model contract explicitly owns that approximation.

## Downstream snapshot

Stable P4 concepts for later phases are canonical time and total event order; monotonic live frontier; historical reconstruction separate from live admission; versioned transition-contract descriptor; `replay` / `reconstructHistory`; `createLiveWorld` / `commit` / `replayLiveWorld`; checkpoint / `advanceCheckpoint`; deterministic bounded-tail compaction; lineage; portable archive; and scheduler tiers.

Downstream phases must not depend on JavaScript callback identity, object insertion order, browser storage or internal reducer implementation layout.
