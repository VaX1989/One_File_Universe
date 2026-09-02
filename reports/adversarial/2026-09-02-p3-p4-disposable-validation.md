# P3/P4 Disposable Integration Validation — 2026-09-02

**Status:** EXECUTING / disposable evidence branch only  
**Not a semantic source of truth.**

## Exact reviewed parents

- certified main ancestor: `20f152448013fdb4a2a840e428701e17294ecea0`
- P3 canonical candidate: `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4 semantic-closure candidate: `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- two-parent disposable merge: `3dd2ee8ef093570870f75f24e77c85f33f3790dd`

## Purpose

This branch exists only to execute the cross-phase acceptance equation against real phase code:

```text
same UniverseIdentity
+ same P3 P4_T0 canonical baseline
+ same accepted P4 canonical history
=
same final persistent digest
```

The gate exercises Foundation, P1, P2, P3, P4, P2→P4 authority tests, P3→P4 identity/baseline/replay tests, Worker/order conformance, checkpoint-placement equivalence, repeated bounded-tail compaction, evidence isolation, reproducible build, browser/runtime matrix and working-set diagnostics.

No result from this branch changes the owning P3 or P4 contracts. Any later phase head invalidates this exact-pin validation and requires a new disposable combination.
