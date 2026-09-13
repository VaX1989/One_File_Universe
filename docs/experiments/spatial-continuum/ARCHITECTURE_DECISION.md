# ADR: Spatial Continuum proving kernel

- Status: experiment accepted for implementation; production adoption not yet accepted
- Date: 2026-09-13
- Repository: `VaX1989/One_File_Universe`
- Base: `5f3dbdcccc409c3bc29684e062ad7730ddea0c69` / tree `f84f05f9a12e110bb48f7605d8f577b0886dfe02`

## Decision

Use Babylon.js `9.26.0` as the experiment's low-level scene/rendering kernel, with WebGL2 as the compatibility baseline. Keep OFU—not Babylon—as the authority for canonical identity, scientific/model data, continuous scale, camera intent, history, reference frames, representation activation, and epistemic labels.

This is deliberately not a second semantic framework wrapped around the released V2 renderer. The experiment quiesces the legacy visual product after extracting one genuine canonical system, body, surface context, and local sample from the released V2 authority. One Babylon scene, one OFU camera authority, one persistent spatial graph, and one renderer-owned picking path then own the proving journey.

WebGPU is not required by this checkpoint. It remains a backend experiment below product semantics after WebGL2 behavior, direct-file use, and visual quality are stable.

## Requirements that controlled the decision

- One self-contained HTML artifact, direct-file capable, offline, with no runtime network.
- One canonical identity from SYSTEM through HUMAN and one source sample through ATOMIC and back.
- CPU-side hierarchical reference frames and camera-relative GPU coordinates.
- One anchor/focus/aim camera authority and continuous scale coordinate.
- Overlapping representations instead of destructive stage-owned scene replacement.
- Scene-consistent picking, bounded resources, disposal, and context restoration.
- Rich `PRESENTATION_ONLY` visuals without inventing canonical scientific facts.
- An engine integration small enough to remove low-level obligations rather than recreate Deep3D behind wrappers.

## Implemented bake-off

The spike scripts are in `tools/experiments/spatial-continuum/` and bundle the minimum OFU-relevant imports through the same esbuild toolchain used by the experiment.

| Candidate | Pinned/current evaluated version | Minimal spike, raw | gzip | brotli | Single-file/offline result | Finding |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Babylon.js | 9.26.0 | 1,675,582 B | 395,300 B | 302,647 B | Clean browser bundle; no Node worker reference | Selected |
| PlayCanvas | 2.22.1 | 2,037,526 B | 529,117 B | 408,382 B | Required externalizing `node:worker_threads`; emitted bundle retained that reference | Rejected for this slice |
| Released/custom OFU stack | repository checkpoint | 173,225 B across 19 Deep3D/WebGL/WebGPU files; 786,979 B across 76 rendering files | n/a | n/a | Already single-file | Rejected as the replacement kernel because OFU must continue owning scene graph, transforms, culling, lifecycle, materials, picking, instancing, LOD, context loss, and backend variance |

The byte figures are comparative spike outputs, not the final artifact size. The final HTML also embeds the released V2 authority/data donor, UI, content, and the Babylon Apache license.

## Capability evidence and borrowed concepts

