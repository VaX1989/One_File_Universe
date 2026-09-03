# ADR-021 — P6 Environment Witness and Transition Scope

**Status:** Accepted

## Context

The pre-hardening P6 candidate allowed a `P6_CONFORMANCE_ONLY` positive vector to lose its provenance, become a MACRO realization and authorize a normal P4 biosphere-genesis event. The event reducer trusted a `BIOSPHERE_SUPPORTED` payload label and arbitrary 32-byte biological identifiers. Speciation also referenced lineage IDs without a persistent lineage lifecycle.

Those paths could convert test evidence into canonical truth and create orphaned biological state.

## Decision

1. Positive conformance-vector construction is removed from the shipped P6 runtime. Test fixtures remain under `tests/p6/` and are not embedded in the single-file artifact.
2. Canonical eligibility is represented by `ofu-p6-environment-eligibility-witness-v1`. Its digest binds the exact P5 Environment v2 contract/schema/model/authority, P5 manifest, planet, environment digest, epistemic result, P6 semantics version, P6 manifest and identity policy.
3. The P4 baseline stores the eligibility witness and source environment digest. The genesis reducer requires the full environment projection, recomputes both witnesses, compares the baseline, verifies the event target and recomputes the Model A biosphere ID.
4. Frozen P5 Environment v2 cannot produce `BIOSPHERE_SUPPORTED`; therefore the guarded genesis transition has no accepted current canonical path.
5. Persistent lineage/speciation/extinction transitions are deferred. Deterministic lineage/species IDs may be used for non-persistent semantic refinement, but do not establish entities.
6. Rendering accepts only a validated canonical eligibility witness and cannot present test-only or handcrafted MACRO data as established biology.

## Consequences

- Current planets truthfully produce `INSUFFICIENT_ENVIRONMENT` and no persistent biology.
- A bare state label, forged witness digest, mismatched planet, altered P5 manifest, forged biosphere ID or mismatched P4 baseline fails closed.
- A future positive P6 path requires an explicitly versioned upstream authority and a new promotion cycle; it cannot emerge through relaxed v1 validation.
- A future lineage lifecycle requires explicit genesis/branch/parentage semantics and replay-verifiable P2 identity before speciation can become persistent.

## Rejected alternatives

- **Retain the shipped conformance constructor with a renamed authority.** Rejected because naming does not enforce an authority boundary.
- **Trust a signed-looking payload label.** Rejected because deterministic causality requires a recomputable upstream witness, not an assertion.
- **Keep speciation and validate only byte length.** Rejected because that preserves orphan and cross-biosphere integrity failures.
- **Fabricate a positive P5 planet for test coverage.** Rejected because conformance coverage must not invent canonical environmental truth.
