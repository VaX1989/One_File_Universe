# One File Universe Integration Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Role:** living current contract registry; historical cycle observations belong in `reports/adversarial/**`.  
**Authority rule:** this matrix coordinates ownership and compatibility but never replaces owning phase specifications or implementations.

## State vocabulary

- **FROZEN** — irreversible upstream contract; change requires reproduced protocol defect and explicit re-certification.
- **STABLE_SNAPSHOT** — cross-phase boundary stable enough for parallel consumers; incompatible change requires coordinated versioning.
- **PROPOSED** — candidate semantics/implementation exist but the owning phase is not frozen on `main`.
- **RESEARCH** — exploratory model/interface; not canonical authority.

## Contract registry

| Contract | Owner | Consumers | Version / ID | State | Current compatibility decision | Reviewed head |
| --- | --- | --- | --- | --- | --- | --- |
| OFU-CBV-1 canonical bytes | P2 | all phases | `OFU-CBV-1` | FROZEN | Sole canonical serialization authority. | `main@20f152448013fdb4a2a840e428701e17294ecea0` |
| Unicode profile | P2 | all phases | `ofu-unicode-15.1.0-v1` | FROZEN | No downstream normalization/repertoire substitute. | same |
| Universe Identity | P2 | P3+ | P2 v1 | FROZEN | Universe-scoped authority. | same |
| Canonical Entity Identity | P2 | P3+ | P2 v1 | FROZEN | Domain phases define stable keys; no second Entity ID system. | same |
| Canonical Address / derivation / integer authority | P2 | P3+ | P2 v1 | FROZEN | Downstream domains bind semantics through P2 manifest/address/derivation contracts. | same |
| Phase-owned conformance evidence | Integration Board + phase CI owner | all phases | `phase-evidence-architecture-v1` | STABLE_SNAPSHOT | Main uses explicit P2 scope, owned artifact membership, recursive evidence preservation and foreign-phase fail-closed regression. | `main@20f152448013fdb4a2a840e428701e17294ecea0` |
| Baseline vs mutable authority | Integration boundary; domain owners remain authoritative | P3/P4/P5+ | `baseline-mutable-authority-v1-snapshot` | STABLE_SNAPSHOT | `procedural baseline + P4 canonical history + versioned domain transitions = current persistent world`. | P3 `0699390…`; P4 `19f30ad…`; P5 `978c807…` |
| P3 Astronomy Facts schema | P3 | P4, P5, later domains | schema `1`, model `p3-astronomy-1`, epoch `P4_T0` | PROPOSED | Current-main candidate; normalized identity, baseline/current distinction, normative units/ranges, Golden corpus and cross-runtime evidence verified. | `0699390756352ceac65e5d51cc89b910c0ac54e5` |
| P3 normalized physical system-site identity | P3 under P2 identity | P4, P5 | P3 v1 | STABLE_SNAPSHOT | Stable key/Address use absolute site `sector*512+localSite`; Sector is computational partition only. | `0699390…` |
| P3 → P5 Planetary Input | P3 facts / P5 realization | P5 | `ofu-p3-p5-planetary-input-v1` | PROPOSED | Producer is coherent and baseline-prefixed. P5 research adapter is still on legacy v0 and must consume v1 before promotion. No duplicate truth is permitted. | P3 `0699390…`; P5 `978c807…` |
| P4 Temporal Contract | P4 | P5, P6, P7+ | `ofu-p4-temporal-v1` | PROPOSED | Monotonic live frontier, repeated checkpoint+bounded-tail mutation and transition-contract binding are implemented and exact-head certified. Archive v2 Number/BigInt round-trip defect was reproduced and fixed. | `19f30ad545bb5e31693631bb2575b5bfadd33ed8` |
| P4 → downstream transition ownership | P4 time/replay + owning domain transition contract | P5+ | exact versioned descriptor boundary | STABLE_SNAPSHOT | P4 owns clock/order/admission/replay/checkpoint/lineage; domain phases own transition physics/semantics. Runtime reducer identity alone is never canonical authority. | `19f30ad…` |
| P5 Planet Physical Contract | P5 | P6+ | research v0.x | RESEARCH | P3 adapter/numeric promotion/climate/terrain/transition research may advance independently; no private clock/history and no reroll of P3 facts. | `978c807a628f61b0923d5f9a73dd80df850cdb41` |

