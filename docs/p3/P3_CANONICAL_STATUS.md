# P3 Canonical Status

## Current target

P3 is a **canonical candidate** for the first frozen Universe Skeleton. The authoritative implementation surface is:

- `src/domains/astronomy/p3-canonical.js`
- schema `1`
- model `p3-astronomy-1`
- generator suite `p3-universe-skeleton` version `1`
- baseline epoch `P4_T0`
- normative contract `docs/p3/P3_SCHEMA_V1.md`
- Golden corpus descriptor `tests/vectors/golden-p3-corpus-v1.json`
- conformance entrypoint `tests/p3/run-p3-conformance.mjs`

`src/domains/astronomy/p3-skeleton.js` is the reviewed deterministic engine retained from the pre-freeze prototype. It is an implementation dependency behind the canonical projection and is not itself a public canonical schema. Files whose names end in `_DRAFT.md` and `PRE_FREEZE_STATUS.md` are retained as design/provenance history and are non-normative wherever they conflict with schema v1.

## Authority boundary

P3 v1 owns sparse astronomical/genesis baseline facts and relationships. P3 deliberately does not own detailed planetary physical radius, composition realization, atmosphere, hydrosphere, climate, terrain, biology, civilization, rendering, or temporal event history.

The canonical P3 -> P5 boundary is `ofu-p3-p5-planetary-input-v1`. The baseline/current-state equation is:

`P3 baseline at P4 T0 + P4 history + versioned domain transition semantics = current world state`.

## Certification gate

P3 may move from canonical candidate to closed only after the same exact source head demonstrates:

1. Foundation, P1 and P2 regression PASS;
2. P3 Node conformance PASS, including compact Golden corpus and independent Python spatial oracle;
3. real browser execution on Linux Chromium/Firefox/WebKit, Windows Chromium and macOS WebKit;
4. deterministic Direct/Worker equivalence and query-order independence;
5. positive/negative physical-site boundary invariants around 0/511 and independent floor-partition oracle agreement;
6. bounded deep lookups and dependency budgets;
7. schema/range/absence validation including present Planet and Moon coverage;
8. statistical/spatial invariants and performance/working-set diagnostics;
9. phase-owned P3 evidence only;
10. fresh adversarial review with no material canonical, identity, random-access, authority-boundary, scientific-contract or cross-runtime defect left open.

A queued, cancelled, stale-head or partially successful workflow is not certification evidence.
