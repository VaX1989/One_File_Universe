# R6-G Quality Observatory evidence

Lane: `R6-G`  
Freeze: `OFU-R6-W0-2026-09-15-27657AB9`  
Base SHA: `de796908d30ed52aedcc20830e94ccb5a730a94d`  
Base tree: `66652b162f496f36c2baced048815f525b3c5433`

## Classification

This evidence validates **test/analysis tooling only**. The synthetic calibration populations are intentionally controlled fixtures and are **not** claims about current OFU product diversity, visual quality, canonical science, or release readiness.

Authority boundaries:

- canonical science promotion: none;
- model-derived universe truth: none;
- production source writes: none;
- renderer/camera/kernel/scientific-state writes: none;
- workflow/package/central-runner writes: none;
- image similarity: supporting evidence only, never score authority.

## Direct verification

Executed locally against the lane files with Node:

```sh
node --check tools/spatial-continuum/quality-observatory/*.mjs
node tests/spatial-continuum/r6-w0-quality-observatory.mjs
```

The complete test was executed three times during lane construction. The last two stdout records were byte-identical:

- SHA-256: `8cb1f2276746dcc4f819028ff0c8c66a5c393db7b064240cc6d12f606cfcc595`
- deterministic rerun: PASS

Machine-readable fixture results are in `calibration-fixture-results.json`.

## Calibration result

The controlled baseline exercises all ten descriptor families. The repetitive baseline's calibrated aggregate P95 envelope is `0.0027027027027027094`; the known-distinct baseline P05 floor is `0.5315315315315314`, so the fixture baseline separates cleanly.

Observed score vector on controlled candidates:

| Population | Population spread | Nearest-neighbor distinctness | Collapse rate | Coverage |
|---|---:|---:|---:|---:|
| known repetitive | 0 | 0 | 1 | 1 |
| known distinct | 0.7657657658 | 0.5315315315 | 0 | 1 |
| palette-only variation | 0.1 | 0.0608996752 | 0 | 1 |

The palette-only result is deliberate evidence that color variation alone cannot dominate the multidimensional score.

## Falsification fixture

The synthetic campaign emitted exact address/seed/model-version witnesses for each exercised failure class, including generation/invariant failure, blank and degenerate representation, transition and LOD failures, stale-result/cancellation failures, offline/direct-file violation, accessibility failure, robust exposure/HUMAN anomaly, deterministic-rerun conflict, resource growth and provenance coverage failure.

This proves witness plumbing and classification logic; it does not claim those failures are present in the current product.

## Known limitations / next evidence

- Real R6-C/E/B/D adapters still need to emit the observation schema from their live harness evidence.
- Browser screenshot feature extraction is intentionally not embedded here; visual/image similarity can be attached as supporting evidence but cannot replace structural descriptors.
- GPU timing is reported only when the harness marks the sample `gpuVerified=true`.
- Resource-growth failures require either an explicit harness violation or caller-supplied resource delta budgets; the observatory does not invent product budgets.
- Robust outlier detection is population-relative and needs representative campaign samples.

The lane remains additive and reusable without becoming universe truth.
