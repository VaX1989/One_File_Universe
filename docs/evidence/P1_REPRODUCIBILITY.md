# P1 Reproducibility Evidence

## Local executed evidence

Environment: Linux container, Node v22.16.0.

Two clean invocations of the deterministic builder in one fresh reconstructed workspace produced byte-identical `One_File_Universe.html` outputs.

- artifact bytes: `29974`
- artifact SHA-256: `fee67b991c3179f66858eeebbdb55ae3def2c1fb767942a91741667f11027c83`
- Generator Manifest SHA-256: `ed862a1a0295e5beaa695e0672bd19b982e322f3e8ba945f8f249442cce8a066`
- result: `REPRODUCIBLE` for the executed local experiment

The HTML intentionally excludes build timestamp, machine path and Node version. `dist/build-manifest.json` records the executing Node version but is not part of the canonical HTML artifact.

CI independently rebuilds on Node 20. Cross-environment byte identity remains `TEST_DEFINED` until CI evidence is observed and recorded.
