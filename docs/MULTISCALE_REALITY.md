# Multiscale Reality Architecture

**Status:** Ratified P2 compatibility constraints. This document does not authorize production multiscale simulation.

## Progressive multiscale refinement

OFU supports progressive, potentially unbounded procedural refinement across supported model regimes while maintaining a finite materialized working set. This is an address/query capability, not a promise of literal infinite physical subdivision.

## Observation and materialization

Materialization follows relevance; canonical truth is observation-independent. Observation may trigger computation, caching or presentation. It MUST NOT arbitrarily create or change canonical truth. Mutable canonical events may change truth only through their own explicit temporal/event semantics.

## Multiscale Reality Graph

The semantic universe is a **Multiscale Reality Graph**, not a permanently materialized containment tree. Nodes may represent canonical entities or canonical facts. Edges may be causal, spatial, compositional, temporal or relational. A containment/navigation path is not automatically permanent entity identity.

## Identity and query separation

P2 MUST distinguish:

- `UniverseIdentity` — identifies a semantic universe lineage and root entropy/configuration;
- `CanonicalEntityIdentity` — stable identity of an entity according to its domain contract;
- `QueryContext` — non-identity request context such as location, time, resolution and requested property;
- `ModelRegime` — the semantic model family under which a query/refinement is interpreted.

Current location, containment, ownership and navigation path MUST NOT silently become permanent entity identity. A domain may define identity as location-bound only when that is an explicit semantic rule.

## Resolution dimensions

Spatial resolution, temporal resolution, semantic resolution and model fidelity are orthogonal dimensions. `resolution != fidelity`. Implementations MUST NOT infer one from another without a domain contract.

## Scale bridges

The architecture reserves three explicit cross-scale operations:

- `REFINE`: derive constrained finer detail from coarse canonical facts and context;
- `PROJECT`: aggregate/significance-filter finer events or state into relevant coarse consequences;
- `RECONCILE`: validate that representations satisfy declared cross-scale invariants.

Cross-scale causality must be bounded by significance, aggregation and dependency rules. OFU does not require global brute-force recomputation when local detail changes.

## Model-regime compatibility

A deeper model regime is not assumed to be a smaller classical-object hierarchy. Future quantum-compatible regimes may use state spaces, relations and observables that are not spatial containment. P2 addressing therefore must support typed semantic namespaces and local/regime-specific coordinates rather than one universal meter-coordinate tree.

## Scientific honesty: two dimensions

P2 should formalize two orthogonal metadata dimensions when scientific/model claims become canonical protocol data.

**Evidence Class:** `ESTABLISHED`, `EMPIRICALLY_CONSTRAINED`, `HYPOTHETICAL`, `SPECULATIVE`, `FICTIONAL`.

**Model Fidelity:** `FORMAL`, `HIGH_FIDELITY`, `APPROXIMATE`, `STYLIZED`, `METAPHORICAL`.

The P0 Constitution currently contains composite fidelity labels. They remain valid historical documentation but are not frozen as the P2 byte vocabulary. Migration rule: when a domain is promoted to a P2+ canonical model contract, it must declare the two dimensions explicitly; no automatic one-to-one conversion from a composite legacy label is assumed.

## Universe genesis and law profiles

Alternative initial conditions or law profiles are semantic universe configuration. They belong in the **Semantic Generator Manifest** (or a canonical descriptor committed by it), not as implementation metadata. `UniverseIdentity` remains compact: root seed/entropy plus the hash of the semantic manifest. Therefore a changed genesis/law profile changes the semantic manifest hash and consequently Universe Identity without adding a redundant independent hash field.

Implementation-source hashes belong to an Implementation Manifest and MUST NOT silently change semantic world identity. Conformance corpus/version data belongs to a Conformance Manifest.

## P2 interlock

P2 may freeze bytes only if its identity/address/value/query designs preserve these separations. P2 MUST NOT implement realistic galaxy generation, biology, climate, civilization, quantum simulation or gameplay.
