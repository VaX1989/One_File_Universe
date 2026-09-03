# ADR-020 — P6 Biological Identity Policy v1

Status: **PROMOTION CANDIDATE — becomes ACCEPTED only with canonical P6 v1 merge**

## Decision

P6 v1 adopts **Model A** under identity policy `p6-biological-identity-model-a-v1`.

Biological semantic identity is separate from generator realization and model version. Canonical P6 Entity IDs are P2 Entity Identities rooted in the canonical Universe Identity and a semantic stable key that includes the explicit identity-policy version. Generator version and P6 Semantic Manifest hash are recorded in realization/replay provenance and drive P2 addressed derivation, but they are intentionally excluded from semantic Entity ID stable keys.

Canonical v1 identity scope is limited to:

- biosphere;
- lineage;
- species.

Individual identity is **not promoted** in v1. MICRO individuals are bounded, ephemeral refinements with `persistent=false` and `individualIdentityPromoted=false`.

## Adversarial comparison

### Model A — semantic identity survives model revision

Advantages: stable archive references; stable lineage/species references across generator improvements; explicit migrations only when semantics actually change; avoids identity churn caused by implementation/model revisions.

Risk: a future model may redefine what a species/lineage means. This is handled by an explicit identity-policy migration, not by silently changing the generator version in the ID input.

### Model B — model version is part of semantic identity

Advantage: every model revision creates a clean namespace boundary.

Material disadvantage: even non-semantic numerical or generator corrections churn biosphere/lineage/species IDs, break historical references, enlarge migrations and conflate realization with identity.

### Model C — realization hash is the identity

Rejected. It makes identity depend on derivation/model outputs and destroys stable semantic references under harmless implementation/model changes.

## Stable keys

- Biosphere: `{ planetId, identityPolicy }`
- Lineage: `{ biosphereId, lineageOrdinal, identityPolicy }`
- Species: `{ lineageId, speciesOrdinal, identityPolicy }`

The P6 generator/model version and Semantic Manifest hash MUST NOT be inserted into those stable keys.

## Derivation separation

All canonical P6 stochastic-looking choices use P2 addressed derivation with the actual P6 Semantic Manifest hash. There is no independent biological seed tree and no global RNG.

Therefore:

`semantic identity != realization derivation != model version`.

## Migration and archive behavior

A future generator/model revision that preserves biological semantics reuses the same identity policy and therefore preserves Entity IDs. Its realization records the new model version/manifest hash.

A future semantic redefinition requires a new identity-policy version and an explicit migration mapping old IDs to new IDs where meaningful. No runtime may silently reinterpret old P6 history under a different transition law, manifest or identity policy.

P4 archive baselines bind P6 model version, P6 manifest hash, P5 Environment contract and P6 identity policy. P4 transition-contract descriptors bind reducer semantics. Unsupported future descriptors fail closed.

Legacy P1–P5 saves contain no P6 history; absence MUST remain absence and MUST NOT be interpreted as a generated biosphere.

## Consequences

- Stable biological references survive ordinary P6 model upgrades.
- Irreversible semantic identity changes are explicit governance actions.
- P6 v1 deliberately avoids premature persistent individual identity.
- This ADR supersedes the research conclusion of ADR-019 when P6 v1 is canonically merged.