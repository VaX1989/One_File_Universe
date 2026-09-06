# V1X-02 Deterministic 3D Spatial Universe — Implementation Evidence

Lane: `PROMPT 2 / V1X-02`

Base SHA/tree: `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19` / `3324e6354b5ff1b90156d1693e6051595b6f1219`.
Contract set: `OFU-V1X-CONTRACT-SET-2026-09-06.1`.

## Ownership

Prompt-0 deny-before-allow ownership reserves `src/rendering/v1/**` to the convergence owner, so this lane uses the normalized additive namespace `src/v1x-02-spatial-universe/**`. It does not modify the central renderer, scene, camera, input, selection, persistence, build composer, or frozen P3 astronomy generation.

## Production delta

`spatial-universe.js` adds a presentation-only representation provider with deterministic identity-keyed XYZ placement for `UNIVERSE`, `GALAXY`, `REGION`, and `NEIGHBORHOOD`; identity-sorted/query-order-stable projection; morphology/density presentation hints; a 64-entity materialization cap; a 96-slot non-enumerative presentation neighborhood cap; separate carriage of source-backed positions without authority promotion; external-camera perspective projection; and a depth-dependent parallax witness.

The generated coordinates and probes are `PRESENTATION_ONLY`. Probe slots are non-canonical, non-selectable, non-navigable, and are not discovery results. Separately supplied source positions retain their upstream authority (`CANONICAL_PROVEN`, `DERIVED`, or `MODEL_DERIVED_SIMULATION`) without promoting the generated presentation position.

## Before / after

Before this lane, the existing macro modeled-region presentation included ring/angle planar placement and there was no lane-owned governed seam for stable bounded identity-keyed macro XYZ presentation. After this lane, V1X-03/V1X-04 can consume `ofu-v1x-02-spatial-consumer-1` for non-coplanar deterministic presentation coordinates and external-camera parallax. Central founder-visible scene wiring remains convergence-owner work.

## Oracles

Local runtime: Node `v22.16.0`.

Commands:

```text
node tests/v1x-02-spatial-universe/spatial-universe.test.mjs
node tests/v1x-02-spatial-universe/no-grid-oracle.test.mjs
node tests/v1x-02-spatial-universe/resource-evidence.test.mjs
```

Observed results: deterministic 3D oracle PASS for all four contexts with query-order stability, revisit stability, non-coplanarity and depth-dependent parallax; no-grid static oracle PASS with zero forbidden primary planar-index violations; bounded resource oracle PASS at 64 entities + 96 probes and 70,844 serialized bytes.

Runtime timing is `MEASURED_RUNTIME_EVIDENCE` scoped to the local Node host only and is not a browser/GPU certification threshold.

## Limitations

No central-scene wiring is performed; V1X-01 owns camera implementation; sparse probe slots are presentation scaffolding rather than canonical discovery; no browser/GPU or physical Android/iOS evidence is claimed; hosted CI certification requires exact-HEAD execution of the responsible conformance suite and is not implied by ownership-only CI; founder acceptance is not granted.
