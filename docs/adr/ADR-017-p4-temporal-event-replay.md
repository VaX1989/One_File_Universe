# ADR-017 — P4 Canonical Time, Event Ordering and Replay

**Status:** Proposed for P4 ratification

## Context

P4 is the first long-lived mutable-world persistence boundary. Its semantics must remain independent of wall-clock arrival, browser scheduling, Worker completion order and storage implementation. It must reuse the frozen P2 authority kernel rather than invent a second serialization, hashing or identity system.

## Decision

1. Canonical time uses Universe Genesis T0 and the integer tuple `(u64 seconds, micros 0..999999)`. Wall-clock/UI time is non-authoritative.
2. Canonical Event IDs are SHA-256 commitments to OFU-CBV-1 event descriptors with explicit P4 domain separation.
3. Total event order is `(canonical time, Event ID bytes)`. Insertion/arrival order and random UUIDs are not canonical tie-breakers.
4. Duplicate canonical Event IDs are idempotently deduplicated.
5. Commands and their acceptance preconditions are distinct from accepted canonical events. Replay applies accepted events and does not re-run command acceptance.
6. Mutable state uses typed reducer families rather than a generic JSON Patch protocol.
7. Checkpoints commit a canonical event prefix, canonical state, state digest and last order key. They are accelerators, not an alternate truth source.
8. Initial compaction is conservative: replace a canonical prefix with its checkpoint and retain a deterministic suffix. Domain-specific algebraic event collapsing is deferred until proven safe for a specific event family.
9. Portable archives use OFU-CBV-1 and domain-separated integrity commitments. Browser storage is optional cache state.
10. Unknown event/checkpoint/archive versions and malformed lineage/integrity fail closed.
11. Branch lineage is explicitly distinguishable through Universe Identity, optional parent checkpoint and branch key, without implementing P8 time-travel mechanics.
12. COLD/WARM/HOT/IMMEDIATE is a deterministic scheduling abstraction only; LOD is not allowed to change canonical outcomes without a later declared domain/model contract.

## Consequences

- The same baseline and accepted event set has one canonical state independent of delivery or execution scheduling.
- Histories with exact logical duplicate submissions do not double-apply.
- Distinct logical operations that would otherwise have identical descriptors must carry distinct semantic operation keys.
- Microsecond precision is a protocol choice and changing it requires a new temporal lineage/version.
- P4 does not support canonical pre-genesis time in v1; domains needing historical offsets must model them explicitly.
- Compaction can discard individual historical event detail only when the checkpoint commitment and policy make that loss explicit.
- P3 and later domains integrate through stable identities/baseline facts and domain reducers; they do not become dependencies of the temporal kernel.

## Required evidence

Ratification requires replay permutation tests, same-time collision tests, duplicate handling, checkpoint equivalence, compaction equivalence, archive round-trip/corruption/future-version rejection, transaction atomicity, lineage separation, deterministic scheduler tests, property histories, Direct/Worker agreement and cross-runtime digest agreement.
