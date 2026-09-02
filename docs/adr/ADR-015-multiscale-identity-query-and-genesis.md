# ADR-015 — Multiscale Identity, Query Context and Genesis Configuration

**Status:** Accepted  
**Date:** 2026-09-02  
**Decision scope:** P2 long-lived identity/address/query compatibility.

## Context

P2 will begin stabilizing byte-level identity and addressing. A naive containment tree or global coordinate path would make identity depend on mutable location/ownership and would be incompatible with future non-classical model regimes. Universe Identity also needs a clear rule for alternative initial conditions or law profiles without conflating source-code bytes with semantic world meaning.

## Decision

1. OFU adopts a Multiscale Reality Graph with causal, spatial, compositional, temporal and relational edges. It does not require a permanently materialized universal tree.
2. `UniverseIdentity`, `CanonicalEntityIdentity`, `QueryContext` and `ModelRegime` are distinct concepts. Location, containment, ownership, navigation and requested property are query/relationship data unless a domain explicitly defines them as identity.
3. Spatial, temporal and semantic resolution are independent of model fidelity.
4. Cross-scale contracts use the semantic operations `REFINE`, `PROJECT` and `RECONCILE`; implementations must bound projection/reconciliation through significance/dependency rules.
5. Observation may cause materialization but does not create canonical procedural truth.
6. P2 addressing must permit typed namespaces and regime/local coordinate semantics; it must not assume every deeper regime is a smaller classical spatial object.
7. Future scientific metadata uses orthogonal Evidence Class and Model Fidelity dimensions. P0 composite labels are legacy documentation and require explicit two-field migration when a domain becomes a canonical protocol contract.
8. Genesis/initial-condition/law-profile configuration is semantic configuration committed by the Semantic Generator Manifest. `UniverseIdentity` binds root seed/entropy plus the semantic manifest hash. No separate `GenesisParametersHash` is added in P2 unless later evidence shows a need; avoiding a duplicate field prevents two hashes from disagreeing about the same semantic configuration.
9. Implementation source/component hashes are excluded from semantic world identity unless an ADR explicitly promotes a byte artifact into semantic meaning. They belong in an Implementation Manifest. Corpus/runtime evidence belongs in a Conformance Manifest.

## Compatibility consequences

- P1 addresses remain prototype evidence, not the permanent entity identity schema.
- P2 must version the canonical address schema and value protocol before declaring D3 stability.
- A semantic genesis/law-profile change changes the Semantic Generator Manifest hash and therefore creates a different Universe Identity.
- A conforming reimplementation may have different implementation bytes while realizing the same semantic universe.
- Mutable relocation or ownership does not by itself rename an entity.

## Rejected alternatives

- **Containment path equals permanent identity:** rejected because relocation/reparenting would rename entities.
- **Single universal meter coordinate:** rejected because semantic/local/non-classical regimes need different addressing semantics.
- **Source tree hash equals world identity:** rejected because it prevents independent conforming implementations.
- **Independent GenesisParametersHash beside manifest hash:** rejected for P2 because semantic genesis is already committed by the semantic manifest and duplicate commitments can diverge.

## Verification obligation

P2 Golden Universe Corpus v1 must include tests demonstrating identity/query separation, manifest/genesis identity effects, unrelated-domain isolation where promised, typed address boundaries and malformed/future tag rejection.
