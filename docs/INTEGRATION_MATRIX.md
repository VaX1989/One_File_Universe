# One File Universe Integration Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Role:** living current contract registry; historical cycle observations belong in `reports/adversarial/**`.  
**Authority rule:** this matrix coordinates ownership and compatibility but does not replace owning phase specifications.

## State vocabulary

- **FROZEN** — irreversible upstream contract. Downstream phases consume it; changes require a reproduced protocol defect and explicit re-certification.
- **STABLE_SNAPSHOT** — cross-phase interface stable enough for parallel consumers, but not a phase freeze. Incompatible change requires coordinated versioning.
- **RESEARCH** — exploratory model/interface; not canonical authority.

## Canonical contract registry

| Contract | Owner | Consumers | Version / ID | State | Canonical decision |
| --- | --- | --- | --- | --- | --- |
| OFU-CBV-1 canonical bytes | P2 | all phases | `OFU-CBV-1` | FROZEN | Sole canonical serialization authority. |
| Unicode profile | P2 | all phases | `ofu-unicode-15.1.0-v1` | FROZEN | No downstream normalization/repertoire substitution. |
| Universe Identity | P2 | P3+ | P2 v1 | FROZEN | Universe-scoped identity authority. |
| Canonical Entity Identity | P2 | P3+ | P2 v1 | FROZEN | Domain phases provide stable keys; no second Entity ID system. |
| Canonical Address / derivation / numeric authority | P2 | P3+ | P2 v1 | FROZEN | Downstream semantics bind through P2 manifest/address/derivation contracts. |
| P3 Astronomy Facts schema | P3 | P4/P5+ | schema v1 / `p3-astronomy-1` | FROZEN | Sparse astronomical baseline at `P4_T0`; canonical Region/Galaxy/Sector/System/Star/Planet/Moon facts. |
| Baseline vs mutable authority | P3 + P4 boundary | P5+ | `baseline-mutable-authority-v1` | FROZEN | P3 procedural baseline + accepted P4 history = current persistent world. |
| P4 Temporal Contract | P4 | P5/P6/P7+ | `ofu-p4-temporal-v1` | FROZEN | P4 owns canonical time/order/replay/checkpoint/compaction/lineage/archive semantics. |
| P4 core transition contract | P4 | diagnostics / later domain reducers | `ofu.p4.core-transition@1.0.0` | FROZEN | Version-bound core diagnostic transitions; downstream physical semantics remain phase-owned. |
| P3 → P5 planetary input | P3 facts / P5 realization | P5 | current P3 schema v1 boundary | STABLE_SNAPSHOT | Baseline identity/mass/orbit facts are consumed, never rerolled. |
| P5 Planet Physical Contract | P5 | P6+ | research | RESEARCH | Detailed composition/radius/interior/atmosphere/climate/terrain remain non-canonical research. |

## Canonical P1–P4 authority

```text
P2 deterministic authority
        ↓
P3 procedural universe at P4 T0
        +
P4 canonical mutable history
        ↓
Current persistent OFU world
```

Rendering, DOM order, camera state, animation timing, display formatting and caches are presentation only and MUST NOT affect canonical results.

## Canonical promotion record

| Track | Certified candidate | Canonical merge | Result |
| --- | --- | --- | --- |
| P3 | `0699390756352ceac65e5d51cc89b910c0ac54e5` | `048c7b4de978d8c4e43b777d2eeb1b10db687506` | COMPLETE |
| P4 | `4710a385d6dc933cb0c5709d68dcc5f8f7dec6ec` | `607affb5ac4ac031cec63790c83d69f6b51c6d7c` | COMPLETE |
| P1–P4 one-file baseline | `88ec5856740ca514bced02238b75d32565f23071` | `a63575465a737b4b926e9651a2af91b177c0b35b` | CERTIFIED ON MERGED MAIN |
| P5 research | `research/p5-planetology` | not promoted | RESEARCH — PROMOTION ARCHITECTURE READY |

Merged-main P1–P4 baseline workflow `33644437847` passed Foundation/P1/P2/P3/P4 regressions, P2→P4 and executable P3→P4 integration, evidence isolation, byte-for-byte repeat build, and the shipped `file://` user journey on Linux Chromium/Firefox/WebKit, Windows Chromium and macOS ARM64 WebKit. Real Safari/iOS remains NOT_VERIFIED; Playwright WebKit is WebKit evidence only.

## P3 → P4 executable invariant seal

The durable test `tests/integration/p3-p4-contract-tests.mjs` proves that:

```text
same UniverseIdentity
+ same P3 T0 baseline
+ same accepted P4 history
=
same current persistent digest
```

independent of tested query order, shuffled historical delivery/replay path and checkpoint placement, while repeated deterministic compaction preserves the same final digest and never rewrites P3 baseline authority.

Certified integrated evidence:

- Universe Identity: `ce22bd098b1b12cf4558967542f9652c4a2a01835984769861dd0c1c1b2f6a37`
- representative Planet Entity ID: `29adb194e0a8231fd0b35e81f3160324c2388d3deb74d3efca58885a14e09636`
- P3 baseline digest: `9967557805b932a1d8a1dcc2cf76d96443be56410708c37cc98ce4c8c101b17d`
- final P4 mutable digest: `aefec9fa7f4ccac898ea2ec2efeb8f94f75674d73462a1327a8651aa4dd3037e`
- repeated compactions exercised: `2`
- retained tail: `2`
- checkpoint covered event count: `4`

## Superseded Cycle-3 registry

PR #19 was intentionally closed unmerged because canonical P3/P4 promotion would have made its registry snapshot stale immediately. Its valid evidence is preserved here:

- P3 candidate `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4 pre-realignment candidate `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- disposable integration `e9b6240611a0e8bc1e08de623eeb1a3484eea03b`
- workflow `33637549852` — SUCCESS

There is one living registry: this file.
