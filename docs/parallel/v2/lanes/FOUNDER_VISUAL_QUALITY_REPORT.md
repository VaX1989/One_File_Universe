# V2.0 Founder Visual Quality / v1.0.0 Differential Falsification

Status: **COMPLETE_WITH_BLOCKERS — OWNED AUDIT IMPLEMENTATION COMPLETE; EXACT-ARTIFACT BROWSER CLASSIFICATION NOT EXECUTED**

This report is evidence-only. It does not promote production capability and does not authorize central semantic, renderer, camera, input, persistence, build, workflow, or convergence changes.

## Exact subjects

- Authorized V2 production subject: `2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7`
- Authorized V2 production tree: `99e6b5ff6229d9c34d381e778c5689bf2367d256`
- Historical v1.0.0 baseline: `38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16`
- Historical v1 tree: `b7576ebe21b3448b69e35c9cd8d279f51e4332fb`
- Published v1 one-file SHA-256: `013d4277da9acebcbb739275c27f6e05ccbc838840738cd2f9b03bb8f5def61a`
- Lane PR: `#255`, targeting `integration/v2x-supreme-total-convergence-2026-09-07`

## Final ownership state

The final lane diff contains only additive audit evidence/tests under:

- `tests/audit/founder-visual-quality/**`
- `docs/parallel/v2/lanes/FOUNDER_VISUAL_QUALITY_*`

The earlier lane-local workflow was removed from the final diff because `.github/**` is convergence-owned. The final lane does not modify `src/**`, `tools/**`, `config/**`, `data/**`, `package.json`, `.github/**`, or any central convergence record.

## Evidence law

The lane requires the complete chain:

`SOURCE -> SHIPPING MANIFEST -> ONE-FILE HTML -> RUNTIME EXPORT -> ACTUAL CONSUMER -> LIVING VIEWPORT / USER ACTION -> VISIBLE CONSEQUENCE -> PERSISTENCE/REVISIT when applicable -> EXACT-ARTIFACT BROWSER EVIDENCE`.

`tests/audit/founder-visual-quality/differential-browser.mjs` consumes separately materialized exact V1 and V2 one-file HTML subjects, hashes them, drives visible Living controls with Playwright, captures screenshots/telemetry, rejects unexpected online requests, and refuses to convert pixel difference or test success into a qualitative founder-quality promotion.

## Final differential matrix

No exact V2 one-file browser subject was available to this execution environment after the convergence-owned workflow was removed. The authorized V2 tree does not track `One_File_Universe.html`, and direct Git transport from the local execution environment is unavailable. Therefore no domain may honestly be promoted above `NOT_VERIFIED`.

| Domain | Forward | Reverse | Classification | Acceptance |
| --- | --- | --- | --- | --- |
| Universe | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Galaxy | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Region | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Neighborhood | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| System | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Planet | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Surface | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Human | exact browser capture not executed | exact browser capture not executed | NOT_VERIFIED | OPEN |
| Life | exact browser capture not executed | visible reverse route must be proven, not synthesized | NOT_VERIFIED | OPEN |
| Civilization | exact browser capture not executed | visible reverse route must be proven, not synthesized | NOT_VERIFIED | OPEN |
| Matter | exact browser capture not executed | visible reverse route must be proven, not synthesized | NOT_VERIFIED | OPEN |
| Molecular | reachability must be proven through visible controls | visible reverse route must be proven, not synthesized | NOT_VERIFIED | OPEN |
| Atomic | reachability must be proven through visible controls | visible reverse route must be proven, not synthesized | NOT_VERIFIED | OPEN |

Acceptance rule: every founder-visible targeted domain below `MATERIAL_IMPROVEMENT` remains an open defect regardless of CI status.

## Verification actually executed

Executed against the final owned test sources after workflow removal:

- `node --check tests/audit/founder-visual-quality/differential-browser.mjs` — **PASS**
- `node tests/audit/founder-visual-quality/contract.mjs` — **PASS**, 13/13 required domains

