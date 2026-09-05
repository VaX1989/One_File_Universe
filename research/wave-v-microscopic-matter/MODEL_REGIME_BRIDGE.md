# WV-E ModelRegime Bridge Specification — Research Candidate v0

## 1. Architectural invariant

OFU already distinguishes `CanonicalEntityIdentity`, `QueryContext`, and `ModelRegime`, and reserves `REFINE`, `PROJECT`, and `RECONCILE`. WV-E keeps those meanings.

A microscopic representation is **not** created by appending smaller metric coordinates to a containment tree. Crossing a regime boundary is legal only through an explicit bridge whose input commitments, output observables, reference frames, units, time semantics, uncertainty and reconciliation rules are declared.

`resolution != fidelity != authority`.

## 2. Regime descriptor

A future promoted descriptor should bind at least:

```text
ModelRegimeDescriptor {
  regimeId
  semanticVersion
  purpose
  evidenceClass
  modelFidelity
  visualizationAuthority
  dynamicalAuthority
  identityPolicy
  unitContract
  coordinateFrameContract
  timeContract
  observableContract[]
  boundaryConditionContract
  uncertaintyContract
  computationalBounds
  transitionContract?        // only if persistent mutable truth is owned
}
```

The research implementation keeps this descriptor intentionally narrower and noncanonical.

## 3. Identity adapter

Two identities must remain separate:

1. `CanonicalEntityIdentity`: stable semantic entity identity owned by a domain contract.
2. `RepresentationIdentity`: identity of a particular regime-local representation, derived from `{entityId, regimeId, localAddress, epoch}` for caching/testing.

Refinement MUST NOT silently rename a canonical entity. A tissue patch, cell mesh, coarse-grained bead system or atomic view is a representation unless a future domain contract explicitly creates new canonical entities.

## 4. Units adapter

Every numeric observable crossing a bridge must carry dimensions and a declared scale. Compatibility is dimensional, not based on symbol text.

The research prototype uses SI-dimension exponent vectors and JavaScript `Number` only for experimentation. This is **not** a proposed P2 canonical numeric encoding. A promoted bridge needs a deterministic numeric representation compatible with the canonical protocol or an explicit future protocol version.

## 5. Coordinate/reference-frame adapter

Permitted examples include:

- `BODY_LOCAL` / organism-local;
- `TISSUE_PATCH_LOCAL`;
- `CELL_LOCAL`;
- `ORGANELLE_LOCAL`;
- `MOLECULE_LOCAL`;
- internal/non-spatial state coordinates.

An adapter must state transform provenance and precision. There is no universal assumption that every future regime is embedded as smaller Euclidean world coordinates.

## 6. Time adapter

Each regime declares its intrinsic integration model and nominal timescale. Bridge synchronization is explicit:

```text
slow boundary state
  -> hold / interpolate under declared rule
  -> N bounded fast substeps
  -> PROJECT time-windowed observables
  -> RECONCILE
  -> optional coarse transition proposal
```

Fine simulation time does not become P4 canonical history automatically. Persistent truth changes require a future versioned domain transition contract under P4 semantics.

## 7. Observable adapter

Only declared observables may cross a bridge. Examples:

- tissue → organism: cell counts, integrated fluxes, stress summaries, bounded signaling summaries;
- cell → tissue: uptake/secretion fluxes, phenotype state under an explicit model;
- molecular → cell: reaction-rate or free-energy summaries only when an authorized molecular model supports them;
- atomic structure → molecular visualization: coordinates/composition/experimental uncertainty;
- synthetic backmap → viewer: display geometry only.

Fine internal state is not automatically a coarse observable.

## 8. Boundary-condition adapter

A bridge must state which coarse commitments constrain fine state: geometry, composition, temperature/pressure assumptions, concentrations, fluxes, mechanics, membrane interfaces, external fields, or other domain quantities. Missing required boundary authority fails closed rather than being filled with decorative defaults.

## 9. Uncertainty and fidelity

Each crossing carries two independent dimensions inherited from OFU:

- Evidence: `ESTABLISHED | EMPIRICALLY_CONSTRAINED | HYPOTHETICAL | SPECULATIVE | FICTIONAL`.
- Fidelity: `FORMAL | HIGH_FIDELITY | APPROXIMATE | STYLIZED | METAPHORICAL`.

Additional adapter uncertainty must identify whether it represents measurement uncertainty, parameter uncertainty, model discrepancy, sampling error or purely representational uncertainty. These categories are not interchangeable.

## 10. REFINE

`REFINE(coarseState, query, budget) -> RefinementEnvelope`

Required properties:

- pure with respect to canonical truth unless explicitly bound to a transition contract;
- bounded node/depth/time budget;
- deterministic for deterministic providers and inputs;
- inherited coarse commitments listed explicitly;
- regime/local address declared;
- unresolved inputs surfaced rather than invented.

## 11. PROJECT

`PROJECT(fineState, targetRegime) -> ProjectionEnvelope`

Projection is aggregation/significance filtering, not serializing the entire fine state. It must specify observables, aggregation windows, units and uncertainty.

## 12. RECONCILE

`RECONCILE(coarseCommitments, projection) -> Witness`

Witnesses are domain-specific. Candidate classes include:

- conservation: mass/amount/charge/energy where the model claims conservation;
- geometry: projected volume/area within declared tolerances;
- population: fine counts sum to coarse commitments;
- flux: integrated fine flux matches coarse boundary exchange;
- composition: atom/bead/species projections preserve declared stoichiometry;
- statistical: fine ensemble observables fall inside declared uncertainty envelopes.

A failed witness invalidates the refinement for authoritative use; it must not be hidden by rendering.

## 13. Materialization tiers

The research prototype interprets P4's COLD/WARM/HOT/IMMEDIATE scheduling concept only as work planning:

- `COLD`: identity/descriptor/aggregate only;
- `WARM`: bounded regional fields and aggregate biological state;
- `HOT`: local cell/tissue or molecular coarse state;
- `IMMEDIATE`: short-lived finest requested state under strict local budget.

Tier choice can alter work performed and cache residency, but **not canonical truth**. Cache eviction is non-authoritative.

## 14. Target regime ladder

```text
organism
  REFINE -> tissue
  REFINE -> cell population
  REFINE -> single cell
  REFINE -> organelle / compartment
  REFINE -> molecular complex
  REFINE -> coarse molecular representation
  REFINE -> source-backed or model-generated atomic representation
```

Every arrow may be unavailable. Missing levels are legal. Direct adapters may exist when scientifically justified. No arrow is implied solely by zoom level.

## 15. Non-classical interlock

A future non-classical regime is not the next geometric child of `atomic`. It requires a separate state/observable contract and method-specific bridge. See `NON_CLASSICAL_BOUNDARY.md`.
