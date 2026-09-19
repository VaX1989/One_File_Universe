# QOBS-CROSS-PROGRAM evidence

**PROMPT_ID:** `QOBS-CROSS-PROGRAM`  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`  
**Control head:** `fa88f7cec101a52d07916a0fdd3927c482a6f188`  
**Frozen R6 base:** `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e` / tree `3704247247940fa8c5f08291cd80ec9e24e7d49d`

## Scope

This lane extends the existing Quality Observatory as cross-program **observation and falsification infrastructure**. It does not define universe truth, canonical science, release policy, renderer behavior, native semantics, or public middleware API shape.

The implementation is additive inside the lane-owned Quality Observatory surface:

- explicit capability-presence gating for product/platform evidence;
- `MEASURED`, `HEURISTIC`, or `PRESENTATION_ONLY` evidence classification;
- product evidence families for all-scale continuity, causal-consequence coverage, Atlas exact-return when available, and browser/device evidence;
- platform-feasibility families for byte/digest/rejection parity, ABI/version regression, query latency, cache/materialization bounds, provider conformance, persistence/recovery, and security/fuzz witnesses;
- exact replay witnesses on every emitted failure;
- deterministic order-independent cross-program report hashing;
- schema and human-summary support.

## Falsification behavior

Evidence is only active when its capability is explicitly declared present for the observation. Evidence supplied for an undeclared capability is reported as staged and cannot become a failure. A declared capability with missing evidence is visible evidence debt and is not silently counted as PASS.

The report itself states the authority boundary:

- observation/falsification only: **true**;
- scientific truth authority: **false**;
- semantic authority: **false**;
- release authority: **false**;
- product mutation authority: **false**;
- native runtime authority: **false**.

## Verification

The JSON schemas and execution-state artifact parse successfully.

An isolated Node fixture exercised the exact connector-fetched implementation with Node v22.16.0:

- status: **PASS**;
- expected failure witnesses: **6**;
- staged undeclared evidence: `platform.providerConformance`, `product.browserDeviceEvidence`;
- declared-without-evidence debt: `platform.persistenceRecovery`;
- evidence classifications: 14 measured, 2 heuristic, 1 intentionally unclassified;
- reversed observation order produced the same cross-program digest:
  `2923d437786f9d98f7308d4b7072ab7956b4b96e84e5d561e1b547cd6295315c`.

Machine-readable evidence is in `cross-program-fixture-results.json`.

## Regression boundary

Legacy observations that have no `crossProgram` field declare no new capabilities, produce no cross-program issues, and retain the pre-existing W0 Observatory semantics. The lane does not edit `package.json`, central runners, workflows, production renderer/camera/kernel, scientific authority, control-plane files, or release metadata.

## Limitations

The execution container has no outbound GitHub network access, so a fresh repository clone and full repository test invocation could not be performed there. The source used by the isolated fixture was fetched from the lane branch through the authenticated GitHub connector. No live post-G0A/G0B middleware API is presumed to exist, and no physical GPU/device evidence is promoted.

A convergence-owned integration patch request is supplied separately for optional central test registration.
