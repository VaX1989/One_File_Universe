# PROD-W2-DIRECTOR — governed reproducible journeys

Director is a bounded **presentation-only orchestration layer** over the existing Atlas and navigation authority.

It does not create a camera, renderer, picking system, semantic timeline, canonical state, scientific truth, or network dependency.

## Contract

- Atlas routes are compiled into deterministic journey descriptors.
- Each stop retains the Atlas entry identity, canonical subject identity, temporal/scientific references when present, and presentation-only return reference.
- Descriptor identity is content-derived and verified before execution.
- Actual travel is delegated to the existing navigation authority through a narrow adapter contract.
- Cancellation or execution failure restores the original existing-authority bookmark.
- Successful journeys return the original bookmark so the caller can explicitly reverse/restore the journey.
- Reduced motion is a presentation preference delegated to the navigation authority; semantic destinations are unchanged.
- Capture output is bounded metadata only and is explicitly non-authoritative.

## Bounds

Default limits:
- 32 route stops;
- 128 KiB descriptor;
- 32 capture metadata records;
- 16 KiB per capture record.

No polling loop, worker, cache, scene, camera, renderer, texture, mesh or mandatory network path is introduced.

## Evidence

`tests/product/prod-w2-director.mjs` falsifies descriptor determinism, Atlas replay, cancellation, restoration, reduced-motion equivalence, camera-authority violations, tampering and network/render-authority leakage.

`tests/product/prod-w2-director-browser.mjs` runs the same Director engine against the shipping Spatial Continuum direct-file artifact and requires the existing bookmark/travel/settle authority, one scene, one camera, renderer-owned picking, stable world identity and zero runtime network resources.
