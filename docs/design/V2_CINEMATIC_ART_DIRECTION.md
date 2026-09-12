# V2 Cinematic Art Direction

Status: ships with the cinematic lane. Authority: `PRESENTATION_ONLY`.

## Product thesis

The universe is the primary interface. Persistent chrome is reduced to orientation, reversible depth and essential affordance; scientific/model evidence stays available in the existing Living inspector. Cinematic presentation must never create a second semantic scale, camera, selection, history or simulation authority.

## Color grammar

| Role | Intent |
|---|---|
| Deep space | Near-black blue-black; preserves luminance headroom |
| Scientific neutral | Cool desaturated grey-blue for context and evidence |
| Stellar key | Warm ivory/amber, reserved for luminous sources and primary actions |
| Atmosphere | Desaturated cyan/blue with brightness driven by geometry, not UI branding |
| Biosphere | Muted chlorophyll/earth hues only when model context supports life |
| Civilization | Warm mineral/amber traces; never neon city wallpaper |
| Matter/micro | Slate, mineral, oxygen/metal spectral accents with dark optical-stage backgrounds |
| Selection | Warm pale gold plus geometry/outline so state is not color-only |
| Warning/error | Warm oxide/red with text/icon/shape support |
| Authority | Quiet teal/neutral badge, never stronger than the represented world |

Saturation is a scarce resource. A scene should usually have one dominant chromatic family plus one interaction accent.

## Light grammar

1. **Hero key**: one readable dominant direction establishes volume.
2. **Shadow floor**: shadows retain information without flattening the terminator.
3. **Rim/environment**: atmosphere/emissive structure separates a dark subject from deep space.
4. **Specular**: used only where the represented/model state justifies a reflective cue; not a universal gloss layer.
5. **Surface aerial light**: horizon and distance become softer/lighter than foreground to communicate depth.
6. **Micro light**: optical-stage key plus restrained edge/structure glow; not space-star lighting reused at tiny scale.

## Typography grammar

- **WORLD / SCALE eyebrow**: 10–12 px, tracked uppercase, contextual rather than decorative.
- **Hero context**: 28–56 px responsive display text; short, editorial, never an evidence dump.
- **Location/identity**: compact monospaced secondary line, allowed to wrap safely.
- **Interaction prompt**: one restrained sentence, transient.
- **Scientific metadata**: existing inspector hierarchy, dense only when explicitly inspected.
- **Lab**: keeps expert density and diagnostic terminology; it is not restyled into cinematic fiction.

## Spatial UI grammar

- **Persistent**: current context, reversible scale rail, focus visibility.
- **Contextual**: first-run interaction cue, selection label, primary approach/deeper affordance.
- **Transient**: motion/arrival cue, loading/recovery state.
- **Inspector**: Living evidence panel; available on demand/outside the world composition.
- **Expert/Lab**: existing diagnostics and evidence surfaces.

The stage never hides essential controls behind hover-only behavior.

## Surface grammar

- Stage surfaces are matte near-black, not generic glass cards.
- Floating navigation uses a compact opaque/translucent charcoal field with one subtle border and no decorative blur dependency.
- Focus is a high-contrast outline; hover is luminance/elevation only.
- Selected state combines border/outline and text, not color alone.
- Evidence surfaces remain visibly distinct from the world so presentation cannot be confused with canonical/model authority.

## Compositing primitives

The shipped cinematic layer defines reusable zones rather than scene-specific layouts:

- `hero`: world canvas occupies the full stage.
- `title-safe`: top-left editorial context with a protected readable gradient.
- `interaction-safe`: bottom-left transient guidance above depth navigation.
- `depth-rail`: bottom-center semantic scale control.
- `edge-vignette`: subtle contrast shaping that never blacks out data.
- `regime wash`: very low-opacity macro / planetary / surface / micro atmospheric character.

The layer observes the existing Living stage dataset and applies `data-cinematic-regime`. It never changes semantic state.

## Regime character

- **Macro**: darkest field, rare luminous structure, restrained labels, high negative space.
- **System/orbit**: warm dominant stellar light, orbital orientation, destinations subordinate to the star.
- **Planetary**: globe dominates the minor viewport dimension, soft atmospheric separation, strong terminator.
- **Surface/local**: horizon/aerial depth, lower camera energy, warmer material contrast.
- **Life/civilization**: derived traces share the surface rather than floating as dashboard overlays.
- **Matter/micro**: optical-stage darkness and structural focus; schematic/model representations remain explicitly non-photographic.

## Quality tiers

Composition, identity and readable key lighting survive every tier.

- **High/Ultra-capable**: full atmosphere/material response and richer bounded background depth.
- **Balanced**: same staging, fewer secondary stars/particles/samples and conservative DPR/resource budget.
- **Low/constrained**: same framing, readable subject, simplified secondary effects; never an unstyled fallback page.

The existing render-budget/resource-profile system remains the authority for actual resource admission.

## Scientific honesty

All visual additions are presentation-only. Surface maps remain model-derived representations; procedural detail is not measured terrain. Atmospheric, rim, haze and material cues communicate geometry and regime, not new scientific observations. Atomic representations never imply classical electron trajectories or quantum state measurements.
