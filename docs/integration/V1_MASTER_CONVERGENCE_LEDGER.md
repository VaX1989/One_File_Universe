# One File Universe — v1 Master Convergence Ledger

**Role:** evidence/planning ledger for the massive parallel development program. This file is **not canonical universe state** and does not replace owning scientific, temporal, rendering, product, or persistence specifications.

**Definitive convergence branch:** `integration/v1.0-definitive-product-convergence-2026-09-05`

**Status vocabulary:** `NOT_STARTED`, `IMPLEMENTATION_IN_PROGRESS`, `IMPLEMENTED_UNCERTIFIED`, `CI_CERTIFIED`, `FOUNDER_ACCEPTED`. Only the founder may assign `FOUNDER_ACCEPTED`.

## 1. Frozen parallel base

The recoverable executable PX foundation promoted through PR #50 is the frozen enabling base for any subsequently activated Prompt-0 writer lanes:

- `PARALLEL_BASE_SHA = d62028226eabe5fa61911683c6f974ff29ee1ca2`
- `PARALLEL_BASE_TREE = 1689c56ab1d0d5196c08f67fb071c322402df57a`
- exact PX candidate before promotion: `fb34d7db2c5d699017f99d7106dff0e5719aeca3`
- candidate tree: `1689c56ab1d0d5196c08f67fb071c322402df57a`
- certified starting main recorded by PR #50: `d28dfcd3402061b572b63ffbae40693ce2d59320`

The candidate and promotion merge have the same tree. No future lane is accepted merely because it descends from this base; immutable checkpoint review is still required.

## 2. Current integration truth

Immediately before creation of this ledger, the live definitive branch was reverified as:

- source SHA: `be34b34b3e29f9a58f7fc70ede2b4651a064c128`
- source tree: `690d8acb9ad5e78b1f1a8b3dda98bbd5568d3d81`
- overall status: `IMPLEMENTED_UNCERTIFIED`

This section is historical evidence for the ledger-creation transaction. The branch head necessarily advances when this file is committed; the exact post-ledger head/tree is recorded by the next ledger update after exact-head verification.

The user-supplied expected checkpoint `84465aa2b353b4beb92c66748ce15686450aca7e` / tree `30fd32196f29c210b1846d7f8810f8ec78951e74` was found in live ancestry but was no longer the branch head when orchestration resumed. It was not restored or treated as current truth.

## 3. Authority and ownership references

This ledger coordinates evidence only. The living current contract registry remains:

- `docs/INTEGRATION_MATRIX.md`
  - observed blob at pre-ledger head: `f4b8feab3616146d32d750b351d36956d75cc813`
- `docs/integration/BASELINE_MUTABLE_AUTHORITY_MATRIX.md`
  - observed blob: `d20214c2e5c13670852a8b5ca38ae55c51eaecb1`
- `docs/PARALLEL_DEVELOPMENT_ARCHITECTURE.md`
- `docs/governance/V1_IMPLEMENTATION_CONTRACT.md`
- `docs/governance/V1_PROGRAM_EXECUTION_AUTHORITY.md`

Ownership rule: one semantic truth has one owner. No lane may independently fork camera, scale, selection, scene, input, temporal, budget, build, registry, identity, scientific authority, or persistence truth. Any shared-contract change freezes integration around that seam until centrally adjudicated and versioned.

### Ownership matrix identity

- matrix version: repository living registry + Prompt-0 train ownership, ledger revision 1
- registry blob digest: `f4b8feab3616146d32d750b351d36956d75cc813`
- mutable-authority matrix blob digest: `d20214c2e5c13670852a8b5ca38ae55c51eaecb1`
- Prompt-0 V1X activation manifest: **absent from repository history/index at ledger creation**

Because the activation manifest is absent, this ledger does not invent lane branch names, file ownership, or checkpoint SHAs. Checkpoint intake for V1X lanes remains frozen until explicit Prompt-0 activation evidence exists.

## 4. Frozen contract set

