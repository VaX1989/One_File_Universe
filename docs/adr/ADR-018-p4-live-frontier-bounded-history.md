# ADR-018 — P4 Monotonic Live Frontier, Bounded History and Transition Authority

**Status:** Proposed for P4 semantic closure

## Context

The initial P4 candidate correctly defined deterministic replay and checkpoint equivalence, but three remaining semantics prevented closure: ordinary live commit could insert an event before the accepted frontier while full history was retained; mutation required retaining the full event array; and canonical persistent interpretation was supplied as an unbound JavaScript reducer map.

Those properties made live legality dependent on compaction state and left event bytes without a versioned interpretation authority.

## Decision

1. Historical reconstruction and live admission are separate operations. Historical replay may sort a known set; live `commit` must strictly advance `(time, EventId)`.
2. An exact retry of the current frontier Event ID is a duplicate no-op. An older event, including an older duplicate, is not ordinary live mutation and is rejected as non-monotonic.
3. Live worlds persist as verified checkpoint plus bounded tail under an explicit `{threshold, retainTail}` policy.
4. Checkpoint event roots use an ordered extendable accumulator so a checkpoint can be advanced from prior checkpoint + suffix without discarded Event IDs.
5. Repeated compaction must preserve the same canonical state and accumulated root as the corresponding full ordered history.
6. The one-shot historical collection bound does not limit lifetime live history; checkpoint covered-event count is u64 while retained tail remains bounded.
7. Persistent interpretation is bound to an explicit transition contract descriptor containing contract ID, SemVer, exact compatibility rule and supported event families.
8. State, checkpoint, archive and live-world representations bind that transition descriptor. A runtime implementation must match it exactly or fail closed.
9. JavaScript reducer callbacks are runtime implementation details of an explicitly supplied transition contract; callback identity itself is never persistent authority.
10. `causes`, `operationKey`, admission preconditions and checkpoint meanings are frozen as specified in `docs/P4_TEMPORAL_CONTRACT.md`.

## Consequences

- Compaction cannot change whether a retroactive event is legal.
- Long-running mutation continues without restoring discarded history prefixes.
- Future domain transition semantics can version independently while continuing to consume P4 time/order/replay infrastructure.
- Retroactive history revision is deliberately outside ordinary P4 v1 commit and must use an explicit future branching/history-revision contract.
- Checkpoint/archive schema advances to v2 before P4 freeze because transition authority and extendable history commitment are persistent semantics.

## Required evidence

Closure requires deterministic tests for pre/post-compaction retroactivity, same-time frontier collisions, current-frontier duplicate retry, repeated compaction, full-history equivalence, continuation beyond the historical one-shot collection bound, transition mismatch/future versions, archive/checkpoint contract mismatch, wrong Universe/lineage, Worker/reordered replay and phase-owned evidence isolation.
