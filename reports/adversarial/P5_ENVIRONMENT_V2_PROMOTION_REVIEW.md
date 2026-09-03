# P5 Environment v2 — Independent Adversarial Promotion Review

Review target: `feature/p5-environment-v2-canonical` against frozen main baseline `89e32fd90fc4b56594e78cf3648a0708ff2cfe79`.

## Scope reviewed

Scientific normalization, units, volatile authority, reference-mass semantics, hidden floating authority, overflow/domain rejection, Semantic Manifest lineage, P5 v1 preservation, P4 temporal ownership, epistemic labeling, Golden evidence, sparse working set and cross-runtime drift.

## Findings

### MATERIAL BLOCKER — corrected radiative normalization

**Finding:** research Tier-0 used a normalization equivalent to `278.3 * [S(1-A)/0.7]^(1/4)`, yielding about 278 K at Earth-normalized forcing and `A=0.3` instead of the expected effective radiating temperature near 255 K.

**Disposition:** FIXED. Canonical candidate re-derives absorbed stellar power versus emitted thermal power and freezes `T_eff=[S(1-A)/(4 sigma)]^(1/4)` with IAU nominal solar irradiance and NIST/CODATA Stefan–Boltzmann constant. Golden Earth anchor is `254578 mK`. No surface-temperature claim remains.

### MATERIAL BLOCKER — research volatile prior would invent atmosphere

**Finding:** broad research draws for total volatiles and atmospheric partition are `HYPOTHETICAL / STYLIZED` and not sufficiently calibrated as a universal 1–8 Mearth terrestrial genesis prior.

**Disposition:** FIXED by scope reduction. Canonical Environment v2 uses `NO_CANONICAL_GENESIS`; it promotes absolute-mass schema, conservation and pressure law but leaves atmospheric inventory/pressure `UNKNOWN` in genesis projection.

### MATERIAL BLOCKER — Environment v2 generator lineage cannot reuse P5 v1 physical manifest

**Finding:** research derivation used the frozen P5 v1 semantic-manifest hash.

**Disposition:** FIXED. Candidate owns a dedicated P2-validated Environment v2 Semantic Generator Manifest and separate derivation namespace/domain. Manifest hash is `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`.

### MATERIAL BLOCKER — Golden digest initially failed to cover the frozen shipped output vector

**Finding:** after freezing the first cross-runtime Environment v2 output, the earlier candidate `corpusDigest` still described the pre-vector normative payload.

**Disposition:** FIXED. `golden-p5-environment-v2-corpus-v1` now includes the shipped cross-runtime planet/physical/environment digests. Its digest is defined as SHA-256 over OFU-CBV-1 encoding of the corpus with the self-referential `corpusDigest` field omitted, and executable conformance recalculates it. Frozen digest: `ac33ba776976d1381a841426fb7e0fbb0276877e98565261bfdec2bca598d7a4`.

### IMPORTANT NON-BLOCKER — deterministic pi approximation

**Finding:** global spherical area requires pi; candidate freezes rational `355/113` rather than a native floating constant.

**Disposition:** ACCEPTED WITH EXPLICIT APPROXIMATION. Error is negligible for the declared approximate spherical/global-column model and the rational is deterministic. A future higher-fidelity pressure model requires a new law profile rather than silently changing this constant.

### IMPORTANT NON-BLOCKER — no canonical Bond-albedo model

**Finding:** Tier-0 temperature cannot become an actual planet value without Bond albedo.

**Disposition:** ACCEPTED BY EPISTEMIC CONTRACT. Actual Bond albedo and therefore actual `T_eff` remain `UNKNOWN`; the deterministic law accepts explicit governed albedo and the v2 projection exposes only the full physical `0..1` albedo-domain envelope. This is intentionally not a prior.

### FOLLOW-UP — physical lower-bound temperature at zero absorbed stellar forcing

**Finding:** the Tier-0 mathematical model returns `0 K` at zero forcing/full reflection because internal heat, CMB/background radiation and greenhouse terms are outside the model.

**Disposition:** ACCEPTED AS MODEL BOUNDARY, not literal full-physics planetary temperature. Contract names this a Tier-0 radiative reference and records the exclusions. Any background/internal heat floor requires a future version.

### FOLLOW-UP — atmosphere transition history

**Finding:** schema can represent state but no endogenous loss/evolution law is promoted.

**Disposition:** CORRECT. XUV history and upper-atmosphere state are insufficient; P4 remains time/order authority. Future transition work requires a separately versioned P4-bound P5 reducer.

### REJECTED — promote water/XUV/geology because research code exists

**Disposition:** REJECTED. Existing research code does not meet the same scientific/numeric promotion standard and is explicitly out of this canonical slice.

## Preservation review

Comparison from frozen main to candidate is additive for P5 runtime semantics: no modification is made to `src/domains/planetology/p5-canonical.js`. Executable tests require the original P5 physical digest, terrain topology behavior and `ofu-p5-p6-environment-v1` projection to remain unchanged.

## Final review status

- MATERIAL BLOCKERS OPEN: **0**
- MATERIAL BLOCKERS FIXED: **4**
- IMPORTANT NON-BLOCKERS: **2**
- FOLLOW-UP: **2**
- REJECTED SCOPE EXPANSIONS: **1**

Promotion remains contingent on exact candidate CI, independent oracle, Golden corpus, reproducible build and aggregate cross-runtime seal; this review does not substitute for those gates.