| Surface | Version / identity | Authority state |
| --- | --- | --- |
| Canonical bytes | `OFU-CBV-1` | frozen upstream authority |
| Unicode profile | `ofu-unicode-15.1.0-v1` | frozen upstream authority |
| P3 astronomy | schema `1`, model `p3-astronomy-1`, baseline `P4_T0` | frozen upstream authority |
| P4 temporal | `ofu-p4-temporal-v1` | frozen upstream authority |
| P4 core transition | `ofu.p4.core-transition@1.0.0` | frozen upstream authority |
| P4 event/checkpoint/archive schemas | `1` / `2` / `2` | frozen upstream authority |
| P3 → P5 planetary input | `ofu-p3-p5-planetary-input-v1` | frozen upstream authority |
| P5 physical | `ofu-p5-planet-physical-v1` / `p5-planet-physical-1` | frozen upstream authority |
| P5 terrain topology | `p5-cube-sphere-topology-1` | frozen upstream authority |
| P5 Environment v2 | `ofu-p5-p6-environment-v2` / `p5-environment-2` | frozen upstream authority |
| P5 Environment v2 semantic manifest | `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f` | frozen upstream authority |
| P6 biosphere | `ofu-p6-biosphere-v1` / `p6-biosphere-evolution-1` | frozen upstream authority |
| P6 transition | `ofu.p6.biological-transition@1.0.0` | frozen upstream authority |
| P6 semantic manifest | `2a3593bad3ce921c4f2f9e4282c64dc8fc3906d9c5863a048d14fa8fe541b0c9` | frozen upstream authority |
| PX registry | `ofu-px-registry-1` | shared extension authority |
| PX observed provider manifest digest | `3bfa17c632e246b632d742d45901943ae335e5e3001750ed6cee5df53524b018` | exact-run evidence at `e98518ae…` |

Model-derived v1 environment/life/civilization/microscopic systems remain distinct from frozen canonical P0–P6 claims. `MODEL_DERIVED_SIMULATION` and `PRESENTATION_ONLY` must never be relabeled as canonical evidence.

## 5. Lane activation and checkpoint ledger

No Prompt-0 V1X activation manifest or activated V1X branch record was present when this ledger was created. Therefore every lane below is `NOT_STARTED` for Prompt-0 checkpoint acceptance, regardless of capabilities already present in the monolithic definitive integration branch.

| Lane | Scope | Branch | Status | Accepted checkpoints | Rejected checkpoints | Dependency / intake rule |
| --- | --- | --- | --- | --- | --- | --- |
| V1X-01 | camera / frames | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T0; wait for explicit Prompt-0 ownership record |
| V1X-02 | spatial | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T0; wait for explicit Prompt-0 ownership record |
| V1X-03 | macro universe | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T1 after compatible T0 truth |
| V1X-04 | systems | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T1 after compatible T0 truth |
| V1X-05 | planet | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T1 after compatible T0 truth |
| V1X-06 | surface / human | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T2 after compatible T1 truth |
| V1X-07 | life | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T3; scientific/model authority must remain explicit |
| V1X-08 | civilization / history | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T3; depends on compatible life/world contracts |
| V1X-09 | micro / matter | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T3; preserve matter/provenance constraints |
| V1X-10 | UX / mobile / accessibility | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T2; consumes single camera/scale/input authority |
| V1X-11 | runtime / resources | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T0; single budget/resource authority |
| V1X-12 | gameplay / persistence | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T4; P4-compatible deterministic admission/replay required |
| V1X-13 | audio | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T4; presentation/systemic audio cannot alter truth |
| V1X-14 | certification / evidence | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | T5; read/verify exact accepted train composition |
| AI-F0 | AI successor research | `NOT_ACTIVATED` | `NOT_STARTED` | none | none | research-only unless founder explicitly activates shipping scope |

Research branches may be inspected, but shipping integration requires explicit extraction/reimplementation against the frozen shipping contracts. Research ancestry is never blindly merged.

## 6. Rolling integration train ledger

| Train | Composition | Status | Accepted immutable composition |
| --- | --- | --- | --- |
| T0 | contracts/base + V1X-01 + V1X-02 + V1X-11 | `NOT_STARTED` | none |
| T1 | V1X-03 + V1X-04 + V1X-05 | `NOT_STARTED` | none |
| T2 | V1X-06 + V1X-10 | `NOT_STARTED` | none |
| T3 | V1X-07 + V1X-08 + V1X-09 | `NOT_STARTED` | none |
| T4 | V1X-12 + V1X-13 | `NOT_STARTED` | none |
| T5 | V1X-14 + cumulative adversarial closure | `NOT_STARTED` | none |

The current monolithic definitive integration candidate is tracked separately as `IMPLEMENTED_UNCERTIFIED`; that does not implicitly activate or accept any V1X lane.

After each future accepted train, the convergence owner must re-run ownership/contract validation, relevant frozen upstream gates, cross-scale identity/continuity, targeted browser journeys/evidence, founder-visible delta inspection, and blocker-register updates.

## 7. Cumulative CI ledger

