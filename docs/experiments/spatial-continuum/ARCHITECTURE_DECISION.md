# ADR: Spatial Continuum rendering and navigation kernel (R2 + R3)

- Status: architectural direction validated; expansion and production adoption not yet accepted
- Date: 2026-09-13
- Repository: `VaX1989/One_File_Universe`
- Stable base: `5f3dbdcccc409c3bc29684e062ad7730ddea0c69` / tree `f84f05f9a12e110bb48f7605d8f577b0886dfe02`
- R2 implementation measured: `8e2dd3f1944fab8898ce45cc8b54a9e37ea5fcac` / tree `3cb575fcf75706842944a929402ff63350afeeea`

## Decision

Continue with Babylon.js `9.26.0` as the low-level WebGL2 rendering kernel. OFU remains authoritative for canonical/model identity, scientific authority, the persistent spatial graph, hierarchical frames, focus, continuous scale, camera intent, history, deterministic seeds, and representation policy. Babylon owns the GPU context, scene, meshes/materials, visibility, ray intersections, render instrumentation, and disposal.

R2 removes the proving slice's two most important fake-general abstractions:

1. Camera Cartesian poses are no longer stage lookup values. A semantic profile declares desired projected coverage and cinematic direction, while target position, radius, reference frame, retained user yaw/pitch, surface tangent, and field of view derive the actual pose and travel distance.
2. Reference frames no longer sit beside the renderer as documentation. System bodies, body-fixed surface target, local terrain, sample, picking, and camera render origins resolve through the same float64 frame registry and lowest-common-ancestor-relative float32 handoff.

Semantic stages remain accessible landmarks and artistic constraints. They do not own scene lifetime or canonical identity.

## Requirements

- One self-contained, deterministic HTML artifact; direct-file and offline operation; zero required runtime network.
- One canonical focus and one camera authority.
- Target-derived travel that survives target changes, user orbit/pitch, interruption, and reverse traversal.
- A body-fixed model surface point and east/up/north local tangent frame.
- Camera-relative GPU coordinates without subtracting universe-sized absolute float64 values.
- Renderer-consistent picking and shared transforms.
- Screen-space-driven, bounded terrain refinement.
- Rich `PRESENTATION_ONLY` output without silently asserting scientific fact.
- Bounded resources, explicit disposal, and functional context restoration.
- A semantic keyboard/text layer over the same canonical state.

## Kernel selection and bake-off

The R1 spikes remain the engine decision basis. R2 profiling found no Babylon blocker and therefore did not repeat novelty-driven engine selection.

| Candidate | Evaluated version | Minimal spike, raw | gzip | brotli | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Babylon.js | 9.26.0 | 1,675,582 B | 395,300 B | 302,647 B | Selected: clean modular browser bundle, mature scene/picking/resource ownership |
| PlayCanvas | 2.22.1 | 2,037,526 B | 529,117 B | 408,382 B | Rejected for this slice: larger spike and retained `node:worker_threads` boundary in the tested bundle |
| Existing/custom OFU renderer | repository checkpoint | 173,225 B in 19 Deep3D/WebGL/WebGPU files | n/a | n/a | Rejected as primary kernel: OFU would continue owning transforms, materials, culling, picking, lifecycle, LOD, context loss, and backend variance |

Babylon is Apache-2.0 and pinned exactly. Its complete license text is embedded in the generated artifact. No CDN, external shader, texture, font, worker, or runtime fetch is introduced.

## R2 spatial model

```text
V2 canonical/model authority donor
               |
               v
persistent OFU spatial graph ---- float64 hierarchical frames
               |                              |
               +---- one canonical focus -----+
                              |
continuous scale + reversible camera/history context
                              |
target radius/transform + projected-size intent + retained orientation
                              |
LCA-relative, camera/rebased float32 render coordinates
                              |
one Babylon scene
  +-- visual output
  +-- ray picking
  +-- screen-space LOD observation
  +-- engine resource accounting/disposal
```

### Camera R2

For a target bounding radius `r`, vertical field of view `fov`, and desired projected coverage `c`, camera distance is derived as `r / sin(fov * c / 2)`, clamped away from singular angles. The selected body's real model-derived radius changes the result. Switching to a visibly picked sibling changes focus, frame, radius, and pose without creating another scene or camera.

