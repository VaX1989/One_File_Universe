# ADR-020 — P6 Biological Identity Policy v1

**Status:** Accepted

## Decision

P6 v1 adopts **Model A** under identity policy `p6-biological-identity-model-a-v1`.

Biological semantic identity is separate from generator realization and model version. P2 Entity IDs are rooted in the canonical Universe Identity and a semantic stable key containing the explicit identity-policy version. Generator/model version and the P6 Semantic Manifest hash belong to realization/replay provenance and addressed derivation, not to the Entity ID stable key.

V1 freezes these derivation forms:

- biosphere: `{ planetId, identityPolicy }`;
- lineage: `{ biosphereId, lineageOrdinal, identityPolicy }`;
- species: `{ lineageId, speciesOrdinal, identityPolicy }`.

Only the biosphere identity has a promoted persistent boundary, through the guarded `p6.biosphere.genesis@1` reducer. Current P5 Environment v2 cannot satisfy that reducer's positive precondition. Lineage/species IDs are deterministic semantic-LOD identities, but their persistent lifecycle is deferred. Individual identity is not promoted; MICRO individuals remain bounded ephemeral refinements.

## Reducer verification

A persistent reducer never accepts an identifier merely because it is 32 bytes. The genesis reducer recomputes the expected biosphere P2 Entity ID from the P4 state Universe Identity, witness-bound planet ID and frozen stable key. A mismatch is rejected.

No lineage/species reducer is promoted in v1. Consequently an unknown lineage, cross-biosphere lineage, forged species ID, duplicate species or extinction of an unknown/non-extant species cannot enter canonical P6 state.

## Adversarial comparison

### Model A — semantic identity survives model revision

Stable archive references and explicit migrations are preserved across ordinary model corrections. A future semantic redefinition requires a new identity-policy version and an explicit mapping where meaningful.

### Model B — model version is part of identity

Rejected because harmless generator or numerical corrections would churn every biological identifier and conflate realization with semantic identity.

### Model C — realization hash is identity

Rejected because it makes identity depend on model output and destroys stable references under non-semantic changes.

## Consequences

- Fixed test-vector biosphere/lineage/species IDs remain unchanged by the v1 authority hardening even though the P6 manifest and Golden digest changed.
- Future persistent lineage semantics require a new ADR and a reducer that proves lifecycle, parentage, biosphere membership and P2 identity.
- P4 archives bind model, manifest, environment witness and transition law without redefining semantic identity.
- Absence of P6 history in a legacy save remains absence and never implies generated biology.