| Exact source | Evidence | Status | Finding |
| --- | --- | --- | --- |
| `84465aa2b353b4beb92c66748ce15686450aca7e` | supplied expected checkpoint | `IMPLEMENTED_UNCERTIFIED` | no longer live head when reverified; preserved only as ancestry evidence |
| `b5a4614b08efbc3101745c58175aab958b5aa5f6` | V1 Definitive Certification | `IMPLEMENTED_UNCERTIFIED` | PX browser journey exposed mobile Explore-sheet toggle visibility race |
| `e98518ae878e0a8656a115cb75e71d3d348cff6d` | source reproduction success; V1 run `34027245891` | `IMPLEMENTED_UNCERTIFIED` | Windows Chromium, macOS WebKit, Linux Chromium, Firefox and WebKit journeys passed; Linux Chromium bounded soak passed; exact-head PX browser failed a custom center-point occlusion heuristic |
| `be34b34b3e29f9a58f7fc70ede2b4651a064c128` | source reproduction run `34027374034` success; V1 run `34027374037` started | `IMPLEMENTED_UNCERTIFIED` | native Playwright actionability now used; exact V1 completion not yet established when ledger creation began |

No source is promoted to `CI_CERTIFIED` until the exact qualifying source/tree and required cumulative jobs are actually green. Passing browser jobs cannot mask a failing exact-head cumulative job.

## 8. Founder-visible blocker register

| Priority | Blocker | Owner | Status | Closure condition |
| --- | --- | --- | --- | --- |
| P1 | Current exact definitive head lacks completed green cumulative V1 certification | convergence owner | `IMPLEMENTED_UNCERTIFIED` | exact-head cumulative certification and required matrix/seal all green on one immutable source/tree |
| P1 | Prompt-0 V1X lane activation/ownership manifest absent | Prompt-0 orchestration authority | `NOT_STARTED` | explicit exact-base branch/ownership/contract/evidence activation record exists before lane checkpoint intake |
| P1 | Physical Android and iOS evidence absent | founder/device evidence owner | `NOT_STARTED` | actual physical-device evidence; browser emulation must remain separately labeled |

The definitive integration branch was observed as unprotected during live verification. No protection setting was changed under this mandate. Because branch protection is not being used as evidence here, exact live-head verification before every write remains mandatory.

## 9. Adversarial findings and assigned closure

| Finding | Evidence / repair | Owner | Status |
| --- | --- | --- | --- |
| Mobile viewport transition could race the product mobile-mode state before PX journey interaction | `e98518ae878e0a8656a115cb75e71d3d348cff6d` waits for browser media-query truth and production mobile runtime truth to converge after viewport changes | convergence/certification seam | `IMPLEMENTED_UNCERTIFIED` |
| Custom center-point occlusion heuristic could reject a control despite browser-native actionability | `be34b34b3e29f9a58f7fc70ede2b4651a064c128` replaces the heuristic with Playwright native trial actionability plus a real click | convergence/certification seam | `IMPLEMENTED_UNCERTIFIED` |

These are test/oracle stabilizations. They do **not** close founder-visible product requirements by themselves and are not evidence that continuous 3D exploration, true system depth, surface embodiment, or other founder-experience requirements are complete.

## 10. Physical-device evidence

- ledger status: `NOT_STARTED`
- physical Android: `NOT_VERIFIED`
- physical iOS: `NOT_VERIFIED`
- browser mobile/landscape evidence: automated browser evidence only; never relabel as physical-device evidence

## 11. Release / founder acceptance

- definitive integration candidate: `IMPLEMENTED_UNCERTIFIED`
- founder acceptance: `NOT_STARTED`
- `main` promotion: not authorized by this ledger
- `v1.0.0` publication: not authorized by this ledger

Only the founder may assign `FOUNDER_ACCEPTED`.

## 12. Checkpoint acceptance protocol

A lane checkpoint may enter this ledger as accepted only when all are true:

1. exact ancestry and declared-base validation pass;
2. exact changed-path ownership validation passes;
3. lane evidence is reviewed;
4. targeted tests pass;
5. no known P0/P1 finding remains in the lane-owned scope;
6. the checkpoint is compatible with the frozen contract set;
7. the checkpoint SHA is immutable and recorded here.

Never accept moving branch HEAD by default. Reject unrecorded rebases, foreign merges, ownership violations, hidden contract forks, and test-only founder-experience closure.

## 13. Ledger update discipline

Before every convergence write:

- re-read the exact definitive branch SHA/tree;
- compare with the last known exact head;
- preserve forward live work unless ancestry/ownership evidence proves it invalid;
- never reset to an expected checkpoint merely because a prompt named it;
- never silently resolve two semantic owners by integration editing;
- update this ledger after accepted/rejected checkpoint adjudication, train composition changes, cumulative CI changes, blocker changes, adversarial findings, physical-device evidence, or founder/release decisions.

This ledger remains evidence/planning metadata. Canonical universe truth continues to reside only in the owning frozen/versioned contracts and admitted deterministic state/history.
