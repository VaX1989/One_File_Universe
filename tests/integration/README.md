# Cross-Phase Integration Tests

**Owner:** Independent Architecture, Contract & Integration Board  
**Status:** living acceptance/execution matrix. Tests requiring unmerged feature code run on exact phase heads or disposable exact-SHA combinations; `main` never pretends an unmerged phase is canonical.

## Execution policy

1. Rebaseline live phase heads.
2. Require material phase blockers closed before claiming phase-to-phase integration readiness.
3. Pin exact reviewed SHAs.
4. Combine them only on disposable validation infrastructure when multiple unmerged phases are required.
5. Run frozen-upstream regression plus the applicable real cross-phase tests.
6. Record exact sources/results in immutable reports and this living status matrix.
7. Never promote the disposable branch as a semantic authority.

## Current Cycle-3 execution pin

- P3: `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4: `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- disposable combined validation: `integration/p3-p4@e9b6240611a0e8bc1e08de623eeb1a3484eea03b`
- GitHub Actions: `P3-P4 Disposable Integration` run `33637549852` — **SUCCESS**

## Phase evidence isolation

| Test | Assertion | Status |
| --- | --- | --- |
| EVIDENCE-ISO-001 | Downstream evidence cannot enter a P2 artifact merely because downstream tests exist. | **EXECUTABLE / VERIFIED** on main and combined tree. |
| EVIDENCE-ISO-002 | Injected foreign-phase evidence inside P2-owned aggregate input is rejected. | **EXECUTABLE / VERIFIED** using synthetic `phase:P99`. |
| EVIDENCE-ISO-003 | Extending repository tests does not change phase-specific P2 execution/output scope. | **EXECUTABLE / VERIFIED**; P2 workflow is explicit, not generic `npm test`. |
| EVIDENCE-ISO-004 | Exact-source SHA mismatch is rejected by owning evidence aggregation. | Existing fail-closed phase property; retain in phase aggregators. |

## P2 → P3

### INT-P2-P3-001 — Universe-scoped astronomy identity

Same P2 Universe Identity + same canonical astronomical stable key produces the same P3 Entity Identity/facts; changing the Universe changes identity.

**Status:** **EXECUTABLE / VERIFIED** through P3 canonical conformance at exact head `0699390…`.

### INT-P2-P3-002 — normalized system-site boundary

Positive and negative Sector boundaries around local site `0/511` preserve physical System stable key/Address under normalized absolute site coordinates.

**Status:** **EXECUTABLE / VERIFIED**; P3 tests include the `[-1,0,511,512]` boundary metamorphic.

### INT-P2-P3-003 — unrelated-query / Worker invariance

Query order, Worker scheduling/count and unrelated requests must not change P3 canonical facts.

**Status:** **EXECUTABLE / VERIFIED** on Node and declared browser/platform matrix.

## P2 → P4

### INT-P2-P4-001 — wrong-Universe fail closed

Event/archive/checkpoint Universe commitments must match the target P2 Universe Identity.

**Status:** **EXECUTABLE / VERIFIED** in `tests/integration/p2-p4-contract-tests.mjs`.

### INT-P2-P4-002 — canonical bytes remain P2 authority

P4 portable archive bytes round-trip through P2 decode/encode and P4 import/export without a private serializer.

**Status:** **EXECUTABLE / VERIFIED**. Archive v2 persisted-policy Number/BigInt boundary regression was additionally reproduced and fixed on P4 before integration validation.

## P3 → P4

### INT-P3-P4-001 — astronomy identity referenced, not redefined

P4 targets the exact P3 EntityIdentity and overlays mutation without constructing a temporal replacement identity or rewriting the P3 baseline.

**Status:** **EXECUTABLE / VERIFIED** in disposable `tests/integration/p3-p4-contract-tests.mjs`.

### INT-P3-P4-002 — baseline + history replay stability

Same P3 baseline + same accepted P4 history yields the same final persistent digest under delivery reordering, checkpoint placement and repeated bounded-tail compaction.

**Status:** **EXECUTABLE / VERIFIED** on disposable combined run `33637549852`. P3 Worker/order invariants execute in the same exact combined tree.

## P3 → P5

### INT-P3-P5-001 — authoritative input preservation

The adapter must preserve live P3 v1 `planetId`, system/host identity, orbit, P4_T0 baseline stellar values, baseline planet mass, insolation and `bulkPriorClass` without reroll.

**Status:** **PROMOTION-PREP REQUIRED / RESEARCH NON-BLOCKING**. P5 reviewed adapter is still keyed to legacy v0 while live P3 producer is `ofu-p3-p5-planetary-input-v1`.

### INT-P3-P5-002 — composition refinement compatibility

Detailed P5 composition must remain a declared refinement of the P3 coarse bulk prior; incompatible persistent interpretation requires explicit versioning/migration.

**Status:** RESEARCH promotion gate.

### INT-P3-P5-003 — physical-radius ownership

P3 v1 must not publish a competing canonical physical radius while P5 owns radius.

**Status:** **VERIFIED at P3 v1 boundary**; P3 removed canonical planet/moon physical radius authority.

### INT-P3-P5-004 — incident-energy ownership

P5 consumes P3 baseline/reference insolation and derives current incident energy from current star/orbit state rather than persisting a second independent upstream truth.

**Status:** research boundary accepted; future P5 transition conformance required before promotion.

## P4 → P5

### INT-P4-P5-001 — no private planetary clock

P5 transitions consume P4 canonical intervals/context; browser Date/frame time/private order must never alter persistent state.

**Status:** research draft explicitly preserves P4 clock/replay authority; promotion test still required.

### INT-P4-P5-002 — replayed planetary evolution

Same P3 planetary baseline + same P4 history + same versioned P5 transition contract must replay identically across direct/Worker/checkpoint paths.

**Status:** waiting for a promotable P5 transition contract; not a blocker to research.

## P2 → P3 → P4

### INT-P2-P3-P4-001 — end-to-end canonical digest

Same UniverseIdentity + canonical P3 P4_T0 baseline + accepted P4 history must produce the same final digest regardless of query order, delivery/replay path, Worker scheduling and checkpoint placement.

**Status:** **EXECUTABLE / VERIFIED** for the Cycle-3 exact pins. The real combined test consumes P2/P3/P4 implementation code; it is not a mock oracle.

## P4 compaction / transition authority

| Test | Assertion | Status |
| --- | --- | --- |
| INT-P4-COMPACT-001 | Live frontier legality is invariant before/after compaction. | **EXECUTABLE / VERIFIED**. |
| INT-P4-COMPACT-002 | Repeated checkpoint+bounded-tail mutation/recompaction equals full history while tail stays bounded. | **EXECUTABLE / VERIFIED**, including combined P3 baseline. |
| INT-P4-REDUCER-001 | Persisted transition-contract mismatch fails closed. | **EXECUTABLE / VERIFIED**. |

## P5 terrain research properties

These remain promotion gates, not blockers to continued research.

| Test | Research requirement | Current status |
| --- | --- | --- |
| INT-P5-TERRAIN-001 | neighboring-patch and cross-face seam continuity | research implementation/tests present |
| INT-P5-TERRAIN-002 | cube-sphere face/corner topological consistency | research implementation/tests present |
| INT-P5-TERRAIN-003 | parent→child refinement stability/order independence | research implementation/tests present |
| INT-P5-TERRAIN-004 | deterministic PROJECT / REFINE / RECONCILE invariants | research implementation/tests present |

Research success does not freeze P5 terrain numerics, physical validity domains or persistence semantics.