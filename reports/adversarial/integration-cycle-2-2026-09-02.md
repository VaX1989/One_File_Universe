# Integration Board Adversarial Report — Cycle 2 — 2026-09-02

## Live rebaseline

- `main`: `7bfb738483e0975c2c72e60a64f6ee8f000dbb01`
- P2 Issue #5: CLOSED / P2 FROZEN
- P3 prototype: `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a`
- no real `feature/p3-universe-skeleton` branch exists yet
- P4: `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0`
- P4 PR #9: OPEN / DRAFT
- P5 research: `efe2b8ce29267deb26f3f34d18433c96947c467e`
- Governance #7: OPEN; `main` remains unprotected

No owner track advanced between Cycle 1 completion and this Cycle 2 rebaseline.

## Integration-owned defect corrected

Cycle 1 proved and fixed P2/P4 evidence contamination on the P4 branch, but the generic prevention was not yet present on `main`. Current `main` still used generic `npm test`, uploaded generic `dist/`, and treated generated `dist/evidence/` as a flat directory in reproducible-build preservation.

Cycle 2 creates a main-targeted, phase-independent hardening change that:

1. makes P2 execute explicit frozen Foundation/P1/P2/build/reproducibility scope;
2. packages only `One_File_Universe.html`, the typed P2 build manifest and `p2-*` evidence;
3. preserves nested phase-owned evidence recursively during reproducibility checks;
4. adds a synthetic `phase: P99` regression proving any foreign phase inserted into the P2 evidence set is rejected;
5. leaves `aggregate-p2-evidence.mjs` unchanged and fail-closed;
6. copies no P4 implementation or P4 evidence producer into `main`.

Exact candidate certification is required before merge: Foundation/P1/P2 all PASS on one head.

## Baseline versus mutable authority audit

The P3 prototype currently emits coherent snapshot values under short names such as `ageMyr`, `massMilliEarth`, `luminosityMilliSolar`, orbital elements and `insolationPpm`. These are valid prototype snapshot facts, but the schema does not yet distinguish a procedural/reference baseline from a future current value once P4-driven evolution exists.

This is a schema-freeze concern, not a reason to redesign P3 generation.

The new integration matrix establishes:

`P3 procedural baseline + P4 canonical history + versioned domain transition semantics = current persistent world state`.

Material pre-freeze actions routed to P3:

- explicitly define the baseline/reference epoch;
- clarify baseline semantics for system/star age and stellar state/luminosity;
- clarify baseline/reference semantics for orbital facts and insolation;
- define planet mass as baseline/formation/reference mass if future physical mass can evolve;
- retain coarse composition only as a prior;
- remove/demote prototype physical radius from P3 schema v1 under the selected P5 radius ownership.

## P4 status

Evidence isolation is closed. P4 remains blocked from integration-ready status only by the already identified three semantic defects:

1. live monotonic frontier;
2. continued mutation from verified checkpoint + bounded tail;
3. bound/versioned reducer semantic authority.

No fourth semantic blocker was introduced in this cycle.

## P3/P4 disposable integration decision

Not created. Both prerequisites are still false:

- no stable current-main P3 canonicalization head exists;
- P4 still has three material temporal semantic blockers.

Creating the branch now would test historical branch topology rather than qualified integration semantics.

## P5 status

P5 remains healthy research. Its current head did not advance during this cycle. No evidence was found of a private canonical clock or a second P2 serialization/identity authority. Promotion requirements remain deterministic numeric treatment, validity-domain hardening and terrain topology/refinement properties.

## Governance

Issue #7 remains an important but non-semantic governance gap. `main` is still unprotected. Exact-head gating continues to be enforced operationally by the integration process rather than repository rules.

## Cycle 2 finding disposition

| Finding | Disposition |
| --- | --- |
| Generic P2 evidence-scope contamination remains possible from future main-based branches | MATERIAL INTEGRATION DEFECT — integration-owned fix prepared; merge only after Foundation/P1/P2 exact-head PASS |
| P3 baseline fields can be misread as eternally current | MATERIAL FOR P3 SCHEMA FREEZE — routed as naming/reference-epoch clarification, not generator redesign |
| P4 three semantic blockers | MATERIAL — unchanged owner scope |
| No P3 canonical feature head | IMPORTANT sequencing fact, not a defect |
| No P3/P4 disposable branch yet | CORRECT / intentional |
| P5 research incompleteness | NON-BLOCKING research status |
