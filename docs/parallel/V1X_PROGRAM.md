# One File Universe — V1X Massive Parallel Program

Status: Prompt-0 normalization control plane. This document is planning/governance metadata, not canonical universe state.

Definitive convergence branch: `integration/v1.0-definitive-product-convergence-2026-09-05`.
Base marker commit subject: `V1X: freeze massive parallel base`.

## Purpose

Prompt 0 freezes the already implemented PX-01…PX-06 seams and activates isolated development branches without changing universe meaning. Every writer begins from the one marker commit and may change only its namespace described by `V1X_OWNERSHIP_MATRIX.json`. Research remains research-only. Reviewers are read-only. `main` is not a writer surface.

## Verified enabling seams

- PX-01: `src/extensions/contracts.js` freezes versioned provider/query/authority/selection/scale/representation/time/evidence contracts. Shipping additive catalogs cannot grant canonical admission.
- PX-02: `src/extensions/registry.js` + `product-bindings.js` provide sealed provider/capability ownership and actual product binding. Duplicate owner/capability claims fail closed.
- PX-03: `tools/extensions/components.mjs` discovers every `config/components/*.json`; lane component descriptors are additive and do not require a central manifest edit.
- PX-04: `src/extensions/render-backend.js` preserves WebGL2 Strict as baseline behind a presentation backend boundary.
- PX-05: `src/extensions/cross-scale.js` supplies REFINE / PROJECT / RECONCILE with independent continuity witnesses.
- PX-06: `tools/extensions/conformance.mjs` discovers every `config/conformance/*.json`; lane tests are additive and owner-qualified.

## Shared semantic ownership

The semantic design owner may propose/add an implementation in its isolated namespace; mutation of existing shared compatibility files remains convergence-owner-only.

| Surface | Semantic owner | Existing shared-file writer |
| --- | --- | --- |
| camera + reference frames | V1X-01 | convergence owner |
| continuous distance + semantic scale/regime | V1X-01 | convergence owner |
| canonical selection/context | convergence owner | convergence owner |
| input intent routing | convergence owner; V1X-10 contributes isolated adapters | convergence owner |
| scene/representation selection | convergence owner; visual lanes register additive providers | convergence owner |
| provider-registry semantics | convergence owner | convergence owner |
| P4 event/temporal admission | frozen P4 authority | convergence owner only when separately authorized |
| capability/quality/resource budgets | V1X-11 proposals/isolated runtime | convergence owner for shared ceilings/admission |
| build component composition | convergence owner | convergence owner |
| test/conformance registration semantics | convergence owner; V1X-14 contributes isolated evidence | convergence owner |

`src/rendering/v1/living-renderer.js`, `src/bootstrap/product/living-universe.js`, central bootstrap/CSS, central registries, frozen P0–P6, build composers, integration workflows, persistence/session compatibility surfaces and existing shared test harnesses are not lane-owned.

## Additive lane rule

A shipping lane uses its `ownerNamespace` and may add only the paths selected by its policy template. The normal extension shape is:

- `src/<ownerNamespace>/**`
- `config/extensions/<ownerNamespace>/**`
- `config/components/<ownerNamespace>.json`
- `config/conformance/<ownerNamespace>.json`
- `tests/<ownerNamespace>/**`
- `docs/evidence/<ownerNamespace>/**`
- `reports/<ownerNamespace>/**`
- `docs/parallel/handoffs/<ownerNamespace>/**`

The component/provider/conformance IDs inside those files must also be owner-qualified. A lane needing a change to a frozen shared contract records `requestedSharedContractChanges` in its handoff and stops at that seam; it does not edit the shared file.

Research lanes may write only their `research/<ownerNamespace>/**` / `prototypes/<ownerNamespace>/**` namespace plus namespaced evidence/handoff paths. Research ancestry is never blindly merged to shipping state.

## Exact-base and ancestry rule

`tools/validate-v1x-ownership.mjs` derives the lane fork point against the definitive integration ref and requires that fork-point commit subject to equal `V1X: freeze massive parallel base`. Merge commits in a lane are rejected. If a lane rebases onto a later integration head, the fork point changes and validation fails. A later stacked dependency is valid only when the convergence owner explicitly records it.

## Handoff and checkpoint acceptance

Every checkpoint handoff conforms to `V1X_HANDOFF_SCHEMA.json` and carries exact base/checkpoint SHA/tree, changed paths, ownership validation, contract set, tests/evidence, dependencies, authority claims, resource/browser/device truth, findings and requested shared changes.

Acceptance requires exact ancestry, changed-path ownership, evidence review, targeted tests, no known P0/P1 in lane-owned scope and compatibility with `V1X_CONTRACT_SET.json`. Moving branch HEAD is never accepted by default; the convergence ledger records immutable checkpoint SHAs.

## Integration trains

- T0: contracts/base + V1X-01 + V1X-02 + V1X-11
- T1: V1X-03 + V1X-04 + V1X-05
- T2: V1X-06 + V1X-10
- T3: V1X-07 + V1X-08 + V1X-09
- T4: V1X-12 + V1X-13
- T5: V1X-14 + cumulative adversarial closure

Logical dependencies do not authorize rebasing. All activated branches share the exact Prompt-0 base unless a later convergence record explicitly authorizes a stack.

## Status and release boundary

Allowed status language is `NOT_STARTED`, `IMPLEMENTATION_IN_PROGRESS`, `IMPLEMENTED_UNCERTIFIED`, `CI_CERTIFIED`, `FOUNDER_ACCEPTED`. Only the founder assigns `FOUNDER_ACCEPTED`.

Prompt 0 creates development branches only. It does not merge `main`, publish `v1.0.0`, certify physical devices, promote research, or close founder-experience requirements through test edits alone.
