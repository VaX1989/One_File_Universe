# Multiscale Reality Architecture

**Status:** accepted forward architecture with P2 compatibility constraints preserved. The founder has authorized v1.0 model-derived implementation through the [active program contract](governance/V1_IMPLEMENTATION_CONTRACT.md). This does not authorize an unpromoted model to claim canonical scientific certification.

## 1. Progressive, bounded refinement

OFU supports progressively extensible procedural refinement across **supported** model regimes while maintaining a finite materialized working set. This is an address/query capability, not a promise of literal infinite physical subdivision.

Canonical truth is observation-independent. Observation may trigger computation, caching, late materialization or presentation. It does not arbitrarily create canonical truth. Mutable truth changes only through an authorized temporal/domain event contract.

## 2. Multiscale Reality Graph

The semantic universe is a **Multiscale Reality Graph**, not a permanently materialized containment tree. Nodes may represent canonical entities, canonical facts or authority-tagged derived state. Edges may be causal, spatial, compositional, temporal or relational. A navigation path is not automatically entity identity.

P2 separations remain fundamental:

- `UniverseIdentity` — semantic universe lineage/root configuration;
- `CanonicalEntityIdentity` — stable identity according to a domain contract;
- `QueryContext` — location, time, resolution, requested property and other non-identity context;
- `ModelRegime` — semantic model family used for a query/refinement.

Spatial resolution, temporal resolution, semantic resolution and model fidelity are orthogonal. `resolution != fidelity`.

## 3. Long-range semantic ladder

The architecture should be able to host, where supported:

1. Universe;
2. cosmic structure;
3. galaxy;
4. galactic region;
5. sector;
6. stellar neighborhood;
7. stellar system;
8. star;
9. planet / moon;
10. orbit;
11. atmosphere / approach;
12. global surface;
13. continental / planetary region;
14. regional geography;
15. local geography;
16. human scale;
17. ecosystem;
18. organism;
19. plant / animal / intelligent organism or non-Earth analogue;
20. organ / tissue;
21. insect / larva / small-organism detail where relevant;
22. microbial scale;
23. bacterium / archaea / unicellular organism or analogue;
24. cell;
25. subcellular structure / organelles;
26. molecular complexes;
27. molecular regime;
28. atomic regime;
29. future deeper/non-classical model regimes.

This list is a capability taxonomy, not a claim that every item is implemented or that each item is a child object of the previous item.

## 4. Scale bridges

The architecture reserves three explicit operations:

- `REFINE`: derive constrained finer detail from coarse authoritative facts plus query context;
- `PROJECT`: aggregate or significance-filter finer events/state into relevant coarser consequences;
- `RECONCILE`: validate that representations satisfy declared cross-scale invariants.

Cross-scale causality must be bounded by significance, aggregation and dependency rules. OFU does not require global brute-force recomputation after every local change.

## 5. CROSS_SCALE_CONTINUITY invariant

A representation at one scale must not be replaced by unrelated content at another scale when the two claim to represent the same world truth.

Examples of intended constraints:

- planetary-scale physical geography constrains regional geography;
- regional geography constrains local terrain and hydrology;
- atmosphere/climate constrains biome eligibility;
- biome/ecosystem state constrains organism materialization;
- organism/anatomy state constrains tissue/cellular representations;
- civilization history constrains settlement form, artifacts and ruins;
- resource depletion, construction, ecological damage or other significant local effects can be projected to coarser state through governed rules.

Continuity may be exact, bounded-approximate or statistical depending on the domain, but the relationship and error/fidelity class must be explicit.

## 6. Canonical, derived and presentation relationships

**Canonical:** versioned facts/events that define portable world truth.  
**Derived:** recomputable simulation/materialization constrained by canonical state.  
**Presentation:** visual/audio/UI approximations that communicate canonical/derived state but have no world-truth authority.

A presentation skirt fixing an LOD crack is not terrain science. A visually plausible cloud layer is not a canonical atmosphere. A local render anchor is not canonical geodesy unless a domain contract says it is.

## 7. Regime transitions

A regime transition contract should declare:

- source/target regime IDs and versions;
- entity/identity continuity or explicit identity change;
- coordinate/reference-frame mapping where applicable;
- state variables/observables exposed across the boundary;
- units and numeric semantics;
- uncertainty/evidence/fidelity mapping;
- `REFINE` constraints;
- `PROJECT` significance rules;
- `RECONCILE` tests;
- unsupported directions or lossy projections;
- cost/materialization budget.

A deeper regime is not assumed to be smaller classical geometry.

## 8. Microscopic biological frontier

Future local late materialization can move from organism to organ/tissue, cellular population, single cells, organelles and molecular complexes. This does not require every organism to retain every cell.

Semantic continuity should preserve, where the model supports it, organism identity, anatomy/region relation, cell lineage/type/state, material/energy constraints, environment coupling and historical injuries/interventions. Population summaries can remain canonical while individual cell instances are derived/ephemeral unless a future contract promotes them.

Mechanistic cellular models may use different time steps, stochastic semantics or continuous fields than organism/ecology models. Adapters, not shared global coordinates, define their composition.

## 9. Molecular and atomic frontier

Molecular representations may expose structures, complexes, reactions or coarse-grained interaction state where a versioned model can justify them. Visualization of molecules is not equivalent to canonical molecular dynamics. Atomistic models may be local, bounded and query-driven rather than universe-wide.

## 10. Quantum-compatible future

The architecture deliberately reserves future `NONCLASSICAL_RESEARCH` regimes. It does not promise a brute-force quantum simulation of the universe.

Future non-classical regimes may use state spaces, amplitudes/probabilities, observables, operators or effective models that do not map to literal nested objects. Compatibility with coarser classical facts requires explicit measurement/coarse-graining/reconciliation contracts. Scientific status remains `RESEARCH` or `SPECULATIVE` until independently justified and promoted.

## 11. Scientific status dimensions

Two orthogonal dimensions remain recommended for promoted model metadata:

**Evidence Class:** `ESTABLISHED`, `EMPIRICALLY_CONSTRAINED`, `HYPOTHETICAL`, `SPECULATIVE`, `FICTIONAL`.

**Model Fidelity:** `FORMAL`, `HIGH_FIDELITY`, `APPROXIMATE`, `STYLIZED`, `METAPHORICAL`.

Unknown and unsupported remain meaningful states. A more detailed representation does not automatically have higher scientific fidelity.

## 12. Genesis and law profiles

Alternative initial conditions or law profiles remain semantic universe configuration committed through the Semantic Generator Manifest or a descriptor bound by it. Implementation-source hashes remain implementation metadata. A changed semantic law/genesis profile changes semantic lineage; it does not masquerade as the same Universe Identity.

## 13. No false infinity claim

The address/model architecture may admit enormous or potentially unbounded refinement domains. Actual implemented model regimes are finite, versioned and declared. OFU's defensible target language is **progressively extensible, sparse, query-driven multiscale reality with bounded materialized working sets**.
