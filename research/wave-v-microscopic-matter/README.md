# Wave V Lane WV-E — Microscopic Biology / Matter Regimes

**Mode:** `RESEARCH_ONLY`  
**Authorized branch:** `research/wave-v-microscopic-matter-2026-09-05`  
**Bootstrap source only:** `main` at `44f6e068d7d513c8746f23fb7580572758dc2ece` / tree `cac4aef25aec7a9f98e8fe388a60cab7e8e963bc`  
**Wave V parallel base:** UNRESOLVED — this branch is **not** a convergence or promotion candidate until Prompt 0 publishes the exact Wave V SHA/tree and ownership manifest.

This directory is deliberately isolated research. It does not modify production/runtime surfaces, does not rewrite P2–P6 history, and makes no canonical microscopic or non-classical claims.

## Mission result

The lane establishes a bridge architecture in which organism/tissue/cell/molecular/atomic representations are distinct `ModelRegime`s with explicit adapters for:

- identity and representation identity;
- units and dimensional compatibility;
- coordinates/reference frames;
- time scales and integration ownership;
- observables;
- boundary conditions;
- uncertainty/evidence/fidelity;
- `REFINE`, `PROJECT`, and `RECONCILE`;
- bounded COLD/WARM/HOT/IMMEDIATE materialization.

Geometric zoom is never sufficient evidence to cross a model boundary.

## Artifacts

- `MODEL_REGIME_BRIDGE.md` — bridge contract candidate and regime ladder.
- `SCIENTIFIC_SCOPE.md` — state-of-art provenance, evidence/fidelity matrix, and scientific claim boundaries.
- `NON_CLASSICAL_BOUNDARY.md` — research-only boundary for possible future QM/classical coupling; explicitly not a “quantum universe”.
- `PERFORMANCE.md` — bounded complexity model and local microbenchmarks.
- `prototype/model-regime.mjs` — generic research bridge primitives and unit/regime descriptors.
- `prototype/micro-materialization.mjs` — sparse, bounded, deterministic local materialization prototype.
- `prototype/cell-tissue.mjs` — conservative 2-D agent/field research prototype.
- `prototype/molecular-adapter.mjs` — source-backed versus synthetic molecular/atomic representation adapter.
- `fixtures/reconciliation-corpus.json` — deterministic invariant corpus.
- `tests/run.mjs` — compatibility, determinism, conservation and reconciliation witnesses.
- `tests/benchmark.mjs` — non-portable local research microbenchmark.

## Authority split

| Regime / adapter | Visualization authority | Dynamical authority | Canonical authority |
|---|---|---|---|
| Tissue agent/field prototype | REPRESENTATIONAL | LOCAL_RESEARCH | NONE |
| Single-cell spatial descriptor | REPRESENTATIONAL | NONE in this lane | NONE |
| Coarse molecular descriptor | REPRESENTATIONAL | NONE unless an external validated protocol is explicitly bound | NONE |
| Source-backed atomic coordinates | SOURCE_BACKED structural representation | NONE by coordinates alone | NONE |
| Synthetic bead→atom backmap | REPRESENTATIONAL only | NONE | NONE |
| Future non-classical regime | NONE in this lane | NONE | NONE |

A visualization can be scientifically useful without being a dynamical microstate. A source-backed structure can be an authoritative representation of deposited coordinates while still having **no** authority to assert a molecular trajectory or reaction mechanism.

## Focused verification

`node research/wave-v-microscopic-matter/tests/run.mjs`

Local research result before commit: **PASS**, 18 checks. The primary tissue fixture ran 200 steps on a `24×24` grid with 32 agents and conserved the prototype's closed-system mass-like quantity to a discrepancy of approximately `3.4e-13`.

## Implementation completeness vs promotion readiness

**Research implementation completeness:** COMPLETE for the WV-E RESEARCH_ONLY deliverable set listed above. The lane contains a bridge spec, materialization prototype, bounded cell/tissue dynamics prototype, molecular representation adapter, scale/time/unit tests, reconciliation witnesses, scope matrix, non-classical boundary and performance estimates.

**Promotion readiness:** BLOCKED. Required blockers include:

1. Prompt 0 must publish the exact `WAVE_V_PARALLEL_BASE_SHA`, tree, and ownership manifest, then this research must be rebaselined exactly.
2. P2 canonical values currently exclude floating point and only freeze a narrow deterministic numeric contract; microscopic continuous dynamics therefore cannot become canonical by copying these research Numbers into production.
3. No domain-specific calibration/validation package currently establishes general biological authority for the tissue/cell prototype.
4. Atomic coordinates alone do not authorize dynamics; any MD/CG/QM-MM authority requires an explicit versioned method, force field/Hamiltonian, ensemble, boundary conditions, integrator, sampling protocol, provenance and validation scope.
5. Cross-regime uncertainty propagation and time synchronization need domain-specific quantitative contracts before promotion.

**Lane verdict:** `MICROSCOPIC MATTER FRONTIER ADVANCED — RESEARCH-ONLY CANDIDATE COMPLETE; CANONICAL PROMOTION BLOCKED`.
