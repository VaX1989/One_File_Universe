# ADR-025 — Exact-base ownership and additive parallel development

**Status:** Accepted

**Ratified:** 2026-09-05 under the founder's Absolute Completion Mission; see
[program execution authority](../governance/V1_PROGRAM_EXECUTION_AUTHORITY.md)
and [v1.0 implementation contract](../governance/V1_IMPLEMENTATION_CONTRACT.md).
Acceptance is a forward architecture decision, not certification of unbuilt
capabilities or a change to frozen P0-P6 semantics.

## Context

Recent product waves reduced conflict by freezing shared surfaces and assigning lane ownership, but convergence still required broad edits across bootstrap, product, renderer, build and tests. Increasing the number of AI writer lanes without stronger seams would multiply merge conflict and semantic ownership ambiguity.

## Decision

The active program and subsequent high-concurrency development follow these rules:

1. shared interfaces are frozen before large parallel implementation waves;
2. each wave names an exact common SHA/tree, with stacking explicit when required;
3. each shared semantic surface has one writer in a wave;
4. additive providers/adapters/reducers/projections are preferred to many lanes editing monolithic switches or bootstraps;
5. writer lanes declare owned/read-only/forbidden files and integration contracts;
6. research branches never gain canonical authority by ancestry or merge alone;
7. one convergence owner composes accepted candidates and runs cumulative evidence;
8. scientific, UX, rendering, performance and conformance adversaries should normally be read-only.

## Consequences

- A short parallelization-enabling seam transaction should precede the next very large writer wave.
- Central registries/build composition/test harnesses require deliberate single ownership.
- More branches are not automatically more throughput; concurrency is limited by shared-surface contention.
- Machine-readable frontier metadata can inform branch topology but does not itself create branches.
