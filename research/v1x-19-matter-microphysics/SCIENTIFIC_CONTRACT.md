# V1X-19 scientific contract

Authority: **RESEARCH ONLY / MODEL_DERIVED_SIMULATION candidate**. This lane does not modify or supersede shipping microphysics.

## Regime taxonomy

| Regime | Geometry | Relationship | Validity / assumptions / limitations |
|---|---|---|---|
| object/organism context | upstream only | formal identity context | only IDs/provenance already supplied upstream; nothing inferred |
| tissue context | upstream only | formal identity context | biological provider must supply tissue identity |
| cell context | upstream only | formal identity context | biological provider must supply cell identity |
| material anchor | semantic descriptor | formal ancestry + source/model descriptors | sample/bulk descriptor, never particle inventory |
| microstructure RVE | representative volume | approximate or source-backed | bounded local representation; RVE adequacy is material/property dependent and never universal |
| molecular topology | representative units/topology | source-backed or representative | chemistry must be resolved; repeated units are samples, not exact bulk counts/positions |
| atom-site structure | bounded atom sites | experimental structural model, computed structure, or presentation-only | source method/authority preserved; atom sites are not trajectories |
| non-classical boundary | no classical electron geometry | formal research boundary | quantum provider required; no electron orbit/trajectory/wavefunction/dynamics claim |

No universal distance cutoffs are claimed. Regime choice depends on system and observable; renderer scale thresholds are presentation policy, not physical law.

## Sources and authority

1. **CIAAW Standard Atomic Weights 2024** — https://ciaaw.org/atomic-weights.htm — accessed 2026-09-06. Critically evaluated reference for standard atomic weights of normal materials. Several elements are intervals because isotopic composition varies. Standard atomic weight does not identify a specific isotope/isotopologue. Prototype stores a small fixed-point Q9 subset only.
2. **NIST Atomic Weights and Isotopic Compositions** — https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses — accessed 2026-09-06. Reference/definition cross-check. NIST notes the compilation is provided for convenience and is not a fresh critical evaluation; CIAAW 2024 is primary here.
3. **NIST CCCBDB** — https://cccbdb.nist.gov/ — accessed 2026-09-06. Experimental/computational comparison database. Future adapter must retain species/state/property/reference and experimental-vs-calculated status. No CCCBDB coordinates are embedded.
4. **IUCr CIF** — https://www.iucr.org/what-we-do/digital-standards/cif — accessed 2026-09-06. Formal crystallographic exchange standard, not physical authority by itself. A future adapter must retain dictionary/version, cell, symmetry, occupancy, method, uncertainty and provenance.
5. **RCSB/wwPDB PDBx/mmCIF** — https://mmcif.rcsb.org/docs/user-guide/guide.html — accessed 2026-09-06. Structural archive schema carrying experimental method, entity, source, coordinates and citations. Deposited coordinates are refined/interpreted structural models; resolution, occupancy, alternate conformations and method matter.
6. **Materials Project methodology** — https://docs.materialsproject.org/methodology/materials-methodology/calculation-details — accessed 2026-09-06. Computed/model-derived DFT workflow. Its relaxed structures must remain `MODEL_DERIVED_COMPUTED_STRUCTURE`, never be relabeled experimental.
7. **IUPAC Gold Book orbital terminology** — atomic orbital DOI 10.1351/goldbook.A00500 and orbital DOI 10.1351/goldbook.O04317 — accessed 2026-09-06. Formal terminology grounded in quantum mechanics; supports the explicit non-classical boundary, not a quantum solver.
8. **NIST/CODATA 2022 constants** — https://physics.nist.gov/constants — accessed 2026-09-06. Evaluated constants for future quantitative providers; no dynamics are implemented here.

## Relationship ledger

