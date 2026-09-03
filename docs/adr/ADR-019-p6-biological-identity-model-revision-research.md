# ADR-019 — P6 biological identity versus model revision (research)

Status: **RESEARCH DECISION / NON-CANONICAL**

## Context

P6 Wave 1 included `P6_MODEL_VERSION` inside the biosphere stable key. That makes an implementation/model revision mint a new Entity ID even when the intended semantic biological entity has not changed.

## Decision

Wave 2 adopts **Model A for research**: biological semantic identity survives generator/model evolution.

Biosphere, lineage and species Entity IDs are derived by canonical P2 from the canonical Universe Identity plus semantic stable keys. Stable keys bind semantic parentage/ordinal identity and the explicit P6 identity-policy identifier, but not the current generator version.

The P6 Semantic Generator Manifest hash instead binds addressed derivation semantics. Generated state records the P6 model version and manifest hash as provenance.

Therefore:

- same canonical Universe Identity + same semantic stable key => same Entity ID across generator revisions;
- changed P6 Semantic Manifest => a different derivation stream is expected;
- model-version change alone is not an identity migration;
- a future change that intentionally redefines the semantic entity requires an explicit identity-policy/migration decision, not an incidental model-version bump.

## Consequences

This avoids accidental identity churn while retaining reproducibility and provenance for changed biological generation semantics. It also makes model comparison possible against stable semantic entities.

The decision is not canonical P6 law. A future promotion review must confirm or replace it explicitly and define migration behavior before persistent biological identities are frozen.
