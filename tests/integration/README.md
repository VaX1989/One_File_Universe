# Cross-Phase Integration Tests

**Owner:** Independent Architecture, Contract & Integration Board  
**Status:** acceptance matrix. Tests that require unmerged phase code are executed on disposable exact-SHA integration branches, not on `main` by pretending those phases are already canonical.

## Execution policy

1. Rebaseline live phase heads.
2. Require each phase's own material blockers to be closed first.
3. Create a disposable branch such as `integration/p3-p4` from certified `main`.
4. Combine exact reviewed SHAs without changing feature ownership.
5. Run frozen-upstream regression plus the tests below.
6. Record exact source SHAs and results.
7. Delete or abandon the disposable branch after evidence is captured; it is not canonical authority.

P3/P4 feature code must not be merged together merely to make these tests convenient.

## Phase evidence isolation

| Test | Assertion | Current status |
| --- | --- | --- |
| EVIDENCE-ISO-001 | Valid downstream P4 evidence cannot enter a P2 artifact merely because P4 tests exist in the tree. | REQUIRED on next P4 head |
| EVIDENCE-ISO-002 | Injected `phase: P4` evidence inside a P2-owned aggregate input is rejected. | REQUIRED; preserves fail-closed P2 |
| EVIDENCE-ISO-003 | Extending generic `npm test` does not change phase-specific P2 execution/output scope. | REQUIRED |
| EVIDENCE-ISO-004 | Exact-source SHA mismatch is rejected by the owning aggregate. | REQUIRED |

## P2 -> P3

### INT-P2-P3-001 — Universe-scoped astronomy identity

Same P2 Universe Identity + same canonical astronomical stable key must produce the same P3 Entity Identity and canonical facts. Changing Universe Identity must change the Entity Identity.

### INT-P2-P3-002 — normalized system-site boundary

Exercise positive and negative Sector boundaries around local site `0`/`511`. The physical System stable key and canonical Address must be based on normalized absolute site coordinates and must not reset/reroll because a computational Sector boundary was crossed.

### INT-P2-P3-003 — unrelated-query invariance

Query order, Worker count, renderer/LOD metadata and unrelated domain properties must not change P3 canonical facts.

## P2 -> P4

### INT-P2-P4-001 — wrong-universe references fail closed

An event/archive/checkpoint whose universe commitment does not match the target P2 Universe Identity must be rejected before canonical mutation.

### INT-P2-P4-002 — canonical bytes remain P2 authority

P4 event/checkpoint/archive encodings must round-trip through P2 canonical bytes without a phase-local serialization authority.

## P3 -> P4

### INT-P3-P4-001 — astronomy identity is referenced, not redefined

A P3 entity can be the target/reference of P4 history. P4 event acceptance/replay must preserve the exact P3 Entity Identity and must not construct a temporal replacement identity.

### INT-P3-P4-002 — P3 baseline + P4 history replay stability

Given a P3 canonical baseline and an accepted P4 history, direct replay, Worker replay and checkpoint+tail replay must yield the same canonical mutable-state digest.

## P3 -> P5

### INT-P3-P5-001 — authoritative input preservation

The P3 -> P5 adapter preserves `planetId`, host/system relations, orbit facts and committed planet mass exactly. P5 must not reroll these fields.

### INT-P3-P5-002 — composition refinement compatibility

P5 detailed composition must satisfy the declared mapping from the P3 coarse bulk/formation prior. An incompatible refinement fails closed or requires an explicit model/schema migration.

### INT-P3-P5-003 — physical-radius ownership

P3 schema v1 must not publish a competing canonical physical radius if P5 owns radius. If P3 deliberately freezes radius instead, the test inverts: P5 output must use the P3 radius as a hard constraint. Exactly one authority is permitted.

### INT-P3-P5-004 — incident-energy ownership

P5 consumes P3 canonical insolation. A P3 reference-equilibrium-temperature proxy, if retained, must remain semantically distinct from P5 albedo-dependent energy/climate state.

## P4 -> P5

### INT-P4-P5-001 — no private planetary clock

A canonical P5 planetary transition receives P4 canonical time/event context. Changing a P5-local diagnostic/query clock must not change persistent world state.

### INT-P4-P5-002 — replayed planetary evolution

Same P3 planetary baseline + same P4 canonical history + same versioned P5 transition contract must yield the same P5 persistent state across direct replay, Worker replay and checkpoint+tail replay.

## P2 -> P3 -> P4

### INT-P2-P3-P4-001 — end-to-end canonical digest

Same Universe Identity + canonical P3 baseline + accepted P4 history must produce the same final digest regardless of query order, replay path, Worker scheduling or checkpoint placement.

## P4 compaction metamorphics

### INT-P4-COMPACT-001 — live frontier legality invariance

A live event whose total order is not strictly after the current canonical frontier must be rejected both before and after compaction. Historical reconstruction is a separate API/semantic mode.

### INT-P4-COMPACT-002 — bounded-tail continued mutation

After prefix compaction, commit at least one tail-budget cycle from `verified checkpoint + bounded tail`, recompact, continue committing, and prove equality with a reference full-history reconstruction while the retained live working set stays bounded.

### INT-P4-REDUCER-001 — reducer-contract mismatch fails closed

Replay the same event bytes with a registry whose semantic reducer contract ID/version does not match the world/checkpoint/archive commitment. Canonical replay must reject rather than silently produce a different state.

## P5 terrain research properties

These are promotion gates for terrain semantics, not blockers for continued research.

### INT-P5-TERRAIN-001 — neighboring-patch seam continuity

Shared boundary samples for adjacent patches must agree within the declared exact/tolerance contract, including cube/spherical face transitions.

### INT-P5-TERRAIN-002 — spherical/topological consistency

Surface addresses must have a defined topology. Equivalent geometric boundary/corner locations must not acquire unrelated canonical terrain solely because they are reached through different patch/face paths.

### INT-P5-TERRAIN-003 — parent -> child refinement stability

Refining a parent must preserve the parent's committed macro constraints and shared coarse components. Child generation order must not affect results.

### INT-P5-TERRAIN-004 — REFINE / PROJECT / RECONCILE

`PROJECT(REFINE(parent,...))` must satisfy the parent's declared ocean/relief/basin statistics within explicit tolerances, and `RECONCILE` must report invariant violations deterministically.

## Gate status for cycle 1

No `integration/p3-p4` executable merge branch is created in cycle 1 because P3 has not yet been promoted onto certified `main` and P4 has material semantic blockers. Creating one now would provide low-value conflict evidence while risking accidental authority coupling. The branch should be created as soon as P3 has a stable canonicalization head and P4 closes the replay/compaction/reducer blockers.