## Current authority boundaries

### P3 — procedural/genesis baseline

P3 owns astronomical identity and deterministic `P4_T0` baseline/reference facts: host/system relationships, baseline stellar state, orbital architecture, baseline planet mass, insolation and coarse `bulkPriorClass`. Fields capable of later evolution are explicitly baseline-prefixed. P3 does not own current mutable state or detailed planet radius/climate/terrain.

### P4 — canonical mutable history

P4 owns Universe-Genesis canonical time, total event order, live admission frontier, replay, verified checkpoints, bounded-tail compaction, lineage and the semantic transition-contract binding mechanism. It does not own astronomy or planetary transition physics.

### P5 — detailed planetary realization

P5 owns detailed composition, physical radius, interior/geodynamics, atmosphere, hydrosphere, climate and terrain. Persistent evolution must consume P4 time/history plus a versioned P5 transition contract. Current P5 remains RESEARCH.

## Current exact heads and board classification

| Track | Ref | Head | Board status |
| --- | --- | --- | --- |
| P2 / integration main | `main` | `20f152448013fdb4a2a840e428701e17294ecea0` | FROZEN / CLOSED; generic evidence isolation is a main property |
| P3 canonical candidate | `feature/p3-universe-skeleton` | `0699390756352ceac65e5d51cc89b910c0ac54e5` | **READY FOR CONFORMANCE**; exact-head Foundation/P1/P2/P3 and browser/platform matrix PASS |
| P4 temporal candidate | `feature/p4-temporal-kernel` | `19f30ad545bb5e31693631bb2575b5bfadd33ed8` | semantic blockers CLOSED; exact-head Foundation/P1/P2/P4 and browser/platform aggregate PASS |
| P5 research | `research/p5-planetology` | `978c807a628f61b0923d5f9a73dd80df850cdb41` | CONTINUE RESEARCH; live P3 v1 adapter reconciliation required before promotion |
| Disposable P3/P4 validation | `integration/p3-p4` | `e9b6240611a0e8bc1e08de623eeb1a3484eea03b` | **PASS** for exact pinned P3/P4 candidates; Actions run `33637549852` |

Exact heads are observations, not permanent phase pins. A later feature head invalidates only the corresponding exact-pin evidence and requires revalidation; it does not rewrite historical reports.

## Executable cross-phase evidence

- **P2→P3:** P3 exact-head conformance verifies Universe-scoped identity, normalized positive/negative sector boundaries, unrelated-query invariance, Worker/order independence and frozen Golden corpus.
- **P2→P4:** `tests/integration/p2-p4-contract-tests.mjs` verifies wrong-Universe fail-closed and P2 canonical-byte authority for archives.
- **P3→P4:** disposable `tests/integration/p3-p4-contract-tests.mjs` uses real P2/P3/P4 code and proves the same P3 baseline/EntityIdentity plus the same P4 history yields the same state digest under shuffled delivery, multiple checkpoint placements and repeated bounded-tail compaction; P4 never rewrites the P3 baseline.
- **P4 semantic closure:** live frontier, repeated compaction and transition-contract mismatch tests are executable and green.
- **Evidence isolation:** generic foreign-phase injection is rejected; explicit phase artifact ownership remains intact on the combined tree.
- **Combined runtime gate:** run `33637549852` passed Node combined, Linux Chromium/Firefox/WebKit, Windows Chromium and macOS WebKit, plus reproducible build and working-set diagnostics.

## Remaining non-blocking research compatibility item

P5 `p3-snapshot-adapter.mjs` at reviewed head consumes legacy `ofu-p3-p5-planetary-input-snapshot-v0` with unprefixed fields, while live P3 publishes `ofu-p3-p5-planetary-input-v1` with `P4_T0` baseline-prefixed fields. This is mandatory promotion-prep work for P5 but is **not** a cross-phase convergence blocker while P5 remains RESEARCH.

## Disposable branch rule

`integration/p3-p4` is evidence infrastructure only. It must never become an implementation authority or be retargeted to `main` as a substitute for the independent P3/P4 promotion decisions. Later exact heads require a fresh disposable combination.