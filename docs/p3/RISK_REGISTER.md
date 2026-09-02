# P3 Universe Skeleton Risk Register

**Status:** pre-freeze prototype.

| Risk | Severity | Current mitigation | Freeze condition |
| --- | --- | --- | --- |
| P2 final candidate differs from prototype base | Critical | no canonical P3 branch/bytes frozen | rebase from exact `P2_FINAL_CANDIDATE_SHA`, rerun all compatibility tests |
| P3 semantic manifest fragment not yet frozen | High | schema version `0`; explicit prototype manifest in tests | reviewed versioned astronomy manifest included in Universe Identity |
| Galaxy lattice/grid artifacts become visible statistically | High | multiscale continuous density field; per-cell position jitter; distribution diagnostics | spatial autocorrelation/boundary tests and adversarial sample review |
| Computational Sector boundaries leak into physical identity | High | system identity normalized to galaxy + absolute local site, not Sector ID/path | boundary metamorphic vectors frozen |
| Sector boundary changes alter local density abruptly | High | random per-sector occupancy jitter removed; density is radial/vertical deterministic metadata | direct neighboring-sector continuity tests before freeze |
| Simplified galaxy population overstates empirical fidelity | High | evidence/fidelity classes documented; no exact-frequency claim | calibration targets and uncertainty envelopes documented |
| IMF bucket approximation biases intra-bin mass distribution | Medium | only broad P3 skeleton use; shape tests | decide exact integer inverse-CDF or retain approximation explicitly |
| Multiplicity lacks full period/q/e distribution | Medium | only bounded system/component metadata in P3 | document as stylized final or adopt compact cited parameterization |
| Planet occurrence law is over-generalized across stellar hosts | High | broad host-mass/metallicity/multiplicity dependence; no strong age law | deterministic calibration or explicit stylized scope |
| Moon occurrence is weakly constrained | High | HYPOTHETICAL/STYLIZED classification | do not upgrade evidence class without stronger literature support |
| Integer proxy ranges hide unit/rounding ambiguity | High | explicit units in contract; P2 integer primitives | normative field-by-field range/rounding table before schema v1 |
| Browser/runtime divergence | Critical for closure | current direct/Node Worker evidence only | execute declared browser/OS matrix against frozen P3 corpus |
| Working set grows through future caches/indexes | High | core resolver is stateless and non-enumerative | explicit cache/entity budgets and peak-working-set evidence |
| Whole-universe indexes introduced for search convenience | Critical | no global index exists | keep indexes derived/bounded and never required for canonical resolution |