Stage profiles retain coverage, FOV, and broad cinematic direction as art-direction inputs. They are not spatial truth: there are no authored Cartesian camera keys. User yaw/pitch and HUMAN local translation remain in the authoritative camera snapshot and influence later solutions. Reverse restores meaningful captured context rather than selecting a canned previous-stage pose.

### Hierarchical frames and precision

The registry now supplies point, direction, and orientation transforms. Relative coordinates are computed through the lowest common ancestor, then rotated into root axes, avoiding precision loss from subtracting two universe-sized absolute coordinates. A synthetic test places child frames below a `1e20 m` ancestor and preserves a `3 m` separation in GPU-facing output.

System bodies originate in `system-barycentric`; the selected body has body-centered and body-fixed frames; the surface target is a child of the body-fixed frame; sample and micro frames descend from the local tangent frame. Renderer positions, picking geometry, camera target, and displayed sample all consume those frames.

### Surface target contract

Latitude/longitude from the genuine OFU model state are converted to a deterministic model-derived body-fixed point, outward normal, and east/up/north tangent quaternion. This is explicitly `MODEL_DERIVED`; `canonicalSurfaceGeodesy` remains false. Planet marker, terrain origin, local sample, and reverse history share the same `surfaceId` and transform chain. The renderer and frame authority also share one deterministic terrain height function, so the visible sample occupies its declared sample-frame point.

### Representation and LOD

Adjacent layers coexist and are weighted by continuous scale. Terrain uses a fixed 16-mesh patch pool and a bounded screen-space refinement plan of 1, 4, or 16 active patches. Patch height and finite-difference normals sample one deterministic world field, including at shared boundaries, so refinement does not create independent maps or lighting seams. Static stars, rocks, material groups, micro grains, and atomic probability samples use thin instances.

This is the smallest architecture that demonstrates bounded spatial refinement. It is not yet a production planetary quadtree: refinement is uniform by level, with no per-patch frustum/horizon rejection, residency cache, or mixed-level seam stitching.

## Multi-world falsification

R2 materializes three genuine terrestrial worlds from the real P3 system site `(46, 437, 400)` at orbit slots 0, 2, and 5, with distinct radii, orbital transforms, surface coordinates, `surfaceId`s, and sample identities. It exercises ROCK and ICE source samples through SYSTEM → ATOMIC → SYSTEM. A real Babylon ray pick selects a different rendered planet and rebinds camera focus/geometry.

Unmaterialized sibling bodies may be selected at SYSTEM/ORBIT/APPROACH using a disclosed `PRESENTATION_ONLY` radius estimate. They cannot descend to a fake surface. A P5 `BULK_PRIOR`/unsupported physical world fails with an explicit capability error rather than receiving Earth-like terrain.

This proves data variation, not universal surface support. Gas/volatile bodies, moons, dynamically materialized alternate surfaces, and broader system taxonomy remain open.

## Performance and resource decisions

- Event-demand rendering produces no renderer samples while settled and idle.
- Babylon `SceneInstrumentation` supplies per-frame draw calls; no cumulative internal counter is used.
- R2 headless Chromium reports renderer CPU median `1.0 ms`, p95 `2.0 ms`; update median `1.8 ms`, p95 `10.6 ms`; input-to-visible-response median `19.2 ms`.
- Normalized resources are 54 meshes, 24 materials, 1 texture, 58,264 vertices, one scene, one camera, and a 16-patch terrain pool.
- Ten complete forward/reverse loops preserve those counts, cap history at 64, and move forced-GC JS heap from 30,666,891 B to 29,042,409 B.

Headless requestAnimationFrame cadence remains poor (median 50 ms, p95 100 ms, p99 133.3 ms) and is not physical-GPU evidence. The low measured renderer CPU cost isolates environment/scheduling from scene CPU work but does not prove GPU frame pacing. Expansion remains blocked on physical-GPU measurements.

## Browser, mobile, and accessibility implications

