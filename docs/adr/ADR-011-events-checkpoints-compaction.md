# ADR-011 — Events, Checkpoints and Compaction

**Status:** Accepted

## Decision
Mutable canonical state is modeled as a versioned event overlay on the procedural baseline. Event logs are not required to grow forever without compaction.

Canonical checkpoints MAY be introduced to bound replay cost, provided they are deterministically derived, integrity-protected and semantically equivalent to replaying the covered event lineage.

Event schemas MUST be versioned.

## Consequences
A compatibility test must prove:

`resolve(baseline + fullEvents) == resolve(baseline + checkpoint + remainingEvents)`

under canonical serialization/digest.