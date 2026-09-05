# WV-A Astronomy Depth Research Candidate

This directory is an isolated **RESEARCH_ONLY** Wave V astronomy candidate. It does not modify canonical runtime code and does not promote any model.

## Why research-only

At execution time (2026-09-05), repository `main` was observed at:

```text
SHA  44f6e068d7d513c8746f23fb7580572758dc2ece
TREE cac4aef25aec7a9f98e8fe388a60cab7e8e963bc
```

No published `wave-v` branch and no exact Prompt-0 `WAVE_V_PARALLEL_BASE_SHA/TREE` were discoverable. Therefore this lane cannot claim `FULL_ISOLATED_LANE` mode or production convergence.

## Files

- `WV_A_STATE_OF_ART_2026-09-05.md` — literature review + provenance + assumption ledger.
- `WV_A_ARCHITECTURE.md` — dependency DAG, schema candidate, distributions, validation/benchmark summary.
- `WV_A_P3_COMPATIBILITY.md` — explicit P3 v1 preservation and future convergence transaction.
- `WV_A_PROMOTION_READINESS.md` — implementation completeness versus promotion readiness.
- `wv-a-research-provider.mjs` — bounded, pure, addressed research prototype; **not canonical runtime**.
- `wv-a-oracles.mjs` — distribution, causality, determinism, worker-order, corpus and compatibility checks.
- `wv-a-worker.mjs` — worker-order test helper.
- `wv-a-independent-oracle.py` — independent numerical distribution reference generator.
- `distribution-reference-v0.json` — independent oracle outputs.
- `generate-deterministic-corpus.mjs` / `deterministic-corpus-v0.json` — frozen research corpus.
- `wv-a-benchmark.mjs` / `benchmark-results-v0.json` — local sparse addressed lookup benchmark.

## Local verification

```text
python3 wv-a-independent-oracle.py
node generate-deterministic-corpus.mjs
node wv-a-oracles.mjs
node wv-a-benchmark.mjs
```

The checked candidate currently passes the oracle suite. Benchmark results are non-certifying because the local environment is Node v22.16.0 Linux x64 rather than the repository's full target matrix.

## Absolute boundary

Do not copy this prototype into shared runtime, do not alter P3 v1, and do not call the research distributions canonical. Rebaseline onto the exact Prompt-0 Wave V base first, obey its ownership manifest, replace the research entropy shim with exact P2 derivation, then rerun all conformance and cross-runtime evidence.
