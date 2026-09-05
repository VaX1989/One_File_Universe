# Wave V WV-D - Civilization + Deep History

Branch target: `research/wave-v-civilization-history-2026-09-05`

Mode: **RESEARCH_ONLY**

The exact `WAVE_V_PARALLEL_BASE_SHA` / `WAVE_V_PARALLEL_BASE_TREE` from Prompt 0 were unresolved when this checkpoint was created. The branch was provisionally created from then-current `main` only to hold isolated research artifacts. This starting point is **not** the Wave V parallel base and confers no promotion authority.

Provisional research starting commit:

`44f6e068d7d513c8746f23fb7580572758dc2ece`

Provisional starting tree:

`cac4aef25aec7a9f98e8fe388a60cab7e8e963bc`

## Safety boundary

This directory does not modify shared production/runtime surfaces. It does not establish canonical civilization. Positive worlds use `SYNTHETIC_TEST_ONLY` upstream fixtures. Current canonical P6 remains fail-closed for positive life/civilization authority.

## Files

- `STATE_OF_ART_AND_ARCHITECTURE.md` - literature/provenance matrix, assumption ledger, state model, dependency DAG, late materialization, history/archaeology design.
- `civilization-history-prototype.mjs` - isolated research prototype for deterministic addressing, COLD/WARM/HOT/IMMEDIATE refinement, resource/economy accounting, institutions, diffusion-shaped scenario functions, history projection/replay and archaeology derivation.
- `civilization-history-tests.mjs` - focused deterministic/conservation/replay/reconciliation/falsification tests.
- `synthetic-corpus.mjs` - three explicit non-canonical deterministic synthetic fixtures.
- `PROMOTION_READINESS.md` - implementation completeness versus promotion readiness.

## Run focused research tests

```sh
node research/wave-v/wv-d/civilization-history-tests.mjs
node research/wave-v/wv-d/synthetic-corpus.mjs
```

Expected checkpoint test result:

```text
status: PASS
tests: 28
modelVersion: wv-d-civilization-history-research-1
```

The numeric `tests` field is a checkpoint inventory label for the focused assertions in the current script, not a statement of canonical conformance coverage.

## Rebaseline rule

When Prompt 0 publishes the exact Wave V SHA/tree and ownership manifest, this lane must be re-created/rebased from that exact base before any `FULL_ISOLATED_LANE` work. Research artifacts may then be re-adjudicated and carried forward only if they remain compatible with the ownership manifest and upstream contracts.
