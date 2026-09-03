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
| P5 → P6 environmental boundary v1 | P5 | P6 | `ofu-p5-p6-environment-v1` | FROZEN | Historical v1 boundary remains unchanged and explicitly leaves atmosphere/climate/water/geology unsupported. Environment v2 does not backfill it. |
| P5 Environment v2 Semantic Manifest | P5 / P2 validation | P5/P6+ | hash `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f` | FROZEN | Dedicated generator lineage for Environment v2; P5 v1 manifest is not reused as Environment authority. |
| P5 Atmosphere State v2 | P5 | P6+ / future P4-bound reducers | `ofu-p5-atmosphere-state-v2` | FROZEN | Absolute Tg state with exact volatile conservation; genesis policy is `NO_CANONICAL_GENESIS`. |
| P5 → P6 Environment v2 | P5 | P6+ | schema 2 / `ofu-p5-p6-environment-v2` / `p5-environment-2` | FROZEN | Explicit epistemic authority/provenance, deterministic global column pressure and corrected Tier-0 effective-radiative law. Surface temperature, greenhouse, XUV evolution, geology and other deferred domains remain unsupported. |
| P6 Eligibility Witness | P6 | P4-bound P6 guard / rendering | schema 1 / `ofu-p6-environment-eligibility-witness-v1` / `p6-eligibility-semantics-1` | FROZEN | Binds exact P5 Environment v2 provenance and digest, planet, epistemic decision, P6 manifest and Model A policy. Current canonical P5 input remains insufficient. |
| P6 Biological Identity | P6 stable keys / P2 identity | P6+ | `p6-biological-identity-model-a-v1` | FROZEN | Biosphere, lineage and species semantic IDs are P2-verifiable; generator/model revision alone does not redefine identity. No persistent lineage/species lifecycle is promoted in v1. |
| P6 Biological Transition | P6 reducer / P4 execution | P6+ | `ofu.p6.biological-transition@1.0.0` | FROZEN | Genesis guard verifies the full upstream witness, P4 baseline and P2 ID; current canonical input accepts zero biological events. Speciation/extinction are deferred. |
| P6 Semantic Manifest | P6 / P2 validation | P6+ / rendering | `2a3593bad3ce921c4f2f9e4282c64dc8fc3906d9c5863a048d14fa8fe541b0c9` | FROZEN | Exact P5/P4 dependencies, eligibility/witness scope, identity, numeric and semantic-LOD policies. Conformance-only construction is excluded from the shipped runtime. |
| Production rendering projection | Rendering | user-visible preview | `rendering-hierarchical-planet-1` / `rendering-webgl2-1` | STABLE_SNAPSHOT | Presentation-only consumer of P1–P6. Camera, LOD, caches, GPU buffers, frame timing and floats never become canonical inputs. |

## Canonical P1–P6 authority

```text
P2 deterministic authority
        ↓
P3 procedural astronomical baseline at P4 T0
        +
P4 accepted canonical history
        +
versioned P5-owned physical/environment realization
        +
P6 biological semantics where the canonical eligibility witness permits them
        ↓
Current persistent OFU world
```

P5 v1 promotes static planetary genesis facts only. Environment v2 adds atmosphere-state schema and deterministic derived laws but promotes no endogenous atmosphere-loss transition and no private clock. P6 v1 adds a causally bound genesis guard and deterministic biological identity/energy/refinement laws, but frozen P5 Environment v2 currently authorizes no biosphere. P4 remains the sole clock/order/replay/checkpoint/compaction/lineage/archive authority.

Rendering, DOM order, camera state, animation timing, display formatting, presentation `Number` views and caches are presentation only and MUST NOT affect canonical results.
The production projection reports P5 Environment v2 authority and the current
P6 `INSUFFICIENT_ENVIRONMENT` result; it never substitutes conformance fixtures
or visual embellishment for established biology.

## Canonical promotion record

| Track | Certified candidate | Canonical merge | Result |
| --- | --- | --- | --- |
| P3 | `0699390756352ceac65e5d51cc89b910c0ac54e5` | `048c7b4de978d8c4e43b777d2eeb1b10db687506` | COMPLETE |
| P4 | `4710a385d6dc933cb0c5709d68dcc5f8f7dec6ec` | `607affb5ac4ac031cec63790c83d69f6b51c6d7c` | COMPLETE |
| P1–P4 one-file baseline | `88ec5856740ca514bced02238b75d32565f23071` | `a63575465a737b4b926e9651a2af91b177c0b35b` | CERTIFIED ON MERGED MAIN |
| P5 v1 controlled promotion | PR #26 / candidate `6d1555a6aaf88d047e7246160bf2e536aeead8f9` / `golden-p5-corpus-v1` | `da14edf1b7d991c011ef8ff07580704ba0219ea1` | COMPLETE / CANONICAL / FROZEN |
| Advanced P5 Environment v2 | PR #32 / candidate `7688e9ca8719e1b7f42dcc15d7962f08a76e3e55` / `golden-p5-environment-v2-corpus-v1` | `ace38aac27b9098a9c01b390eeaa82933077f4be` | COMPLETE / CANONICAL / FROZEN |
| P5 Environment v2 governance closure | PR #33 / candidate `931ad5eead225b8d8fbbec0cb3e470e479de4745` | `58d4cbbc3ff8412ddd29a2fa628746b4d8d0557d` / run `33760167600` | COMPLETE / CANONICAL / FROZEN |
| P6 v1 | PR #34 / candidate `b5d0850d46184700e2764a413db59e314ba6ce83` / tree `f41cb6b18e6af2289f05e898c44320833366b2c8` / runs `33761698110`, `33762252812` | signed merge `79d1817abc446f01825a66db93a2dc16aa379d7b` / same tree / exact-main run `33762589274` | COMPLETE / CANONICAL / FROZEN WITHIN DECLARED SCOPE |
| Future greenhouse / XUV-escape / geology | issues #29 / #30 / #31 | not promoted | RESEARCH / DEFERRED |

