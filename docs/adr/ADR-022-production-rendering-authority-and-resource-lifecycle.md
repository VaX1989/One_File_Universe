# ADR-022 — Production Rendering Authority and Resource Lifecycle

**Status:** Accepted

## Context

The first P1–P6 vertical slice must render a canonical P5 cube-sphere planet at
continuous scales without giving display state authority over world truth. The
pre-integration renderer also exposed two portability defects: its terrain index
order wound surface triangles inward, so conforming WebGL back-face culling hid
the planet, and context restoration discarded the counters needed to prove real
GPU buffer destruction across generations.

Frame timings, GPU timer extensions, heap reporting and physical driver memory
are not uniformly measurable across supported engines. Treating those noisy
measurements as deterministic canonical values would be false evidence.

## Decision

1. Rendering is a presentation-only consumer. Camera paths, viewport/DPI, LOD
   thresholds, materialization order, draw order, caches, floats, GPU resources,
   context generations and frame timing cannot feed any canonical derivation.
2. Terrain uses indexed outward-wound triangles over canonical P5 patch/vertex
   identities. Mixed-LOD skirts duplicate canonical edge samples but are
   presentation geometry with no canonical identity of their own.
3. Astronomical positions are subtracted as integers before bounded local values
   are converted to `Number`. A full absolute `BigInt` position is never converted
   to floating point for local surface derivation.
4. CPU and GPU working sets are bounded. WebGL buffers are explicitly destroyed
   during eviction. Context loss invalidates the old generation; restoration
   creates a fresh generation while cumulative created/deleted/invalidated/live
   accounting remains exact.
5. WebGL2 is the production baseline. Canvas2D remains a functional fallback;
   WebGPU capability is optional and never required.
6. Correctness, bounds, canonical witness equality, direct `file://`, offline
   behavior and zero required network are hard gates. RAF/startup/build/upload
   timing is labeled `MEASURED`; renderer-controlled byte counts are `DERIVED`;
   unavailable GPU timer, heap or physical VRAM data is `NOT MEASURABLE`.

## Consequences

- The same P2/P3/P4/P5/P6 witnesses must survive camera, LOD, cache, draw-order,
  viewport, DPI and context-loss stress across all supported runtime profiles.
- Canonical P6 insufficiency is shown honestly; rendering cannot fabricate a
  positive biosphere or admit test-only authority.
- Physical driver VRAM is not claimed from renderer allocation accounting.
- Real Safari/iOS remains unverified; Playwright WebKit evidence is named WebKit.
- Future rendering improvements may replace presentation implementation without
  changing canonical world bytes, provided these boundaries remain satisfied.

## Rejected alternatives

- **Disable face culling.** Rejected because it hides incorrect mesh orientation
  instead of proving valid indexed geometry.
- **Reset lifecycle counters on restore.** Rejected because it loses evidence of
  prior allocations and cannot prove bounded cleanup across generations.
- **Raise timing thresholds until CI passes.** Rejected because cross-machine
  timing is measured performance evidence, not deterministic world semantics.
- **Promote skirts or floating camera coordinates.** Rejected because both are
  presentation artifacts.
