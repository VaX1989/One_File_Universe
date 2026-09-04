# Wave IV Chat C — Planet → Surface → Human integration notes

Normalized base:

- SHA: `03d100adad8189248bc7307ac1c3d82e86ffc062`
- tree: `fddeac4e48286f61f7750e4dcea96b1fe962ce04`
- source branch observed live: `integration/wave-iv-parallel-base-normalization-2026-09-04`

Write-authorized lane:

- `parallel/wave-iv-planet-surface-human-2026-09-04`

## PLANET_GLOBE_READY

Checkpoint:

- SHA: `4ab6debd92f4a5ce0c94eedd14687170fcdbea79`
- tree: `24b77190ea176a9f339a2dd4b149bc80657f27a4`

Scope:

- hardened FV-04/v0.8 bounded camera, cube-sphere LOD, clipping and GPU-resource lifecycle preserved;
- broad-family material differentiation moved into the primary WebGL planet renderer;
- Canvas2D full-disk terrestrial repaint removed: Orbit/Approach have one visible primary planet representation;
- family coloration, banding and macro variation remain `PRESENTATION_ONLY`;
- Orbit/Approach retain projection-aware framing, camera clearance and visible-horizon LOD from the normalized base.

Integration surface:

- `OFU.planetWebGL2.presentationMaterial(provider[, override])`
- `OFU.planetWebGL2.FAMILY_MATERIALS`
- `OFU.v09VisualUniverse.snapshot().primaryPlanetOwner === 'WEBGL_PLANET_RENDERER'`
- `OFU.v09VisualUniverse.snapshot().overlayRepaintsPrimaryPlanet === false`

Global resource bounds remain:

- active planet patches: 28
- retained CPU meshes: 56
- GPU meshes: 48
- tracked GPU bytes: 8 MiB
- DPR cap: 2

## SURFACE_FRAME_READY

Checkpoint:

- SHA: `53a263c57ff163040c6c2b2ba378cd538d8b1531`
- tree: `539f83831eb82180ead4fe627587a909a21c76a5`

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

## REGIONAL_TERRAIN_READY

Local terrain is a bounded presentation geometry system; it is not a physical elevation model.

Architecture:

- deterministic patch identity: anchor token + uniform local LOD level + signed patch grid coordinates;
- all active patches in one camera neighborhood use one level, avoiding parent/child T-junctions during a frame;
- neighboring patches sample the same anchor-global coordinate function at shared boundaries, making edge heights identical;
- multiscale deterministic presentation variation creates broad forms, ridges/depressions and microrelief without naming geology/hydrology;
- deterministic `ROCK_LIKE_PRESENTATION_FORM` instances are capped and explicitly `geologyClaim:false`;
- camera-neighborhood materialization only: no planet-wide human-resolution terrain.

Local LOD:

- GLOBAL_SURFACE: level 3
- REGIONAL_SURFACE: level 6
- LOCAL_SURFACE: level 9
- HUMAN: level 12
- base patch span: 65,536 presentation metres
- HUMAN patch span: 16 presentation metres with 16 segments (metre-order visual sampling)

Local resource bounds:

- active patches: 25 maximum
- retained CPU terrain meshes: 64 maximum
- retained CPU terrain mesh bytes: 6 MiB maximum
- patch segments: 16 maximum
- local LOD: 12 maximum
- rock-like instances: 96 maximum

The words `presentation metres` describe renderer/local navigation scale only and do not promote terrain height, geology, geodesy or surface coordinates to canonical science.

## Claim boundary (all checkpoints)

Hard false unless a future canonical contract explicitly changes authority:

- canonical color / canonical albedo
- atmosphere / clouds / oceans / ice coverage / weather
- vegetation / biosphere
- geology / hydrology
- physical terrain elevation
- canonical geodesy
- canonical surface-anchor semantics

Verification source covers: family mapping, no-second-planet invariant, tangent orthonormality and round trips, identity-preserving handoffs, floating-origin rebasing, scale bands, fail-closed unsupported surfaces, bounded terrain working sets, deterministic microdetail and exact shared-edge height equality.

Hosted/browser execution and physical Android/iOS verification are not claimed until exact-head evidence is observed.

No main write, no promotion, no certification claim.
