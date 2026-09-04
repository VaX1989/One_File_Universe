# Wave IV Chat C — Planet → Surface → Human integration notes

Normalized base:

- SHA: `03d100adad8189248bc7307ac1c3d82e86ffc062`
- tree: `fddeac4e48286f61f7750e4dcea96b1fe962ce04`
- source branch observed live: `integration/wave-iv-parallel-base-normalization-2026-09-04`

Write-authorized lane:

- `parallel/wave-iv-planet-surface-human-2026-09-04`

## PLANET_GLOBE_READY

Scope:

- preserve the hardened FV-04/v0.8 bounded camera, cube-sphere LOD, clipping and GPU-resource lifecycle;
- move broad-family material differentiation into the primary WebGL planet renderer;
- remove the Canvas2D full-disk terrestrial repaint path so Orbit/Approach have one visible primary planet representation;
- keep all family coloration, banding and macro variation `PRESENTATION_ONLY`;
- preserve explicit non-claims for canonical color/albedo, atmosphere, clouds, oceans, ice coverage, vegetation, weather, geology, biosphere and physical terrain elevation.

Integration surface:

- `OFU.planetWebGL2.presentationMaterial(provider[, override])`
- `OFU.planetWebGL2.FAMILY_MATERIALS`
- `OFU.v09VisualUniverse.snapshot().primaryPlanetOwner === 'WEBGL_PLANET_RENDERER'`
- `OFU.v09VisualUniverse.snapshot().overlayRepaintsPrimaryPlanet === false`

Resource bounds remain unchanged at this checkpoint:

- active planet patches: 28
- retained CPU meshes: 56
- GPU meshes: 48
- tracked GPU bytes: 8 MiB
- DPR cap: 2

Checkpoint:

- SHA: `4ab6debd92f4a5ce0c94eedd14687170fcdbea79`
- tree: `24b77190ea176a9f339a2dd4b149bc80657f27a4`

## SURFACE_FRAME_READY

The surface transition is a real reference-frame transition rather than continued center-directed zoom.

Contract:

- `OFU.planetSurface.surfaceCapability(source)` fails closed unless a bounded terrestrial presentation provider is available;
- `OFU.planetSurface.createAnchor(...)` creates a deterministic navigation anchor from canonical planet identity + current globe view direction;
- anchor coordinates are explicitly `LOCAL_TANGENT_PRESENTATION_FRAME_NOT_CANONICAL_GEODESY`;
- basis is a stable right-handed east/north/up-like tangent basis without calling the axes canonical latitude/longitude;
- `localFromGlobal` / `globalFromLocal` are reversible transforms around the selected anchor;
- `handoffFromGlobe` preserves canonical planet identity and view direction;
- `reverseHandoff` preserves identity and returns to Approach directionally;
- local camera state is held as integer millimetres with camera-relative floating-origin rebasing; rebasing never changes canonical coordinates or identity;
- local movement is accepted as renderer intents (`MOVE_FORWARD`, `MOVE_RIGHT`, `CHANGE_ALTITUDE`, `LOOK_YAW`, `LOOK_PITCH`), not a second DOM/input subsystem.

Scale bands exposed by the renderer-facing provider:

- `PLANET_ORBIT`
- `PLANET_APPROACH`
- `GLOBAL_SURFACE`
- `REGIONAL_SURFACE`
- `LOCAL_SURFACE`
- `HUMAN`

Unsupported semantics:

- gas/ice giant local surfaces return `NO_SUPPORTED_SOLID_LOCAL_SURFACE`;
- other unsupported/unknown solid semantics return `CANONICAL_SURFACE_MODEL_UNAVAILABLE` or a bounded-provider requirement;
- Orbit/Approach presentation remains logically separate from local-surface availability.

Scientific non-claims remain hard false: geology, hydrology, vegetation, biosphere, physical terrain elevation, canonical geodesy and canonical surface-anchor semantics.

Verification status at checkpoint construction:

- semantic oracle source covers tangent-frame orthonormality, global/local round trip, deterministic anchor stability, identity preservation, floating-origin rebasing, reverse handoff, scale-band boundaries and unsupported fail-closed behavior;
- hosted/browser execution is not claimed until an exact-head run is observed.

No main write, no promotion, no certification claim.
