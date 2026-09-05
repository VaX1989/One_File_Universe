# WV-E Scientific Scope and Provenance Matrix

## Status

Research-only synthesis dated 2026-09-05. This matrix distinguishes reusable modeling ideas from claims that OFU can already make. None of the cited methods is automatically an OFU canonical model.

## State of the art → architectural consequence

| Area | Evidence / source | Supported lesson for WV-E | What WV-E does **not** infer |
|---|---|---|---|
| Multicellular agent + field simulation | Ghaffarizadeh et al., *PLOS Comput Biol* 2018, doi:10.1371/journal.pcbi.1005991 (PhysiCell) | Coupling cell agents to diffusing microenvironment fields is an established modeling pattern; published implementations can scale to large cell counts for scoped problems. | No claim that one cell-agent formalism is universally biological or that PhysiCell parameters apply to arbitrary life. |
| Cell-based + ODE + reaction-diffusion integration | Starruß et al., *Bioinformatics* 2014, doi:10.1093/bioinformatics/btt772 (Morpheus) | Different mathematical submodels can coexist behind explicit coupling contracts. | No universal coupling law or parameterization. |
| Multiscale tissue modeling limits | Fletcher & Osborne, *WIREs Mech Dis* 2022, doi:10.1002/wsbm.1527 | Construction, calibration, numerical solution, validation, standards/benchmarks and comparison of assumptions remain open challenges. | Complexity alone is not fidelity or validation. |
| Spatial cell reaction/transport | Francis et al., *Nature Computational Science* 2025 issue / online 2024, doi:10.1038/s43588-024-00745-x (SMART) | Realistic compartment geometry plus mixed-dimensional reaction/transport PDEs is a defensible high-detail cell regime when geometry and kinetics are supported. | No claim that every cell needs a full FEM mesh or that morphology alone determines kinetics. |
| Particle reaction-diffusion | Hoffmann et al., *PLOS Comput Biol* 2019, doi:10.1371/journal.pcbi.1006830 (ReaDDy 2) | Particle-based reaction/diffusion can represent crowded nano/microscale kinetics with interactions and reactions. | No automatic mapping from coarse biochemical rates to unique particle trajectories. |
| Whole-cell integration | Karr et al., *Cell* 2012, doi:10.1016/j.cell.2012.05.044 | Heterogeneous process submodels can exchange shared state on a synchronization cadence; whole-cell integration is possible for tightly scoped organisms/models. | Not a generic complete cell simulator; does not justify extrapolating one organism's biology to arbitrary organisms. |
| Systems-biology model interchange | SBML Level 3 Version 2 Core Release 2, 2019, SBML.org | External reaction/network models should retain explicit schema/version/provenance rather than being flattened into ad-hoc fields. | SBML Core alone does not define spatial/tissue/molecular dynamics. |
| Equation/units model interchange | CellML 2.0 normative specification | Units are first-class model semantics and should be validated during coupling. | CellML is not an OFU identity or authority standard. |
| Simulation experiment reproducibility | SED-ML Level 1 Version 5 | Integrator/simulation setup is part of reproducibility, not disposable runtime metadata when making scientific claims. | An encoded experiment does not validate the model. |
| Coarse-grained biomolecular modeling | Souza et al., *Nature Methods* 2021, doi:10.1038/s41592-021-01098-3 (Martini 3) | Coarse graining is a distinct physical model with mappings and calibrated interactions; it can access larger systems/timescales than atomistic detail. | A CG bead cannot be deterministically expanded into a unique true atomistic conformer. |
| Adaptive molecular resolution | Cortes-Huerto et al., *Eur Phys J B* 2021, doi:10.1140/epjb/s10051-021-00193-w | Locally high resolution coupled to a coarser reservoir is scientifically meaningful when thermodynamic coupling is explicitly constructed and validated. | OFU's cache/refinement mechanism is not itself AdResS and does not inherit AdResS thermodynamic validity. |
| Atomic structural representation | wwPDB PDBx/mmCIF dictionaries/format | Source-backed atom coordinates need source IDs, coordinate units, model/alt-location semantics and experimental metadata. | Deposited coordinates alone do not define molecular dynamics, protonation, electronic state or reaction path. |
| QM/MM | Sousa et al., *J Chem Inf Model* 2023 best-practices review, PMID 37100031; related QM/MM literature | Chemical reactivity/electronic-structure change requires a method that goes beyond classical force fields; hybrid boundaries require careful setup and validation. | Classical geometry does not uniquely determine a quantum state or authorize a universal “quantum zoom.” |

## Scientific-status matrix for this branch

| Item | Evidence class | Fidelity | Visualization authority | Dynamical authority | Canonical eligibility now |
|---|---|---|---|---|---|
| Dimensional unit compatibility | ESTABLISHED / FORMAL | FORMAL | n/a | n/a | Architecture candidate only; numeric encoding unresolved |
| REFINE/PROJECT/RECONCILE bridge semantics | FORMAL architecture | FORMAL | n/a | n/a | Consistent with existing OFU concepts; not promoted here |
| 2-D conservative diffusion stencil | ESTABLISHED numerical principle | APPROXIMATE | REPRESENTATIONAL | LOCAL_RESEARCH | NO |
| Cell uptake agent rule | HYPOTHETICAL fixture rule | APPROXIMATE | REPRESENTATIONAL | LOCAL_RESEARCH | NO |
| Tissue prototype as biology | HYPOTHETICAL | APPROXIMATE | REPRESENTATIONAL | LOCAL_RESEARCH | NO |
| Source-backed PDBx/mmCIF-like atomic coordinates | EMPIRICALLY_CONSTRAINED when actual source is bound | source-dependent | SOURCE_BACKED | NONE | NO in this lane |
| Synthetic bead→atom backmap | FICTIONAL | STYLIZED/APPROXIMATE geometry | REPRESENTATIONAL | NONE | NEVER as physical conformer evidence |
| Coarse-grained MD future adapter | EMPIRICALLY_CONSTRAINED method-dependent | method-dependent | REPRESENTATIONAL | NONE until engine/protocol bound | NO |
| Atomistic MD future adapter | EMPIRICALLY_CONSTRAINED method-dependent | method-dependent | SOURCE_BACKED/REPRESENTATIONAL | NONE until force field/protocol bound | NO |
| QM/MM future adapter | EMPIRICALLY_CONSTRAINED/HYPOTHETICAL method-dependent | method-dependent | method-dependent | NONE in WV-E | NO |
| “Quantum universe” | UNSUPPORTED | METAPHORICAL at best | NONE | NONE | FORBIDDEN by lane scope |

## Uncertainty contract candidate

Every quantitative bridge should distinguish at least:

- `measurement`: uncertainty in upstream observations/data;
- `parameter`: uncertainty in fitted or empirical parameters;
- `initialCondition`: uncertainty in local microscopic initialization;
- `modelDiscrepancy`: known mismatch between abstraction and target system;
- `sampling`: finite-ensemble / stochastic error;
- `numerical`: discretization/integration error;
- `representation`: visualization/backmapping ambiguity.

A single generic “confidence” scalar is insufficient because these sources propagate differently.

## Fail-closed rules

1. Missing required regime parameters or boundary conditions → do not invent them.
2. Unsupported cross-regime unit conversion → reject.
3. Requested dynamics from visualization-only data → reject.
4. Requested unique atomistic detail from a coarse representation → return an ensemble/synthetic representation label, never “the true atoms.”
5. Reconciliation failure → invalidate authoritative refinement; rendering may display diagnostic output only with explicit status.
6. Unknown electronic/non-classical state → no quantum-state claim.
