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

Verification status at checkpoint construction:

- semantic/node oracle source updated for four presentation families and the no-second-planet invariant;
- hosted/browser execution is not claimed until an exact-head run is observed.

No main write, no promotion, no certification claim.
