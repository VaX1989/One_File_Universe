# Wave IV Chat C — Planet → Surface → Human integration notes

Normalized base:

- SHA: `03d100adad8189248bc7307ac1c3d82e86ffc062`
- tree: `fddeac4e48286f61f7750e4dcea96b1fe962ce04`
- source branch observed live: `integration/wave-iv-parallel-base-normalization-2026-09-04`

Write-authorized lane:

- `parallel/wave-iv-planet-surface-human-2026-09-04`

## PLANET_GLOBE_READY

- SHA: `4ab6debd92f4a5ce0c94eedd14687170fcdbea79`
- tree: `24b77190ea176a9f339a2dd4b149bc80657f27a4`

Preserves the hardened FV-04/v0.8 camera, cube-sphere LOD, clipping and GPU lifecycle while moving broad-family material differentiation into the primary WebGL renderer. The Canvas2D full-disk terrestrial repaint is removed; the overlay is annotation/context only. Orbit/Approach retain projection-aware framing and visible-horizon coverage.

## SURFACE_FRAME_READY

- SHA: `53a263c57ff163040c6c2b2ba378cd538d8b1531`
- tree: `539f83831eb82180ead4fe627587a909a21c76a5`

Adds a real reference-frame transition:

- deterministic presentation navigation anchor from canonical planet identity + globe view direction;
- right-handed local tangent basis;
- reversible global/local transform;
- no canonical latitude/longitude claim;
- integer-millimetre local camera state;
- floating-origin rebasing without canonical-coordinate mutation;
- identity-preserving reverse handoff;
- renderer intents rather than a new DOM input subsystem;
- gas/ice giant Surface fails closed.

## REGIONAL_TERRAIN_READY

- SHA: `8335fe5780edf311c6be9e6c6878251f9119a4c6`
- tree: `1cce548ac27150b0ad141c5df8f132474d227dee`

Adds bounded presentation-only terrain:

- deterministic camera-neighborhood patch identity;
- uniform active LOD level to avoid local parent/child T-junctions;
- shared anchor-global sample coordinates for exact neighboring edge heights;
- GLOBAL / REGIONAL / LOCAL / HUMAN levels 3 / 6 / 9 / 12;
- HUMAN patch span 16 presentation metres with 16 segments (metre-order visual sampling);
- rough ground, broad ridge/depression-like variation and capped rock-like forms with no geology/hydrology claim.

Local CPU bounds: 25 active patches, 64 retained meshes, 6 MiB retained mesh bytes, 16 patch segments, 96 rock-like instances.

## HUMAN_SCALE_READY — implementation content

The Human checkpoint integrates the frame + terrain into the real single-file viewport.

Primary behavior:

- legacy `Close` target at `<= 1.03 R` is intercepted as a Surface handoff instead of continuing center-directed zoom;
- canonical planet identity and view direction are checked across handoff;
- the existing globe WebGL GPU registry is disposed transactionally before the same canvas becomes local-terrain primary representation;
- reverse handoff disposes the local Surface GPU path and re-enters Approach through the existing globe camera;
- no second planet canvas/viewport is introduced.

Local navigation through the existing viewport listeners:

- pointer/touch drag → renderer look intents;
- arrows → look;
- W/S → forward/back;
- A/D → strafe;
- +/- and focused/active wheel → local altitude scale;
- Home → reverse handoff/reset;
- wheel is not captured merely by pointer position: the canvas must be focused or actively manipulated, preserving document scrolling elsewhere.

Precision tightening:

- canonical/global identity remains unchanged;
- local camera absolute navigation state: integer millimetres;
- floating origin: rebased integer-mm presentation origin;
- terrain vertex storage: patch-relative Float32;
- shader patch origin: subtract floating origin before GPU transform;
- therefore large anchor-local movement does not require large Float32 vertex coordinates.

Local WebGL bounds:

- GPU terrain meshes: 32 maximum;
- tracked terrain GPU bytes: 6 MiB maximum;
- rock-like instances: 96 maximum, one bounded dynamic buffer;
- global and local GPU registries do not remain concurrently resident during handoff.

Renderer-facing state exposes supported scale bands, Surface availability/reason, anchor, local camera, handoff readiness, current band, resource stats, authority and non-claims without exposing canonical mutation authority.

## Scientific claim boundary — hard false

Unless a future canonical contract explicitly establishes otherwise:

- canonical color / canonical albedo;
- atmosphere / clouds / oceans / ice coverage / weather;
- vegetation / biosphere;
- geology / hydrology;
- physical terrain elevation;
- canonical geodesy;
- canonical surface-anchor semantics.

`presentation metres` are renderer/navigation scale only. They do not make local relief a physical topographic measurement.

## Targeted evidence

Node/semantic oracles cover: hardened global framing regression, four family mappings, no-second-planet invariant, tangent-frame orthonormality/round trip, anchor stability, identity-preserving handoff/reverse handoff, floating-origin stability, local LOD bounds, shared-edge equality, microdetail claim boundaries and single-file composition.

A lane-specific development workflow runs Chromium desktop plus 390×844 mobile emulation. It exercises Orbit/Approach occupancy and full-limb invariants, keyboard rotation, pointer/touch rotation, Human handoff, local movement, clearance, resource bounds and reverse handoff. This is browser evidence only; it is not physical Android/iOS verification and is not certification.

No main write, no promotion, no certification claim.
