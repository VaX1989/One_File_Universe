# One File Universe Control Plane

Status: **CANONICAL GOVERNANCE**

This document governs canonical integration after `v0.5.0-preview.1`. It changes no P1-P6 scientific semantics.

## Certified-base rule

`main` is the only canonical promotion target. Parallel research, product and verification work happens on isolated branches. There is exactly one integration owner with canonical write authority at a time.

No parallel branch becomes canonical merely because its own tests pass.

## Authority ownership

- P2 owns canonical identity, canonical bytes and addressed deterministic derivation.
- P3 owns astronomy facts.
- P4 exclusively owns canonical time, event identity/order, accepted history, replay, checkpoints, compaction and archives.
- P5 owns planetary and environment truth.
- P6 owns biological truth.
- Rendering is `PRESENTATION_ONLY`; camera, LOD, caches, GPU resources, timing and visual choices are non-canonical.
- The single-file/offline/direct-`file://` constitution, sparse bounded working sets, and canonical/derived/presentation separation remain mandatory.
- `UNKNOWN`, `UNSUPPORTED`, and `INSUFFICIENT_ENVIRONMENT` must never be converted into invented facts.

## Parallel-lane handoff contract

A lane is eligible for promotion review only when its owner supplies all of:

1. exact branch name;
2. exact candidate commit SHA and tree SHA;
3. scope and changed authority domains;
4. exact tests and workflow evidence;
5. independent/oracle evidence where applicable;
6. known limitations;
7. `MATERIAL BLOCKERS = 0`;
8. an explicit promotion request.

Research-only or presentation-only evidence must retain its authority label. Positive research fixtures are never canonical evidence by implication.

## Serial promotion transaction

For each candidate, the integration owner must:

1. re-fetch live `main` and record SHA/tree;
2. compare candidate divergence against that exact `main`;
3. adjudicate cross-lane and authority collisions;
4. integrate onto the current certified baseline without force-push or history rewrite;
5. run the relevant exact-head gates, including the unique `rendering-production-seal` check whenever workflow/integration semantics or the shipped vertical slice can be affected;
6. adversarially review the exact candidate;
7. merge only the expected exact PR head SHA;
8. certify the exact resulting `main`;
9. update governance only after the exact-main certification succeeds.

Never evaluate a second independently certified candidate as promotable until the first resulting `main` has been recertified. Independent branch certifications are not composable.

## Main protection target

The intended GitHub enforcement for `main` is deliberately small:

- require pull-request based changes to `main`;
- require the unique `rendering-production-seal` check before merge, because `Rendering Production` runs on PRs to `main` and covers exact-head Foundation, P1, P2, P3, P4, P5, Environment v2, P6 and Rendering Production evidence;
- require the branch to be current before merge / reject stale integration;
- block force pushes;
- block branch deletion;
- apply enforcement to administrators where the repository plan/API permits it;
- do **not** require contexts that do not run for the relevant PR event.

Repository-side enforcement must be verified live; this document is policy, not a substitute for GitHub protection/rulesets.

## CI supply-chain policy

The canonical integration gate and release-control-plane workflows pin third-party GitHub Actions to immutable commit SHAs with the corresponding major version documented in comments. Their toolchain is Node `24.20.0`, Python `3.13.15` where Python is required, and Playwright `1.62.1` for browser automation.

Legacy or phase-specific workflows are not sufficient promotion evidence by themselves. They may be migrated to immutable action pins independently without changing frozen scientific semantics.

Hosted runner images remain GitHub-managed and therefore are not byte-immutable. Exact runner/browser versions observed by certification are evidence and must not be overclaimed as permanent toolchain identity.

## Release transaction

Published releases are immutable historical products from the OFU governance perspective. `v0.5.0-preview.1` is sealed and must never be retargeted, deleted, replaced, re-uploaded or edited.

Every future preview release uses this order:

`candidate exact-head -> merge expected head -> exact-main certification -> certified build artifact -> draft release -> remote asset re-download -> byte/hash verification -> publish`

`.github/workflows/certified-preview-release.yml` implements the draft-first portion. It requires an exact successful `Rendering Production` run for the current live `main`, stages a draft, re-downloads the remote asset, compares bytes and SHA-256 against the certified artifact, then and only then publishes. It explicitly rejects `v0.5.0-preview.1`.

Legacy `v0.2.0-preview.1` and `v0.4.0-preview.1` release workflows are verify-only; historical releases are not delete-and-recreate targets.

## Evidence discipline

A green PR is not canonical closure. The final record must include candidate SHA/tree, expected-head merge SHA, resulting main SHA/tree, exact-main run IDs, and release byte/hash evidence when a release is involved.
