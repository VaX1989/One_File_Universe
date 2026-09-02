# Independent Integration Board — Cycle 3 — 2026-09-02

## Scope

Live rebaseline, P3 canonicalization review, P4 semantic-closure adversarial review, P5 promotion-prep compatibility review, real P3/P4 disposable integration and duplicate-authority audit.

## Live reviewed sources

- `main@20f152448013fdb4a2a840e428701e17294ecea0`
- P3 reviewed/certified candidate `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4 reviewed/certified candidate `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- P5 reviewed research head `978c807a628f61b0923d5f9a73dd80df850cdb41`
- disposable P3/P4 validation head `e9b6240611a0e8bc1e08de623eeb1a3484eea03b`

## P3

P3 moved from prototype-only status to a current-main canonical candidate. The board independently verified:

- normalized System stable identity/address across positive and negative sector boundaries;
- schema v1 / model `p3-astronomy-1`;
- explicit `P4_T0` baseline semantics and baseline-prefixed mutable-capable facts;
- removal of competing P3 physical planet/moon radius authority;
- `bulkPriorClass` as coarse upstream prior;
- normative integer units/ranges;
- frozen Golden P3 corpus and manifest hash;
- independent spatial oracle, statistical/spatial properties, query/order/Worker invariance and performance diagnostics;
- real Playwright browser execution rather than Node mislabeled as browser evidence.

Exact-head runs at `0699390…`: Foundation `33635600975` SUCCESS, P1 `33635600939` SUCCESS, P2 `33635600848` SUCCESS, P3 `33635600822` SUCCESS including Linux Chromium/Firefox/WebKit, Windows Chromium and macOS WebKit.

Board classification: **READY FOR CONFORMANCE**.

## P4

The three original material temporal blockers were substantively closed:

1. strict monotonic live frontier;
2. repeated verified checkpoint + bounded-tail mutation/recompaction;
3. persisted transition/reducer semantic contract descriptor with fail-closed mismatch.

During current-main certification the board reproduced a new archive-v2 defect: P2 CBV correctly decodes integers as BigInt while `compactionPolicy()` accepted only JS Number, so P4 could not import its own exported archive. This was routed on PR #9 and fixed in `706ecd086300ef47c1cca7a1deeaf2ee56ca9aa2` with representation-aware safe-integer normalization rather than weakening P2 or archive integrity.

Exact P4 head `19f30ad…` subsequently passed Foundation `33635390710`, P1 `33635390951`, P2 `33635390889` and P4 `33635390892`, including Linux Chromium/Firefox/WebKit, Windows Chromium, macOS WebKit, P4 evidence aggregate, semantic-closure tests, archive/lineage, checkpoint authority, P2→P4 contract tests and evidence isolation.

No original P4 blocker remains open at this reviewed head.

## P3/P4 disposable integration

Exact feature SHAs were pinned without rewriting either owner branch. PR #18 combined:

- P4 parent `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- P3 parent `0699390756352ceac65e5d51cc89b910c0ac54e5`

into disposable merge `3dd2ee8ef093570870f75f24e77c85f33f3790dd`.

The board added only validation infrastructure on `integration/p3-p4`:

- `tests/integration/p3-p4-contract-tests.mjs`
- `.github/workflows/p3-p4-integration.yml`

The real integration test resolves a real P3 planet and canonical baseline, uses the P2 UniverseIdentity, targets the exact P3 EntityIdentity with real P4 events, and proves:

- unrelated P3 query order does not alter baseline bytes;
- shuffled P4 event delivery yields the same final state digest;
- multiple checkpoint placements yield the same digest;
- repeated live bounded-tail compaction yields the same digest as full-history replay;
- the P3 baseline remains byte-identical after P4 mutation;
- P4 state is addressed by the exact P3 EntityIdentity.

Exact disposable run `33637549852` at `e9b6240611a0e8bc1e08de623eeb1a3484eea03b`: **SUCCESS**.

Passed jobs:

- Node combined: Foundation, P1, P2, P3 Worker/order conformance, independent P3 spatial oracle, P3 working set, P4 replay/semantic closure/archive/checkpoint, P2→P4, P3→P4, P4 benchmark, evidence isolation and reproducible build;
- Linux Chromium combined P3+P4;
- Linux Firefox combined P3+P4;
- Linux WebKit combined P3+P4;
- Windows Chromium combined P3+P4;
- macOS WebKit combined P3+P4.

For the exact pinned candidates, the target equation is therefore executable and green:

```text
same UniverseIdentity
+ same canonical P3 P4_T0 baseline
+ same accepted P4 canonical history
=
same final persistent digest
```

independent of tested query/order/Worker/replay/checkpoint/compaction variation.

## P5 research

P5 made useful promotion-prep progress without becoming canonical authority: numeric-promotion draft, climate tier-2, terrain topology, P4 transition draft and promotion-prep tests. The P4 transition draft explicitly owns no private clock/event log.

One non-blocking research compatibility defect was found and routed to Issue #12: current P5 adapter requires legacy `ofu-p3-p5-planetary-input-snapshot-v0` and unprefixed fields, while live P3 v1 publishes `ofu-p3-p5-planetary-input-v1` with `P4_T0` baseline-prefixed fields. P5 must adapt to the real v1 producer before promotion; it must not preserve a parallel v0 truth as canonical authority.

This mismatch does **not** block continued P5 research or P3/P4 convergence.

## Duplicate-authority audit

At the reviewed heads:

- no second serializer/hash/EntityIdentity authority was found in P3/P4/P5;
- P4 continues to use P2 canonical bytes and identity commitments;
- P3 owns baseline astronomy but not mutable current state;
- P5 research does not own a private canonical clock/replay log;
- P3 physical radius authority is absent under the selected P5 ownership split;
- P5 research consumes/routs upstream orbit/insolation/baseline mass rather than intentionally rerolling them;
- terrain patches/LOD remain research derivations, not upstream identity authority;
- generic shared evidence contamination remains structurally prevented on main.

## Governance

`main` remains unprotected. Issue #7 therefore remains a governance/repository-enforcement gap. It does not invalidate the exact-head technical evidence above, but required checks should still be enabled when repository settings permit.

## Cycle-3 convergence conclusion

No known material cross-phase defect remains for the exact reviewed P2/P3/P4 integration foundation. The remaining P5 adapter mismatch is explicitly research/promotion-prep work, not a canonical convergence blocker.

Next-wave research may open under the established authority rules:

- Rendering / Scale Navigation / Product research may proceed provided camera/LOD/cache/rendering never become canonical inputs or fact authorities.
- P6 Biosphere / Evolution research may proceed research-only, consuming P3/P5 snapshots and P4 time/history rather than introducing private clocks, identity systems or persistence truth.
