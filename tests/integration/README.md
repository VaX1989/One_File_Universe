# Cross-Phase Integration Tests

**Owner:** Independent Architecture, Contract & Integration Board  
**Status:** living acceptance/execution matrix. Tests that require unmerged phase code execute on exact phase/integration heads; `main` never pretends an unmerged feature is canonical.

## Execution policy

1. Rebaseline live phase heads.
2. Require each phase's own material blockers to be closed before claiming full phase-to-phase integration readiness.
3. Add tests directly to a phase branch when they validate an upstream contract without changing feature semantics, or create a disposable exact-SHA branch when multiple unmerged phases are required.
4. Combine exact reviewed SHAs without changing feature ownership.
5. Run frozen-upstream regression plus the applicable tests below.
6. Record exact source SHAs and results.
7. Disposable combined branches are validation infrastructure, never canonical authority.

## Phase evidence isolation

| Test | Assertion | Current status |
| --- | --- | --- |
| EVIDENCE-ISO-001 | Valid downstream evidence cannot enter a P2 artifact merely because downstream tests exist in the tree. | **EXECUTABLE / VERIFIED** — P2 artifact paths are phase-owned on `main@20f152448013fdb4a2a840e428701e17294ecea0`; P4 uses `dist/evidence/p4/**`. |
| EVIDENCE-ISO-002 | Injected foreign-phase evidence inside a P2-owned aggregate input is rejected. | **EXECUTABLE / VERIFIED** — generic synthetic `phase: P99` regression passes on main; P2 aggregate remains fail-closed. |
| EVIDENCE-ISO-003 | Extending generic `npm test` does not change phase-specific P2 execution/output scope. | **EXECUTABLE / VERIFIED** — P2 workflow executes explicit frozen scope, not generic `npm test`. |
| EVIDENCE-ISO-004 | Exact-source SHA mismatch is rejected by the owning aggregate. | Existing phase conformance property; retain in every phase aggregator. |

## P2 -> P3

### INT-P2-P3-001 — Universe-scoped astronomy identity

Same P2 Universe Identity + same canonical astronomical stable key must produce the same P3 Entity Identity and canonical facts. Changing Universe Identity must change the Entity Identity.

**Status:** WAITING FOR current-main P3 canonicalization head.

### INT-P2-P3-002 — normalized system-site boundary

Exercise positive and negative Sector boundaries around local site `0`/`511`. The physical System stable key and canonical Address must be based on normalized absolute site coordinates and must not reset/reroll because a computational Sector boundary was crossed.

**Status:** prototype architecture reviewed; executable canonical gate waits for P3 feature head.

### INT-P2-P3-003 — unrelated-query invariance

Query order, Worker count, renderer/LOD metadata and unrelated domain properties must not change P3 canonical facts.

**Status:** WAITING FOR P3 feature head.

## P2 -> P4

### INT-P2-P4-001 — wrong-universe references fail closed

An event/archive/checkpoint whose universe commitment does not match the target P2 Universe Identity must be rejected before canonical mutation.

**Status:** **EXECUTABLE / VERIFIED** in `tests/integration/p2-p4-contract-tests.mjs`; pre-merge exact head `68ebf0fd78a759694d151834b469ec919bf4e82b` passed Foundation/P1/P2/P4, merged as P4 head `f189c82f15defddcc4f9468043c3d4df5f85462e`.

### INT-P2-P4-002 — canonical bytes remain P2 authority

P4 event/checkpoint/archive encodings must round-trip through P2 canonical bytes without a phase-local serialization authority.

**Status:** **EXECUTABLE / VERIFIED** in the same real P2/P4 integration test. Archive P2 decode→encode and P4 import→export are byte-identical.

## P3 -> P4

### INT-P3-P4-001 — astronomy identity is referenced, not redefined

A P3 entity can be the target/reference of P4 history. P4 event acceptance/replay must preserve the exact P3 Entity Identity and must not construct a temporal replacement identity.

**Status:** WAITING FOR qualified P3 head and remediated P4 head.

### INT-P3-P4-002 — P3 baseline + P4 history replay stability

Given a P3 canonical baseline and an accepted P4 history, direct replay, Worker replay and checkpoint+tail replay must yield the same canonical mutable-state digest.

**Status:** WAITING FOR qualified heads; blocked from truthful execution by P4 checkpoint-backed mutation defect.

## P3 -> P5

### INT-P3-P5-001 — authoritative input preservation

The P3 -> P5 adapter preserves `planetId`, host/system relations, orbit facts and committed baseline planet mass exactly. P5 must not reroll these fields.

### INT-P3-P5-002 — composition refinement compatibility

P5 detailed composition must satisfy the declared versioned mapping from the P3 coarse bulk/formation prior. An incompatible refinement fails closed or requires an explicit model/schema migration.

### INT-P3-P5-003 — physical-radius ownership

Under the current snapshot, P3 schema v1 must not publish a competing canonical physical radius because P5 owns radius. Re-adjudicating that split requires an explicit contract change before either phase freezes.

### INT-P3-P5-004 — incident-energy ownership

P3 owns baseline/reference astronomical incident-energy inputs. Current incident energy ultimately derives from current canonical stellar/orbital state. A P3 reference-equilibrium-temperature proxy, if retained, remains semantically distinct from P5 albedo-dependent energy/climate state.

**P3→P5 status:** specification-ready; executable adapter tests wait for P3 schema v1/current-main feature head and a corresponding P5 adapter.

## P4 -> P5

### INT-P4-P5-001 — no private planetary clock

A canonical P5 planetary transition receives P4 canonical time/event context. Changing a P5-local diagnostic/query clock must not change persistent world state.

### INT-P4-P5-002 — replayed planetary evolution

Same P3 planetary baseline + same P4 canonical history + same versioned P5 transition contract must yield the same P5 persistent state across direct replay, Worker replay and checkpoint+tail replay.

**Status:** research acceptance criteria; canonical execution waits for P4 integration-ready temporal contract and a promoted P5 transition contract.

## P2 -> P3 -> P4

### INT-P2-P3-P4-001 — end-to-end canonical digest

Same Universe Identity + canonical P3 baseline + accepted P4 history must produce the same final digest regardless of query order, replay path, Worker scheduling or checkpoint placement.

**Status:** DO NOT FAKE. Create disposable `integration/p3-p4` only after both qualifying heads exist.

## P4 compaction metamorphics

### INT-P4-COMPACT-001 — live frontier legality invariance

A live event whose total order is not strictly after the current canonical frontier must be rejected both before and after compaction. Historical reconstruction is a separate API/semantic mode.

**Status:** MATERIAL P4 BLOCKER — not yet implemented.

### INT-P4-COMPACT-002 — bounded-tail continued mutation

After prefix compaction, commit at least one tail-budget cycle from `verified checkpoint + bounded tail`, recompact, continue committing, and prove equality with a reference full-history reconstruction while the retained live working set stays bounded.

**Status:** MATERIAL P4 BLOCKER — not yet implemented.

### INT-P4-REDUCER-001 — reducer-contract mismatch fails closed

Replay the same event bytes with a registry whose semantic reducer contract ID/version does not match the world/checkpoint/archive commitment. Canonical replay must reject rather than silently produce a different state.

**Status:** MATERIAL P4 BLOCKER — not yet implemented.

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

## Current combined-integration gate

No `integration/p3-p4` branch exists yet. That is intentional, not missing work: P3 has no stable current-main canonicalization head, and P4 still has the three material temporal blockers above. Creating a combined branch now would validate historical branch topology rather than qualified canonical semantics.