- Element counts + CIAAW standard-atomic-weight intervals -> molecular/formula-unit mass interval: **formal integer arithmetic over empirical/reference intervals**. Valid for element-level standard-atomic-weight ranges; not exact isotopologue mass.
- Source coordinates -> integer femtometres: **formal normalization** only after an adapter establishes units/frame and declares decimal parsing/rounding. The prototype accepts integers only so float quantization cannot silently enter identity.
- PDBx/mmCIF coordinate model -> experimental structural authority: **source-backed experimental structural model**, with method/resolution/occupancy limitations retained.
- Materials Project relaxed structure -> computed structural authority: **computed/model-derived**, never experimental.
- Microfeature list -> RVE: **approximate/model-derived or source-backed**; not whole-object geometry and no universal RVE sufficiency claim.
- Resolved chemistry -> repeated bounded molecular units: **representative/stylized model**; no exact bulk inventory or molecular dynamics.
- Deterministic atom packing from element counts: **presentation-only stylization**; coordinates are not physical structure.
- Normalized source atom sites -> bounded atom-site representation: **formal preservation of source authority**; truncation to resource cap prevents whole-object claims.
- Atom sites -> electronic refinement: **formal fail-closed boundary**; future non-classical provider required.
- Canonical material/context -> deterministic address: **formal computational relationship**. Full canonical key is identity; FNV-1a-64 is only a compact deterministic hint and collisions require full-key comparison.
- Representation counts -> byte estimate: **approximate engineering estimate**, explicitly not measured runtime evidence.

## Determinism and addressing

Standard atomic weights use decimal Q9 strings and `BigInt`; interval propagation is integer-only. Normalized atom coordinates use integer femtometres. This is an engineering quantization container, not a precision claim. A promoted source adapter must retain original values, units, uncertainty/resolution, transform and declared rounding policy.

Addresses include the full canonical key plus a 64-bit checksum. Equality must use the full key. The checksum is not cryptographic and must not be treated as scientific/security authority.

## Resource and continuity contract

Research caps: context 8; source refs 32; microfeatures 128; molecular units 64; atom sites 256; retained representations 4. `resources()` fails closed above caps. Its byte count is only `MODEL_DERIVED_ESTIMATE_NOT_MEASURED_RUNTIME_EVIDENCE`; V1X-11 owns promoted budgets and measured runtime evidence.

`REFINE` is used for material -> RVE and requests below atom sites. `PROJECT` is used for material -> molecular and molecular -> atom-site semantic regime changes. `RECONCILE` requires exact source identity, material key and return-context token. Every witness declares `geometricZoomClaim:false`.

## Explicit quantum boundary

Unsupported: classical electron orbits/trajectories; exact electron positions; exact many-electron wavefunctions; time-dependent quantum dynamics; ab-initio molecular dynamics; reactive chemistry; tunneling/entanglement simulation; nuclear reactions. A future quantum provider must state Hamiltonian/model, approximations, basis/discretization, boundary conditions, state, convergence, uncertainty, resources and provenance.

## Known unsupported

No full periodic/isotope table; no formula parser; no bond inference/order/charges/force fields; no MD/Monte Carlo/phonons/plasticity/fracture/diffusion/phase-transition solver; no exact tissue/cell composition; no CIF/PDBx/mmCIF/Materials Project parser; no external coordinate data bundled; no browser/mobile/performance measurement; no P4 event mutation; no renderer.

## Promotion prerequisites / shipping extraction

Promotion requires convergence-owner approval for protected paths; scientific review of taxonomy/authority/reference data; provenance/license review; generated/pinned source tables with independent transcription checks; schema-aware source adapters with units/method/uncertainty/occupancy/disorder handling; deterministic cross-engine tests and explicit float-to-fixed conversion rules; full-key collision handling; V1X-11 measured budget integration; V1X-09 visual distinction of experimental/computed/stylized fidelity; P4 ownership of temporal/event semantics; cross-scale return-context preservation; and adversarial conformance for authority escalation, unit drift, missing provenance, unresolved chemistry, budget overflow, checksum collision and quantum-boundary violations.

Extraction should be narrow: provenance-aware material descriptors, generated fixed-point reference properties, optional molecular mass intervals, bounded source atom sites, return-context tokens, V1X-11 budget mapping, V1X-09 fidelity labels, and the quantum fail-closed boundary. This lane has no authority to perform those shipping edits.