- Babylon: modular ES modules, WebGL2/WebGPU engine support, scene graph, PBR/material systems, instancing/thin instances, LOD facilities, scene ray picking, explicit disposal, and engine context restoration. Sources: [Babylon specifications](https://www.babylonjs.com/specifications/), [Babylon npm package](https://www.npmjs.com/package/%40babylonjs/core), [Babylon repository](https://github.com/BabylonJS/Babylon.js).
- PlayCanvas: credible WebGL2/WebGPU scene engine and MIT licensing, but its tested bundle was larger and retained a worker-thread boundary in this toolchain. Sources: [PlayCanvas engine](https://github.com/playcanvas/engine), [2.22.1 release](https://github.com/playcanvas/engine/releases).
- Cesium: screen-space-error refinement and camera/depth-consistent globe interaction informed `projectedSpanPixels`, `perceptualLod`, and renderer-owned selection. Sources: [selection algorithm details](https://cesium.com/learn/cesium-native/ref-doc/selection-algorithm-details.html), [camera and picking](https://cesium.com/learn/cesiumjs-learn/cesiumjs-camera/).
- OpenSpace: anchor/focus/aim and target-aware flight informed the camera contract and reversible camera snapshots. Sources: [navigation](https://docs.openspaceproject.com/latest/using-openspace/toolbar/navigation/index.html), [NavigationState](https://docs.openspaceproject.com/latest/reference/asset-components/Other/NavigationState.html).
- Mol* and MolViewSpec: source/context-preserving representation changes informed the microscopic bridge. Source: [Mol* display management](https://molstar.org/viewer-docs/managing-the-display/).

## Architecture proven by the slice

```text
released V2 authority/data donor
             |
             v
persistent canonical spatial graph ---- hierarchical reference frames
             |                                      |
             +---------- one focus authority -------+
                            |
continuous scale coordinate + reversible history
                            |
anchor / focus / aim camera + representation handoff
                            |
one Babylon scene / renderer-owned ray picking
```

Semantic stages are derived landmarks and accessible language. They do not own scene lifetime. Adjacent visual layers coexist during handoff. SYSTEM, planet, terrain, local sample, and contextual microscopic layers are allocated once and enabled/weighted by the continuous coordinate. Static high-cardinality content uses thin instances. The terrain's active refinement is chosen from projected screen size rather than the semantic stage alone.

The same terrain height function and target are used for GLOBAL/REGIONAL/LOCAL/HUMAN. The micro journey changes explanatory representation honestly: canonical world and source sample stay fixed while geometry is labeled `MODEL_DERIVED` or `PRESENTATION_ONLY`.

## License and build implications

- `@babylonjs/core` is pinned exactly to `9.26.0` under Apache-2.0.
- The complete upstream license text is embedded in the generated HTML as `#ofu-spatial-continuum-third-party-license` and recorded by SHA-256 in the build manifest.
- No CDN, external shader, texture, font, worker, or runtime fetch is used.
- esbuild tree-shakes the selected modules into one IIFE. The final HTML is byte-reproducible at one source revision in the local verification.
- This dependency materially increases the artifact, but it replaces the obligation to build and maintain engine internals. Size remains a measured promotion risk, not a hidden cost.

## Browser implications

- WebGL2 is the experiment baseline and was exercised in Chromium through both `file://` and localhost during manual review.
- Direct-file startup is asynchronous because the genuine OFU donor first initializes; the experiment waits for canonical authority, captures it, and explicitly disposes the legacy product.
- Babylon's modular shader readiness required an explicit ready-triggered redraw. The event-demand renderer otherwise does not repaint settled static scenes.
- WebGPU, Safari, Firefox, physical touch hardware, and integrated/mobile GPUs remain unproven in this checkpoint.

## Rejected alternatives

### Preserve or incrementally prettify Deep3D

Rejected. It would retain the exact stage-owned scene/camera/picking split implicated by the V2 product failure and keep OFU responsible for too many engine subsystems. Individual V2 authority/data components are retained, but the visual kernel is not.

### PlayCanvas

Rejected for this slice, not categorically. Its measured bundle was larger, and the tested build required a Node worker external. Resolving that boundary would consume experiment time without evidence of a product advantage over the clean Babylon bundle.

### Cesium as the primary engine

Rejected. Cesium's globe precision and screen-space-error concepts are highly relevant, but a globe-first engine does not cover the system-to-atomic product span cleanly and carries a larger geospatial product model than this proving slice needs.

### Fully custom minimal renderer

Rejected. It offers smaller bytes but recreates the same unbounded ownership surface that made V2 fragile. A custom shader or specialized representation remains appropriate inside the selected engine when it directly serves a proven OFU need.

### Literal geometric zoom through unknown microgeometry

Rejected as scientifically dishonest. The sample remains the anchor, while contextual representations explicitly disclose their authority.

## Known risks

- The proving slice covers 11 landmarks, not the four macro landmarks above SYSTEM.
- The current low-poly presentation is deliberately authored but not final art; SYSTEM composition and terrain/material polish need further convergence against V1.
- Chromium software-rendered p99 is materially below released V2's audit tail, but median/p95 are not yet better; this blocks production promotion.
- Dynamic-resolution movement improves responsiveness but must be validated on physical GPUs for visual stability.
- The experiment artifact contains both the donor and replacement code. A later migration should extract a smaller authority-only donor path.
- One scene preallocates all proving representations. Expansion must preserve bounds rather than blindly preallocate all fifteen regimes.

## Reversibility

The experiment is isolated behind `npm run build:continuum` and produces a separate ignored artifact. Stable V2 remains unchanged apart from adding a real disposal seam to its living product. Removing `src/experiments/spatial-continuum`, its build/tests/docs, the pinned engine dependencies, and that seam returns the base architecture without data migration.

## Promotion rule

Do not replace stable V2 or expand the architecture into the four upper macro regimes until the evidence report's unresolved performance and visual-comparison gates are closed on at least Chromium, Firefox, Safari, and a constrained physical/mobile GPU.
