# AI-F0 v2 benchmarks

Research-only benchmark harnesses for the AI-F0 v2 lane. Every result declares its evidence class.

- `payload-benchmark.mjs`: synthetic binary/base64 materialization proxy; **not inference**.
- `derived-candidate-estimates.mjs`: analytical weight/base64/KV estimates; **not measured memory**.
- `environment-probe.mjs`: host/runtime inventory.
- `model-materialization-probe.mjs`: verifies expected bytes/SHA only if an approved candidate is already present locally; it does not download weights.
- `browser-host-capability-probe.py`: `about:blank` host diagnostic, explicitly not direct-file evidence.
- `results/direct-file-result.json`: direct-file browser attempt driven by the research probe, with all HTTP(S) requests aborted.

No result in this directory licenses or promotes a third-party model/runtime for shipping.

`benchmark-results.json` consolidates the exact research evidence retained by the checkpoint; the local `results/` directory is an execution work area and is not required for repository consumption.