- Chromium 151 and Firefox 153 pass direct-file, offline WebGL2 traversal through ORBIT, HUMAN, ATOMIC, and reverse SYSTEM.
- Playwright WebKit crashes at process startup in this Windows environment. Safari/WebKit is unproven, not failed by the product.
- Chromium additionally passes real pointer selection, context loss/restore followed by render/pick/travel/HUMAN movement, 844×390 landscape pinch, 390×844 DPR2 portrait, tablet/DPR2, and orientation change.
- A visible skip link, canvas focus, keyboard stage travel, keyboard body selection, focused controls, restrained live status, 200% CSS zoom, forced-colors rules, and reduced-motion identity-preserving travel are present.

This is automated evidence, not a physical mobile, assistive-technology, or Safari certification.

## Donor boundary

The experiment still initializes released V2, captures genuine authority, then disposes the legacy visual product. Permanent convergence should extract an authority-only bootstrap containing P3/P5 canonical construction, runtime state/history, deterministic content authority, persistence, and epistemic metadata. It should omit Deep3D/Living composition, legacy canvas/UI, legacy camera, and legacy picking. R2 deliberately does not perform that extraction before the replacement kernel is sufficiently proven.

## Rejected alternatives and borrowed concepts

- Incrementally prettifying Deep3D remains rejected because it preserves split scene/camera/picking authority.
- Cesium is not the primary engine; its screen-space-error selection, ENU frames, and relative-to-eye encoding inform OFU's LOD and precision model.
- OpenSpace is not transplanted; anchor/focus/aim, target-oriented flight, and restorable target-relative state inform OFU's camera.
- Literal zoom into unknown chemistry remains rejected. The sample is canonical/model context; lower-scale geometry is explicitly model-derived or presentation-only.

