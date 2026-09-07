# V2X-15 Astronomy Frontier — RESEARCH_ONLY

This directory is a bounded physical-science research lane. It is **not** a shipping provider and does not upgrade canonical scientific authority.

## Implemented research capability

- source-domain-correct circular/coplanar low-mass mutual-Hill screening;
- algebraic circular Hill-threshold inversion;
- AMD definition diagnostic and pairwise coplanar collision-critical AMD screen;
- barycentric bounded 2-D Newtonian kick-drift-kick short-horizon N-body diagnostic;
- explicit energy, angular-momentum and linear-momentum drift in `Msun–AU–yr` code units;
- coarse/fine same-horizon N-body step-convergence diagnostic;
- version/hash/exact-domain MIST interpolation contract with alpha/rotation/chemistry guards;
- bounded unit-tagged stellar-slice interpolation with no extrapolation;
- versioned coupled multiplicity-cell evaluator with physical `q/e` bounds and explicit weight semantics;
- bandpass + magnitude-system distance modulus;
- exact `atan2` parallax and projected angular geometry, with inverse-distance/small-angle values exposed only as approximation diagnostics;
- source-bounded rocky PREM relation and monotonic uncertainty envelope.

## Authority / non-claims

A green result does **not** mean long-term N-body stability, Lagrange stability, resonance safety, secular-chaos absence, survey completeness, detectability, calibrated extinction, or unique planetary composition.

The N-body diagnostic excludes collision physics, tides and general relativity. MIST and multiplicity evaluators require externally supplied exact versioned data; this lane does not invent empirical table values.

## Verification

Primary executable gate:

```text
node research/v2x/run-tests.mjs
```

Independent cross-language witnesses:

```text
python3 research/v2x/reference-oracle.py
```

Exact-head certification requires the locally executed file bytes to hash to the recorded GitHub blob SHAs before execution.

## Convergence

- Source/limitation provenance: `research/v2x/astronomy/SOURCE_LEDGER.json`
- Selective promotion contracts: `research/v2x/PROMOTION_PACKETS.json`
- Definitive lane handoff: `research/v2x/astronomy/HANDOFF.json`

Promotion must preserve every fail-closed `UNSUPPORTED` / `RESEARCH_REQUIRED` boundary unless a versioned promoted source contract explicitly resolves it.
