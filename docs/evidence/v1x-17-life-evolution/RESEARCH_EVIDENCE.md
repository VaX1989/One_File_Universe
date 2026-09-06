# V1X-17 Research Evidence

Base verified before writes:

- branch `integration/v1.0-definitive-product-convergence-2026-09-05`
- SHA `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19`
- tree `3324e6354b5ff1b90156d1693e6051595b6f1219`
- target research branch initially pointed to the same SHA/tree.

Authority: `MODEL_DERIVED_SIMULATION`, research-only candidate. No canonical P6, central registry, renderer, build component, persistence, `.github`, or other lane tree is modified.

## Local executed evidence

Environment: Node `v22.16.0`; Python `3.13.5`.

```text
node research/v1x-17-life-evolution/test-frontier.mjs
python3 research/v1x-17-life-evolution/oracle-frontier.py
```

Both PASS.

Golden witnesses:

- environment packet digest `5c95cd62c0a76a21129f702141799a93b5e9212ef0c0c1bb41b8cce307ff02bb`
- initial state digest `7622aad30a182302aa479493e8f50b1d67f9fd0861b70dae1b3cf50324548c0e`
- ecology event ID `r17:event:a4741a621fe01a9998e56a941bea05f1b3e3e80436cadc084b84b7b5e92d669c`
- post-ecology state digest `649ab7986b4c69733527063fc55b632446411f98606a4eec6c859bdaabdb04e6`
- child lineage ID `r17:lineage:5eeb25539a4bf559a0f64e563877d10e0c8ccc20fd406f9c3ab4e9d71f3f7835`
- final three-event replay digest `090dd0a198d5e67a644c030e28721db586a49811e00f0cc2d1786c2eef133a3b`
- mutation RNG digest `27aa44f5e4387360164d676d2ea7a2e6a1254485cb8bb18daeb5d30e9ba09653`
- population outcome producer-1 `910`, producer-2 `548`, consumer `103`, ghost `0`
- lifecycle outcome juvenile `80`, adult `70`

The independent Python oracle reproduces the event/mutation SHA witnesses and ecology/lifecycle arithmetic.

## Negative/adversarial witnesses

The executable suite rejects a research environment that claims canonical genesis; a required profile nutrient with zero availability; event identity tampering; formal demographic extinction while aggregate abundance is nonzero; and reconciliation against a changed coarse-state digest. It also confirms no private biological event log, criterion-bound speciation, nonpersistent organism samples, no sample-to-abundance inference, and feedback that cannot mutate environment state directly.

## Evidence limitation

The execution container did not have usable raw-network GitHub DNS, so repository access/writes are performed through the authorized GitHub connector rather than a local clone. The official ownership validator is therefore not claimed as a local execution. Repository-side base-vs-head changed paths are checked against the frozen V1X ownership policy after writes. Browser/device evidence is not applicable to this Node/Python research prototype and is not claimed.