### P6 v1 exact-main certification

- contract/schema/model: `ofu-p6-biosphere-v1` / `1` / `p6-biosphere-evolution-1`
- Semantic Manifest: `2a3593bad3ce921c4f2f9e4282c64dc8fc3906d9c5863a048d14fa8fe541b0c9`
- Golden corpus/digest: `golden-p6-biosphere-v1` / `1c418401aebcaef62d1ed2ea4f7b6c84440cb6c0e903af35969f7f0794b3e557`
- identity policy: `p6-biological-identity-model-a-v1`
- eligibility witness: `ofu-p6-environment-eligibility-witness-v1`
- exact certified candidate: `b5d0850d46184700e2764a413db59e314ba6ce83`
- candidate tree: `f41cb6b18e6af2289f05e898c44320833366b2c8`
- candidate push run: `33761698110` — SUCCESS
- PR #34 repeated exact-head run: `33762252812` — SUCCESS
- signed canonical merge: `79d1817abc446f01825a66db93a2dc16aa379d7b`
- canonical merge tree: `f41cb6b18e6af2289f05e898c44320833366b2c8`
- exact-main run: `33762589274` — SUCCESS
- Issue #24: CLOSED after the exact-main seal passed

The candidate and canonical merge trees are byte-identical. Both exact-head
campaigns and the exact-main campaign passed Foundation, P1–P5 including
Environment v2, P6 authority/identity/replay, Golden, independent Python oracle,
save/reopen/replay, Worker order, sparse working set, deterministic build and
Linux Chromium/Firefox/WebKit, Windows Chromium and macOS ARM64 WebKit. Real
Safari/iOS remains `NOT_VERIFIED`.

PR #25 is a historical exact-candidate certification record that was closed unmerged because the draft-to-ready connector path could not be used as the promotion vehicle. PR #26 is the actual P5 v1 controlled-promotion merge vehicle. The certified P5 v1 candidate tree and canonical merge tree are both `a1cae552911011173672478274fd092f56f4dfff`, so that merge introduced no content drift.

### P5 v1 exact-main certification

Canonical P5 v1 promotion merge and exact-main certification target:

- candidate SHA: `6d1555a6aaf88d047e7246160bf2e536aeead8f9`
- candidate tree: `a1cae552911011173672478274fd092f56f4dfff`
- canonical merge SHA: `da14edf1b7d991c011ef8ff07580704ba0219ea1`
- canonical merge tree: `a1cae552911011173672478274fd092f56f4dfff`
- exact-main certification SHA: `da14edf1b7d991c011ef8ff07580704ba0219ea1`
- Foundation Integrity: run `33688748804` — SUCCESS
- P1 Conformance: run `33688748812` — SUCCESS
- P2 Conformance: run `33688748987` — SUCCESS
- P1-P4 Canonical Baseline: run `33688748932` — SUCCESS
- P5 Controlled Promotion: run `33688748922` — SUCCESS
- exact-main P3 gate: `P3` step inside P5 run `33688748922` — SUCCESS
- exact-main P4 gate: `P4` step inside P5 run `33688748922` — SUCCESS
- candidate full P3 Conformance workflow: run `33654626185` on candidate SHA — SUCCESS
- candidate full P4 Conformance workflow: run `33654626379` on candidate SHA — SUCCESS

The dedicated P3/P4 workflows do not trigger on pushes to `main`; therefore exact-main P3/P4 execution for P5 v1 was provided by the pinned `exact-head` job of the P5 promotion workflow. Full dedicated candidate P3/P4 workflows were also successful, and the canonical merge tree is byte-identical to that candidate tree.

P5 run `33688748922` additionally re-established on exact main: the Golden physical vector, real P3 v1 → P5 integration, P4 → static P5 replay/checkpoint/repeated-compaction binding, evidence isolation, reproducible P1–P5 build, bounded working-set evidence, direct `file://` execution, zero required runtime network, and identical shipped-vector results across Linux x64 Chromium, Linux x64 Firefox, Linux x64 Playwright WebKit, Windows x64 Chromium and macOS ARM64 Playwright WebKit. Playwright WebKit is not Safari/iOS certification; real Safari/iOS remains `NOT_VERIFIED`.

