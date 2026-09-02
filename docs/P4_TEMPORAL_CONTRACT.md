# P4 Temporal Kernel Contract

**Status:** P4 implementation candidate  
**Upstream authority:** P2 final candidate `9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883`  
**Protocol:** `ofu-p4-temporal-v1`

## Scope

P4 defines the deterministic mutable-world layer above the P2 procedural authority kernel. It does not redefine OFU-CBV-1, Unicode, Universe Identity, Canonical Entity Identity, Canonical Address, derivation or numeric semantics. It contains no astronomy, climate, biosphere, civilization or gameplay domain logic.

The canonical equation is:

```text
CurrentCanonicalWorld = ProceduralBaseline + OrderedCanonicalEvents
```

A checkpoint is a verified replay accelerator for an event prefix, not an independent source of truth.

## Canonical time

The canonical epoch is **Universe Genesis T0**. Time is represented as:

```text
{ seconds: u64, micros: u64 in [0, 999999] }
```

This provides integer microsecond precision without canonical floating point. Negative canonical time is not admitted in v1. Historical systems that need a pre-genesis or domain-relative epoch must define that as domain data rather than smuggling wall-clock semantics into P4.

Wall-clock, browser `Date`, frame time, animation clocks and UI timestamps are presentation metadata and MUST NOT participate in canonical ordering or replay.

## Event identity and total order

A canonical event includes:

- P4 event schema version;
- P4 protocol version;
- P2 Universe Identity digest;
- lineage ID;
- canonical time;
- event type and positive schema version;
- explicit operation key;
- canonical target Entity IDs;
- canonical payload;
- optional causal references;
- optional accepted-state precondition digest.

`EventId = SHA-256("OFU-P4-EVENT-v1\0" || OFU-CBV-1(eventDescriptor))`.

Canonical order is the tuple:

```text
(time.seconds, time.micros, EventId bytes)
```

Insertion order, arrival time, browser scheduling, Worker completion order and random UUID ordering are forbidden as canonical tie-breakers.

Submitting the same canonical event twice is idempotent because the Event ID is identical. Distinct logical operations at otherwise identical time/payload MUST use distinct semantic `operationKey` values.

## Command, event and derived effect

A command is an intent supplied to the transactional mutation boundary. Preconditions are evaluated against the current canonical state before acceptance. A canonical event is the accepted mutation. Replay does not re-run command acceptance logic; it re-applies accepted events deterministically.

Derived effects, indexes, caches and presentation artifacts are not events unless they have independent world semantics.

## Typed mutable overlay

P4 v1 contains a deliberately small core event registry:

- `core.field.set@1`;
- `core.counter.add@1`;
- `core.set.add@1`;
- `core.set.remove@1`;
- `core.relation.set@1`;
- `core.tombstone.set@1`.

These are typed event families, not a generic JSON Patch protocol. Later domains should register domain-specific reducers rather than encode arbitrary structural patches.

## Replay invariants

For one Universe Identity, lineage, baseline and accepted event set:

- fresh replay is deterministic;
- input delivery permutation is irrelevant after canonical sorting;
- duplicate Event IDs are applied once;
- query/presentation context is irrelevant;
- Worker or batch scheduling may change execution strategy but not canonical results.

Canonical state is committed by `OFU-P4-STATE-v1` digest over OFU-CBV-1 bytes.

## Checkpoints

Checkpoint schema v1 records:

- Universe Identity;
- lineage ID;
- covered event count;
- deterministic root digest of covered Event IDs;
- last covered canonical order key;
- canonical state;
- canonical state digest;
- protocol/schema versions.

Checkpoint identity is a domain-separated SHA-256 digest of its canonical descriptor.

A suffix event MUST sort strictly after the checkpoint's last covered order key. A checkpoint with a corrupt state digest, wrong Universe Identity, wrong lineage or unsupported version fails closed.

Required equivalence:

```text
Replay(baseline, fullHistory)
==
ReplayFromCheckpoint(Checkpoint(prefix), suffix)
```

## Deterministic compaction

P4 v1 compaction is intentionally conservative: it replaces a deterministic event prefix with a checkpoint and retains a configurable canonical tail. It does not attempt semantic algebra over arbitrary domain events.

For identical sorted history and `keepTail`, compaction produces the same checkpoint and suffix representation. Current-state equivalence is mandatory. Historical detail in the discarded prefix is intentionally no longer represented as individual events; its lineage commitment remains in the checkpoint's covered-event root and count.

## Versioning and migration

P4 v1 defines separate event, checkpoint and archive schema versions. Unknown event type/version, checkpoint version or archive version fails closed.

No hypothetical migration is implemented. A future migration must be explicit, deterministic, auditable and versioned. Silent interpretation of future data is prohibited.

## Lineage and branching hook

A lineage ID is derived from Universe Identity, optional parent checkpoint ID and a canonical branch key. P4 does not implement time-travel gameplay. The hook exists so future timelines cannot alias the canonical lineage accidentally.

## Causality

Events may carry bounded canonical `causes` references. These are provenance/causal references for accepted events and are not used as a hidden global causal scheduler. Command preconditions are represented by an optional state digest and are checked transactionally at acceptance.

Domain-specific bounded propagation belongs to future domain contracts and may use the Multiscale Reality operations `REFINE`, `PROJECT` and `RECONCILE` without changing P4 ordering semantics.

## Scheduler skeleton

The semantic scheduler accepts `COLD`, `WARM`, `HOT` and `IMMEDIATE` work items. It produces a deterministic work plan ordered by due canonical time, then urgency tier, then stable ID.

The scheduler decides **what work is due**. It does not define physics and MUST NOT alter canonical outcomes merely because an entity is simulated at a different LOD. Approximation that changes semantics must be explicitly owned by a domain/model contract.

## Portable archive

P4 archives are OFU-CBV-1 encoded and contain:

- Universe Identity;
- lineage ID;
- procedural baseline descriptor/data supplied to P4;
- optional checkpoint;
- canonical event suffix/history;
- archive/protocol versions;
- domain-separated integrity digest.

Browser IndexedDB/localStorage are caches only. The portable archive is the authoritative mutable-world representation.

Imports rederive Event IDs and checkpoint identities and verify integrity before data is accepted.

## Transactional mutation boundary

`commit()` performs:

```text
replay current world
-> verify precondition digest
-> canonicalize event
-> deduplicate by Event ID
-> canonical sort
-> replay candidate history
-> return a new committed world/state
```

The original world object is not partially mutated when validation fails.

## P3 compatibility surface

P4 requires only upstream canonical identifiers and baseline facts. Synthetic entities are sufficient for P4 conformance. P4 MUST NOT depend on P3 astronomy generator internals.

## Downstream Temporal Contract Snapshot

Stable downstream concepts exposed by P4 are:

- `canonicalTime({seconds, micros})`;
- `lineageId(universeIdentity, parentCheckpointId, branchKey)`;
- `canonicalEvent(eventInput)`;
- canonical event order `(time, EventId)`;
- `replay(...)`;
- `checkpoint(...)` / `replayFromCheckpoint(...)`;
- `compact(...)`;
- `commit(...)`;
- portable `exportArchive(...)` / `importArchive(...)`;
- deterministic scheduler tiers.

Downstream phases must not rely on reducer internals, JavaScript object layout or presentation/cache structures.
