# AI-F0 — Local inference feasibility research

Research-only lane for `AI-F0` on `research/ai-f0-local-inference-feasibility-2026-09-06`.

This subtree deliberately has no import path into the shipping product. It contains no model weights and no canonical mutation path. The prototype boundary is:

`model text/output -> typed proposal -> strict validation -> read-only research fixture tool -> structured result`

Generated prose is never executable; `navigate` is a preview proposal only. Unknown/unsupported status and source authority are copied from fixture evidence and cannot be upgraded by the validator.

Run locally:

```sh
node --test tests.mjs
node run-corpus.mjs
node --expose-gc payload-benchmark.mjs
python3 run-direct-file-probe.py
```

The direct-file probe intentionally performs no network access. A host policy that blocks `file://` navigation is reported as `ENVIRONMENT_BLOCKED`, not as a browser/product failure.

## Current research adjudication

`AI_F0_STATUS = NOT_YET_FEASIBLE` as an evidence gate: the gateway/fallback architecture executes and passes its local adversarial corpus, but no real model/runtime decode or usable direct-file browser run could be measured in this environment. See `AI_F0_REPORT.md` and `benchmark-results.json`.