Primary references: [Babylon optimization and instrumentation](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/scene/optimize_your_scene.md), [Babylon instances and thin instances](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/mesh/copies/instances.md), [Cesium selection algorithm](https://cesium.com/learn/cesium-native/ref-doc/selection-algorithm-details.html), [Cesium Camera](https://cesium.com/learn/cesiumjs/ref-doc/Camera.html?classFilter=entity), [Cesium relative-to-eye encoding](https://cesium.com/downloads/cesiumjs/releases/b18/Documentation/EncodedCartesian3.html), [OpenSpace navigation](https://docs.openspaceproject.com/latest/using-openspace/toolbar/navigation/index.html), and [OpenSpace NavigationState](https://docs.openspaceproject.com/latest/reference/asset-components/Other/NavigationState.html).

## Known risks and reversibility

- Physical-GPU frame pacing, Safari/WebKit, physical touch, and screen-reader workflows are unproven.
- Terrain and system composition are still experiment-grade art; patch refinement is bounded but not planet-scale sparse refinement.
- Alternate selected sibling bodies cannot yet be materialized in place for their own honest surface descent.
- The full V2 donor inflates the artifact and startup.
- The proving slice covers SYSTEM through ATOMIC. The four upper macro regimes are intentionally not migrated.

The experiment remains isolated behind its build target and Draft PR. Stable V2 is unchanged. Removing the experiment modules, tests/docs, dependencies, and the legacy disposal seam returns the base without data migration.

## Recommendation

`CONTINUE_EXPERIMENT`

R2 validates the target-derived camera, frame-to-render pipeline, geodetic target contract, multi-world binding, bounded LOD, and engine-owned resource model. It does not satisfy the R2 expansion gate because physical-GPU performance and WebKit/Safari remain unproven and alternate-world surface materialization plus scalable sparse terrain refinement remain incomplete.

## R3 superseding addendum

- R3 implementation measured: `9140811ffbdee805dbeb57b25f35fe48ee421c83` / tree `11fb6ae45159d812a6a73d3334b18a0bbe4e934a`
- Canonical evidence manifest: [evidence/r3/evidence-manifest.json](evidence/r3/evidence-manifest.json)
- Experiment artifact: `4,620,166` bytes / SHA-256 `e6befd497121f1f9434557caaf7b75758b6c9c7813cdd4e83f3e8b8786b1ce76`

R3 retains Babylon.js `9.26.0`. Profiling found no engine-level blocker, so the renderer bake-off was not reopened. The architectural decision now includes these additional contracts:

1. **Component-level authority.** Canonical entity identity is independent from position, orientation, phase, bounds, geometry, and elevation authority. A real OFU body can therefore remain `CANONICAL` while its current orbit phase is honestly `PRESENTATION_ONLY`.
2. **Metric surface space.** Planet target, terrain root, sample, and camera share one `LOCAL_ENU_METRES` contract. The deterministic field takes east/north metres and returns presentation-only elevation metres; changing LOD does not change the physical field.
3. **Sparse adaptive terrain.** A bounded mixed-level quadtree selects patches recursively using projected geometric error and view-radius rejection. A fixed 48-mesh pool, deterministic residency keys, LRU-style eviction, skirts, and Nyquist-aware terrain band limiting bound resources and prevent coarse patches from sampling detail they cannot represent.
4. **In-place genuine-world materialization.** A renderer-owned pick of a supported sibling materializes its own OFU world graph, body/surface/sample frames, material kind, camera bounds, and visual resources inside the existing Babylon scene and camera. Unsupported bodies fail closed with an explicit capability reason.
5. **Measured GPU ownership.** The renderer exposes physical GPU identity and asynchronous `EXT_disjoint_timer_query_webgl2` measurements, respecting disjoint results. Event-demand rendering remains authoritative while idle.

The quadtree follows the same high-level selection principles documented by Cesium Native: traverse a hierarchy, compare projected geometric error with a threshold, cull irrelevant children, and keep residency bounded. OFU's implementation is intentionally smaller and operates in the retained local tangent plane; it is not a Cesium 3D Tiles implementation. Primary R3 sources: [Cesium selection details](https://cesium.com/learn/cesium-native/ref-doc/selection-algorithm-details.html), [Cesium tileset selection options](https://cesium.com/learn/cesium-native/ref-doc/structCesium3DTilesSelection_1_1TilesetOptions.html), and [Khronos EXT_disjoint_timer_query_webgl2](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/).

### R3 falsification result

- Chromium `151.0.7922.34`, Firefox `153.0`, and WebKit `26.5` each run the Continuum artifact directly from `file:`, offline, through ORBIT, HUMAN, ATOMIC, and reverse SYSTEM with WebGL2 and zero network requests.
- A real renderer pick changes focus to sibling world `d1a62533d3c203448b8df722ee5ff3369e03871f42672338f63a2dc4c7778b91`; the sibling completes ORBIT through HUMAN and reverse while scene/camera counts remain one.
- On headless Chrome `152.0.7977.83` using a verified NVIDIA Quadro RTX 4000 / ANGLE D3D11 path, animation interval median/p95/p99 is `16.7/16.8/50.1 ms`, median input response is `13.1 ms`, renderer CPU median/p95 is `1.2/3.3 ms`, and GPU median/p95 is `0.672/3.572 ms` with 448 valid samples and zero disjoint samples.
- Ten complete soak loops hold at 86 meshes, 24 materials, one texture, 61,816 vertices, a 48-patch pool, one scene, one camera, history 64, and forced-GC heap `35,802,896 → 30,313,748` bytes.
- Context restoration is functional: the post-restore test requires a nonblank render, preserved canonical focus, renderer pick, travel, and HUMAN motion.

### R3 remaining architectural boundary

R3 proves sparse, bounded, physically metric refinement around a retained surface target. It does **not** yet prove a globe-wide cube-sphere/geodesic patch topology, horizon-aware planetary traversal, or seamless travel between arbitrary distant surface targets. The current view-radius test is local-tangent culling, not a complete globe horizon/frustum selector. Camera profiles still contribute high-level cinematic coverage/direction intent. The full V2 donor still initializes before the replacement takes ownership. Physical touch, display-present timing, screen-reader workflows, and production art remain unproven.

Human image review also prevents promotion: alternate-world ORBIT is clearly planetary and materially better than V2's marker, but REGIONAL/LOCAL/HUMAN terrain remains sparse and experiment-grade; LOCAL can read as visually flat. Architectural evidence has advanced faster than product finish.

### R3 recommendation

`CONTINUE_EXPERIMENT`

R3 closes the specific R2 blockers for physical-GPU evidence, WebKit Continuum execution, in-place alternate-world materialization, component authority, and sparse bounded LOD. Expansion into the four upper macro regimes remains premature until planet-wide surface topology/travel and the product-quality terrain differential are proven, and until the V2 donor boundary is reduced.