Not executed:

- Chromium exact V1/V2 differential — **NOT_EXECUTED**
- Firefox exact V1/V2 differential — **NOT_EXECUTED**
- WebKit exact V1/V2 differential — **NOT_EXECUTED**

A historical lane workflow attempt on an earlier audit head received no runner and executed zero steps. That historical pre-run state is retained only as provenance; it is not evidence for the final checkpoint and the workflow itself is not part of the final lane diff.

## Central certifier execution recipe

The convergence/certification owner can execute the lane without adopting any production change from this branch:

1. Authenticate the lane head as a descendant of V2 base `2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7`.
2. Confirm the final diff contains no production or convergence-owned path.
3. Materialize V2 in a separate exact checkout at `2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7` and run `OFU_SOURCE_SHA=2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7 node tools/build-ofu-rendering-v09.mjs`.
4. Copy its `dist/One_File_Universe.html` to `audit-input/v2.html` and record SHA-256.
5. Materialize v1.0.0 in a separate exact checkout at `38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16` and run `OFU_SOURCE_SHA=38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16 node tools/build-ofu-rendering-v09.mjs`.
6. Copy its `dist/One_File_Universe.html` to `audit-input/v1.html` and verify the expected published v1 SHA-256 where release-equivalence is required.
7. Provide Playwright `1.62.1` without changing repository manifests/locks.
8. Run `node tests/audit/founder-visual-quality/contract.mjs`.
9. Run the differential harness with `V1_SHA`, `V2_SHA`, `V1_ARTIFACT`, `V2_ARTIFACT`, and `EVIDENCE_DIR` set, once for each `BROWSER=chromium`, `firefox`, and `webkit`.
10. Review paired screenshots/telemetry and assign only evidence-backed classifications: `REGRESSION`, `PARITY`, `MINOR_IMPROVEMENT`, `MATERIAL_IMPROVEMENT`, or `NOT_VERIFIED`.

The harness deliberately does not mutate internal runtime state to fake a missing user journey and never self-promotes `MATERIAL_IMPROVEMENT`.

## Remaining defect ledger

### P0 — FVQ-EVIDENCE-001 — exact-artifact founder certification not executed

**Dependency:** central convergence/certification infrastructure must materialize both immutable subjects and provide a browser execution environment. The audit lane has no authority to add/modify `.github/**` to do this.

**Closure:** execute Chromium/Firefox/WebKit against the exact subjects, retain subject hashes and screenshots/telemetry, then classify each required domain.

### P1 — FVQ-DIFF-001 — all required founder domains remain unclassified

**Owner after evidence identifies a visual defect:** affected V2 domain/rendering lane; central scene/camera/scale/input/persistence authority remains `CONVERGENCE_OWNER` unless explicitly delegated.

**Closure:** every domain obtains an evidence-backed classification. Anything below `MATERIAL_IMPROVEMENT` remains a routed open production defect.

### P1 — FVQ-REVERSE-001 — deep reverse journey requires visible-route proof

**Dependency:** actual exact-artifact browser execution. If a reverse path is absent, the affected product/domain lane may expose an additive user-facing hook while central input/scale/selection semantics remain convergence-owned.

**Closure:** exact browser evidence proves reverse traversal using visible user controls with identity/selection/scale continuity.

### P2 — none asserted

No pixel/domain-specific defect is asserted without exact-artifact evidence. Absence of evidence is not misreported as regression, parity, or improvement.

## Completion disposition

All work owned by this audit lane is intentional, durable, and complete: the browser differential harness, qualitative-promotion guard, conservative matrix, defect ledger, provenance, and central execution recipe are published. No temporary workflow or central-owned path remains in the final diff.

The lane status is `COMPLETE_WITH_BLOCKERS`, not `COMPLETE`, because the acceptance law cannot be satisfied until exact V1/V2 browser evidence is executed and reviewed. PR `#255` should remain draft/evidence-only until the convergence owner executes or ingests that evidence.
