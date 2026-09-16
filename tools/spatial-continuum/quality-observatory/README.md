# R6-G Quality Observatory

This directory is test/analysis tooling. It does not define universe truth, canonical science, renderer behavior, or release policy.

## What it measures

The observatory accepts deterministic observation records with an exact witness (`address`, `seed`, `modelVersion`) and can aggregate:

- explicit generation/invariant failures;
- blank/degenerate representations;
- calibrated perceptual-diversity descriptors and template-collapse witnesses;
- robust lighting/exposure and HUMAN density/scale/horizon outliers;
- transition continuity and LOD seam/pop failures;
- CPU update/render tails and verified-GPU timing when present;
- memory/resource growth against caller-supplied budgets;
- queue cancellation/stale-result failures;
- direct-file/offline violations;
- authority/provenance coverage;
- accessibility journey outcomes.

All sampling and scoring inputs remain harness evidence. They are never promoted to scientific authority.

## Perceptual diversity methodology

The score is deliberately **multidimensional**, not a single magic number. Ten semantic descriptor families are supported by default:

1. silhouette/topographic structure;
2. horizon/landform profile;
3. spatial frequency/roughness;
4. atmosphere/sky regime;
5. material family;
6. object density/clustering;
7. scale distribution;
8. palette;
9. causal/fingerprint distance;
10. microstructure topology.

Each dimension is calibrated from two declared reference populations: a known-repetitive baseline and a known-distinct baseline. The repetitive median is the low anchor and the distinct median is the high anchor. Template collapse is detected against the 95th percentile envelope of the repetitive calibrated baseline. The report exposes population spread, nearest-neighbor distinctness, collapse rate, descriptor coverage, and per-dimension distributions. Palette contributes only one component. Image similarity may be attached as supporting evidence but is intentionally excluded from the score authority.

Calibration quality is itself visible: the report records baseline separation for every component and excludes dimensions that the supplied baselines cannot separate.

## Deterministic mass falsification

`planDeterministicSweep()` constructs the exact address x seed x model-version x stage candidate set, ranks candidates by SHA-256 over the canonical witness plus campaign seed, and selects a bounded count. Candidate input order therefore cannot change the selected sweep. The guard `maxCandidateProduct` is resource protection, not a semantic threshold, and is configurable.

Every observation must preserve the selected witness. Every failure emitted by the analyzer carries that exact witness so a pathological world is directly replayable.

## CLI

```sh
node tools/spatial-continuum/quality-observatory/cli.mjs \
  --observations reports/local/observations.jsonl \
  --calibration reports/local/diversity-baseline.json \
  --out reports/local/quality-report.json \
  --summary reports/local/quality-report.md \
  --campaign R6_C_HUMAN_SWEEP_001
```

The calibration file can be either a previously generated `ofu.r6.quality-observatory.diversity-calibration.v1` object or an object with `repetitive`, `distinct`, optional `dimensions`, and optional `label` fields.

## Integration boundary

R6-G intentionally does not modify `package.json`, `tests/spatial-continuum/run.mjs`, or the Spatial Continuum workflow. Run the lane test directly:

```sh
node tests/spatial-continuum/r6-w0-quality-observatory.mjs
```

A central CI registration request is recorded in the lane evidence namespace for the convergence owner.