The P5 v1 Golden physical digest is `402267561fb311c16f68380afdf066df883eba62b8053d6470401d2eebd86d52`. The shipped cross-runtime vector is physical digest `7532cf9a6d2258031bc3f29f76c8614ea75973367fbe3aaae7a7652755169bc7` and terrain digest `8e96317fa3a1d712b35ef24b9cd9981fb74f0e98145b9472cc823b5d6ffd7b34`.

### Advanced P5 Environment v2 exact-main certification

Environment v2 is an additive successor authority and preserves every frozen P5 v1 witness.

- pre-promotion main: `89e32fd90fc4b56594e78cf3648a0708ff2cfe79`
- exact certified candidate: `7688e9ca8719e1b7f42dcc15d7962f08a76e3e55`
- candidate tree: `838fc20d0028e77e33f8d54ac5c495e6422a5950`
- promotion PR: #32
- canonical merge SHA: `ace38aac27b9098a9c01b390eeaa82933077f4be`
- canonical merge tree: `838fc20d0028e77e33f8d54ac5c495e6422a5950`
- first exact-main Environment v2 certification: run `33737515944` — SUCCESS
- PR-specific repeated Environment v2 certification: run `33737182149` — SUCCESS
- exact candidate certification: run `33736791875` — SUCCESS
- Semantic Manifest hash: `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`
- Golden corpus: `golden-p5-environment-v2-corpus-v1`
- Golden digest: `ac33ba776976d1381a841426fb7e0fbb0276877e98565261bfdec2bca598d7a4`
- shipped Environment digest: `f6ecaea013a78f5f7a16acf2a0f2fa33f7f7ec816474df33be9f8b0fa41de0a2`

Run `33737515944` re-established on exact main Foundation/P1/P2, P3, P4, frozen P5 v1, Environment v2 conformance, Worker scheduling invariance, independent Python oracle, Golden vectors, sparse working-set benchmark, evidence isolation and a reproducible Environment v2 single-file build. The aggregate seal required identical canonical outputs on Linux Chromium, Linux Firefox, Linux Playwright WebKit, Windows Chromium and macOS ARM64 Playwright WebKit. Playwright WebKit is not real Safari/iOS evidence.

Governance PR #33 subsequently resolved the duplicate ADR identifier by preserving
the established multiscale ADR-015 and assigning Environment v2 the unique
ADR-019. Candidate `931ad5eead225b8d8fbbec0cb3e470e479de4745` and signed merge
`58d4cbbc3ff8412ddd29a2fa628746b4d8d0557d` share tree
`1d74cd3eed82f81e66b7f1131576696574f310a3`. Exact-main run
`33760167600` repeated Foundation through Environment v2, the independent oracle,
reproducible build and all five supported runtime profiles successfully. Issue #28
was then closed; #29, #30 and #31 remain noncanonical research.

Environment v2 chooses `NO_CANONICAL_GENESIS`: the canonical atmosphere schema is real, but arbitrary planets are not assigned fabricated atmospheric mass. The canonical column-pressure law is causal from retained atmosphere mass and frozen P5 v1 gravity/radius. The corrected Tier-0 law produces `254.578 K` for Earth-normalized stellar forcing and Bond albedo 0.3 while explicitly refusing to call that a surface temperature.

P5 v1 and Environment v2 are therefore both **COMPLETE / CANONICAL / FROZEN** within their declared scope. Surface temperature, greenhouse climate, water phase/EOS, canonical XUV evolution, endogenous atmospheric escape, geology/geochemical energy, ocean area fraction, physical terrain elevation and gas-giant environment semantics remain `UNSUPPORTED` or separately `RESEARCH / DEFERRED`.

The P1–P4 reference release `v0.4.0-preview.1` remains unchanged. Neither P5 v1 nor Environment v2 retroactively redefines that release.

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

P5 static-genesis integration then embeds the promoted P5 genesis under P4 and proves full replay == checkpoint replay == repeated-compaction replay while P5 genesis digest is unchanged. Environment v2 continues to reject private P5 time and does not introduce endogenous atmospheric-loss ordering.

Terrain conformance proves exact same-face and cross-face seams, eight cube corners, direct random access, refinement-order independence, `PROJECT(REFINE(parent))`, deterministic `RECONCILE`, bounded per-operation materialization and no global planet heightmap.

## Superseded Cycle-3 registry

PR #19 was intentionally closed unmerged because canonical P3/P4 promotion would have made its registry snapshot stale immediately. Its valid evidence is preserved here:

- P3 candidate `0699390756352ceac65e5d51cc89b910c0ac54e5`
- P4 pre-realignment candidate `19f30ad545bb5e31693631bb2575b5bfadd33ed8`
- disposable integration `e9b6240611a0e8bc1e08de623eeb1a3484eea03b`
- workflow `33637549852` — SUCCESS

There is one living registry: this file.
