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

## Cross-program evidence (W1 / middleware feasibility)

The Observatory can also consume additive `crossProgram` evidence without assuming that a product or platform API exists. Each metric is **capability-gated per observation**: evidence for an undeclared capability is staged and reported but cannot fail the campaign or imply an API contract.

Every active cross-program metric must classify its evidence as one of:

- `MEASURED` — directly measured by a harness;
- `HEURISTIC` — derived/estimated evidence that may falsify an explicit expectation but is not truth;
- `PRESENTATION_ONLY` — visual/presentation evidence that cannot promote scientific authority.

Current product-facing evidence families cover all-scale continuity, causal-consequence coverage, Atlas exact-return (when that contract exists), and browser/device evidence. Platform-facing families are staged for explicit capability presence and cover cross-language byte/digest/rejection parity, ABI/version regression, query latency distributions, cache/materialization bounds, provider conformance, persistence/recovery and security/fuzz witnesses.

The cross-program report writes an explicit authority boundary: **observation/falsification only**; no scientific truth, semantic, renderer, native-runtime or release authority is acquired. A missing capability is not a failure. A declared capability with missing evidence is reported as evidence debt rather than silently treated as PASS.

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
