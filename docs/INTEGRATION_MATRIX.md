# One File Universe Integration Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Role:** living current contract registry; historical cycle observations belong in `reports/adversarial/**`.  
**Authority rule:** this matrix coordinates ownership and compatibility but does not replace owning phase specifications. `main` is authoritative; prospective registry text on an unmerged candidate branch has no canonical force until that branch is merged and exact-main evidence passes.

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
| P3 → P5 planetary input | P3 facts / P5 realization | P5 | `ofu-p3-p5-planetary-input-v1` / schema v1 / `P4_T0` | FROZEN | P3 byte identities and baseline mass/orbit/insolation/bulk-prior facts are consumed exactly and never rerolled. Historical v0 is superseded. |
| P5 Planet Physical Contract | P5 | P6+ | schema v1 / `ofu-p5-planet-physical-v1` / `p5-planet-physical-1` | FROZEN | Canonical v1 is intentionally bounded: 1–8 Mearth `TERRESTRIAL` realization only; unsupported families fail explicitly. |
| P5 Terrain Topology | P5 | rendering / P6+ | `p5-cube-sphere-topology-1` | FROZEN | Exact P2-addressed cube-sphere patch/vertex identity, seams and refinement topology; no global heightmap and no renderer/GPU authority. |
| P5 → P6 environmental boundary | P5 | P6 | `ofu-p5-p6-environment-v1` | STABLE_SNAPSHOT | Exposes only promoted environmental constraints; unsupported atmosphere/climate/water/geology fields remain explicit rather than invented. |

## Canonical P1–P5 authority

```text
P2 deterministic authority
        ↓
P3 procedural astronomical baseline at P4 T0
        +
P4 accepted canonical history
        +
versioned P5-owned physical realization / future transition semantics
        ↓
Current persistent OFU world
```

P5 v1 currently promotes static planetary genesis facts only. No mutable P5 transition contract is promoted because no defensible mutable P5 state is part of v1; P4 remains the sole clock/order/replay/checkpoint/compaction/lineage/archive authority.

Rendering, DOM order, camera state, animation timing, display formatting, presentation `Number` views and caches are presentation only and MUST NOT affect canonical results.

## Canonical promotion record

| Track | Certified candidate | Canonical merge | Result |
| --- | --- | --- | --- |
| P3 | `0699390756352ceac65e5d51cc89b910c0ac54e5` | `048c7b4de978d8c4e43b777d2eeb1b10db687506` | COMPLETE |
| P4 | `4710a385d6dc933cb0c5709d68dcc5f8f7dec6ec` | `607affb5ac4ac031cec63790c83d69f6b51c6d7c` | COMPLETE |
| P1–P4 one-file baseline | `88ec5856740ca514bced02238b75d32565f23071` | `a63575465a737b4b926e9651a2af91b177c0b35b` | CERTIFIED ON MERGED MAIN |
| P5 v1 controlled promotion | PR #25 / `golden-p5-corpus-v1` | merge history + exact-main P5 seal are authoritative | COMPLETE ONLY AFTER MERGE + EXACT-MAIN PASS |
| P5 advanced atmosphere/climate/giant/geodynamics research | `research/p5-planetology` and successors | not promoted | RESEARCH / DEFERRED |

The P5 v1 Golden physical digest is `402267561fb311c16f68380afdf066df883eba62b8053d6470401d2eebd86d52`. The shipped cross-runtime vector is physical digest `7532cf9a6d2258031bc3f29f76c8614ea75973367fbe3aaae7a7652755169bc7` and terrain digest `8e96317fa3a1d712b35ef24b9cd9981fb74f0e98145b9472cc823b5d6ffd7b34`. These values are only canonical after the corresponding candidate is merged and exact-main evidence succeeds.

The P1–P4 reference release `v0.4.0-preview.1` remains unchanged. P5 promotion does not retroactively redefine that release.

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

## P3 → P5 and P4 → P5 invariant seal

P5 promotion conformance invokes the real P3 `planetaryInputSnapshot()` producer and requires `ofu-p3-p5-planetary-input-v1`, `p3SchemaVersion === 1n` and `baselineEpoch === P4_T0`. It rejects historical v0 input and proves exact preservation of P3-owned byte identities and `BigInt` baseline values.

P5 static-genesis integration then embeds the promoted P5 genesis under P4 and proves full replay == checkpoint replay == repeated-compaction replay while P5 genesis digest is unchanged. The test deliberately does not invent a private P5 clock or mutable transition.

Terrain conformance proves exact same-face and cross-face seams, eight cube corners, direct random access, refinement-order independence, `PROJECT(REFINE(parent))`, deterministic `RECONCILE`, bounded per-operation materialization and no global planet heightmap.

## Superseded Cycle-3 registry

PR #19 was intentionally closed unmerged because canonical P3/P4 promotion would have made its registry snapshot stale immediately. Its valid evidence is preserved here:

- P3 candidate `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4 pre-realignment candidate `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- disposable integration `e9b6240611a0e8bc1e08de623eeb1a3484eea03b`
- workflow `33637549852` — SUCCESS

There is one living registry: this file.
