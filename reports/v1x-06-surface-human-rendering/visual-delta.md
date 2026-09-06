# V1X-06 visual delta matrix

Authority of this report: `MEASURED_RUNTIME_EVIDENCE` for exercised command/state witnesses; visible geography remains `PRESENTATION_ONLY` unless an upstream source says otherwise.

| Surface aspect | Prompt-0 rejected baseline | V1X-06 production delta | Evidence / fidelity boundary |
|---|---|---|---|
| Surface arrival | `planet-presentation.surface()` emits bounded 2D `SURFACE_PATCH` / `SURFACE_CELL` scene objects and may use random-looking presentation fallback patches. | A surface provider materializes a deterministic cube-sphere LOD neighborhood and emits embodied terrain polygons with depth/relief cues. | Terrain tile geometry and procedural relief are explicitly non-physical presentation. Upstream cell authority is carried separately. |
| Scale continuity | Surface scene receives a discrete requested scale. | Journey consumes an upstream surface target and traverses `GLOBAL_SURFACE -> REGIONAL_SURFACE -> LOCAL_SURFACE -> HUMAN`; reverse traversal returns toward globe. | Lane does not own canonical scale/camera authority; it records a presentation journey witness only. |
| Local movement | Baseline surface presentation has no arbitrary local tangent-frame movement primitive. | Bounded forward/right/up movement works at regional/local/human materialization, with floating-origin rebasing after configurable displacement. | Path is not P4 history and does not mutate canonical planet state. |
| Horizon / atmosphere | Global planet scene has atmosphere haze; baseline surface scene primarily exposes data layers and patch objects. | Surface frame adds horizon, atmosphere haze, sky gradient, water and ice cues tied to source authority. | Sky color, horizon curvature, shoreline and water level are not measurements. |
| Material cues | Baseline cells expose material family fields or fallback patches. | Terrain commands map supplied material family to stable presentation palettes; fallback material class is deterministic. | Fallback material is `PRESENTATION_ONLY`; supplied material source authority remains visible in the authority map. |
| Terrain seams | Baseline patch objects have no explicit cross-face seam contract. | Cube-face neighbors, duplicated-edge stitch metadata and skirts are generated; cross-face edge traversal has a targeted oracle. | Seam metadata is topology presentation; GPU crack-free rasterization is not yet browser-certified. |
| LOD / culling | Baseline caps patch count but does not expose a terrain LOD/cache lifecycle. | Altitude/viewport-driven LOD, horizon-oriented culling, bounded tile count, byte-bounded LRU cache and retention lifecycle. | LOD level is not scientific spatial resolution. Resource values are deterministic test evidence, not device profiling. |
| Life/civilization embodiment | Domain presentations are separate scene layers. | Surface provider exposes overlay hooks over a read-only terrain context and rejects providers declaring base-terrain mutation. | Overlay source authority is preserved; overlays do not own terrain truth. |
| Renderer | Central renderer owns composition. | Lane adds a concrete Canvas2D surface rendering path for sky, ground, terrain patches, haze and overlay marks. | Central renderer/bootstrap remains untouched; integration-owner scene binding is still required. |

## Visual certification boundary

This lane has a deterministic Canvas2D command witness and journey witness, but no exact-HEAD browser screenshot or physical-device capture was produced in this session. Therefore the lane does **not** claim founder acceptance, full visual certification, GPU seam certification, Android verification, or iOS verification.
