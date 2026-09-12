# V2 Cinematic Current-State Audit

Authenticated source on 2026-09-08 before lane creation:

- convergence ref: `integration/v2x-supreme-total-convergence-2026-09-07`
- exact source SHA: `9ea22af90b4f1fdd38046ca23501f81ed0b2a839`
- exact source tree: `cd7b48574ddb7f2c568947d9477d3e8ff819f5a0`
- PR #237: open, Draft, mergeable at authentication time

This record is a source/product forensic baseline, not browser evidence.

## Existing strengths to preserve

- The current production builder is the additive single-file path `tools/build-ofu-rendering-v09.mjs`; V2 components are dependency-planned and embedded into one artifact.
- Living exploration already owns semantic navigation across universe/galaxy/region/neighborhood/system/orbit/approach/surface/human/micro regimes.
- `src/rendering/v1/living-renderer.js` already owns bounded maps/terrain, WebGL2 world use, Canvas2D fallback, context cancellation, picking and presentation camera adaptation.
- `src/rendering/v1/webgl2-world.js` already has bounded admission, DPR/surface planning, context-loss recovery and explicit `PRESENTATION_ONLY` authority.
- The planet path already uses the model-derived surface map and keeps canonical/model evidence separate from pixels.
- V2X-02 already provides camera/spatial-travel authority; V2X-14 already hardens touch, focus, reduced motion and systemic-audio presentation without owning navigation.
- Atomic UI already states that electron orbits/trajectories/quantum dynamics are not asserted.

## Highest-yield perceptual gaps

| Area | Current source reality | Failure mode | Transformation target |
|---|---|---|---|
| Composition | Living viewport is structured as titlebar + breadcrumbs + canvas + permanent scale rail; exploration evidence panel is visually strong | Reads as an application shell surrounding a renderer | Canvas/world becomes dominant; title, location, scale and controls become sparse edge overlays; inspector remains available but visually secondary |
| Planet shader | One texture lookup, Lambert-like directional term, single blue rim, simple outer halo | Geometry reads flat; terminator/atmosphere/material hierarchy is weak | Filmic but bounded key/ambient, softer terminator, Fresnel limb, water-like specular cue where model water exists, restrained atmospheric forward/rim response |
| Planet approach | Fixed `.88` globe scale | Arrival is improved but not compositionally distinct enough across aspect ratios | Stage/aspect-aware hero scale with deliberate crop on approach and calmer global framing |
| Stars | Basic point circle with one falloff | Uniform dot language | Core/halo hierarchy with restrained spectral tint and bounded apparent size |
| Galaxy | Three arm strokes + glow; large background glyph only at low alpha | Diagrammatic rather than massive/deep | Deterministic bounded core/disk/dust/stellar texture and stage-aware hero massing |
| Surface | Strong semantic/local data but mostly flat 2D terrain blocks | Detail exists informationally, depth/atmospheric scale cues lag | Layered sky/horizon/aerial perspective, foreground contrast, directional light and scale staging without inventing measured terrain |
| Micro | Rectangular material diagram / atom glyphs | Feels like a separate debug visualization | Dark optical-stage grammar, depth rings/soft focus/structural hierarchy; atomic remains schematic/model-honest |
| Motion | Renderer updates are semantically correct; V2 travel exists | Scene changes can still feel like UI state replacement | Presentation-only arrival/settle metadata and CSS compositing tied to existing stage changes; no second camera |
| Responsive | Existing mobile bottom sheet and touch hardening exist | Desktop shell proportions can dominate narrow screens | Portrait/landscape hero framing and safe-zone changes; larger object, less persistent chrome |

## Non-negotiable implementation boundaries

- Do not create a second runtime, semantic scale state, history stack, selection store or camera authority.
- Cinematic code may observe `#living-stage` dataset and `OFU.v1LivingProduct` snapshots; it may add presentation-only layers/metadata, never issue semantic travel by itself.
- User pointer/wheel/key input remains owned by the existing Living/V2 interaction lanes.
- Renderer changes must remain deterministic for a given snapshot and bounded by existing surface/resource plans.
- Presentation detail may be suggestive but must not be mislabeled as canonical observation or measured terrain.
- Strict artifact remains offline and network-free.

## Initial falsification targets

- Approach globe clipped incorrectly on phone portrait/ultrawide.
- Atmosphere overexposed on bright/light-color worlds or invisible on dark worlds.
- Canvas labels crossing hero subject/title safe zones.
- Existing mobile bottom sheet obscuring the scale rail or hero action.
- Reduced-motion still producing large transform/parallax changes.
- Context loss leaving cinematic overlays in a misleading loading/transition state.
- Long object/world identifiers colliding with title/metadata.
- Low-quality/resource-constrained state losing composition instead of only secondary fidelity.
