# Wave IV Macrocosm — Chat A Integration Note

This lane exposes Macrocosm as a provider. It does not own the product shell, global Scale Runtime, or canonical selection state.

## Load order

1. existing P3 + `src/rendering/universe-presentation.js` (optional richer palettes/star encodings);
2. `src/rendering/macro/macro-scene.js`;
3. `src/rendering/macro/macro-interaction.js`;
4. `src/rendering/macro/macro-provider.js`;
5. `src/rendering/macro/macro-canvas.js` when a canvas renderer is desired.

## Provider contract

`OFU.waveIVMacroProvider` (`ofu-macro-scene-provider-runtime-1`) accepts an externally-owned scale, P3 context, and normalized canonical selection key.

- `getScene({scale, ctx, canonicalKey, selectedOrbitSlot, options})`
- `sceneFromNormalizedSnapshot({scale, ctx, snapshot, options})`
- `layoutScene(scene, viewport)`
- `pointerActivate(scene, viewport, x, y, handlers)`
- `keyboardMove(scene, viewport, currentObjectId, key)`
- `keyboardActivate(scene, viewport, currentObjectId, key, handlers)`
- `transition(from, to, {reducedMotion})`

Provider snapshot explicitly reports:

- `selectionAuthority: EXTERNAL`
- `scaleAuthority: EXTERNAL`
- `shadowSelection: false`
- `shadowScaleRuntime: false`

The provider has an LRU scene cache capped at 8 descriptors.

## Canonical selection

Pass the normalized product selection bridge as `selectionAuthority`:

```js
const selectionAuthority = OFU.v08SelectionBridge;
```

A canonical planet activation is rejected unless the supplied object has contract `ofu-product-canonical-planet-selection-1` and `selectPlanet`. The macro layer does not pre-commit, mirror, or privately remember a selected planet.

Galaxy and System destinations above planet-selection level produce `FOCUS_GALAXY` / `FOCUS_SYSTEM` navigation intents for Chat A. They are not falsely routed through planet selection.

## Canvas adapter

`OFU.waveIVMacroCanvas.attach(canvas, {selectionAuthority, onNavigate})` attaches pointer + keyboard semantics. `setScene(scene)` paints only the currently supplied external-scale scene.

Keyboard:

- Arrow keys: deterministic next/previous focus candidate;
- Home/End: first/last bounded candidate;
- Enter/Space: same activation path as pointer.

Touch/pointer targets are at least 44 CSS px even when the visible glyph is smaller. Label caps are 16 desktop / 8 mobile. The macro layer never requires hover.

## Scale mapping

### GALAXY

Bounded canonical galaxy-cell discovery. Canonical relative centers use P3 site-cell + `cellOffsetPc`; screen projection is presentation-only. Galaxy morphology/orientation may shape glyphs, not telescope imagery.

### NEIGHBORHOOD

Bounded canonical System discovery using P3 P4-T0 baseline positions. Maximum 192 site probes, 24 visible systems. No global enumeration.

### SYSTEM

Up to 4 canonical stellar components and 10 canonical planets. Stellar component placement is presentation-only. Planets retain canonical identity/order and baseline orbital facts. Marker angle is never orbital phase. Direct planet selection delegates to the normalized selection bridge.

### ORBIT

Macro context only. The descriptor contains one `PLANET_HANDOFF_ANCHOR` with `renderPrimitive: NONE` and a center exclusion. `macroOwnsPrimarySelectedWorld=false`; Chat C remains the only primary selected-world renderer.

## Transition contract

Supported adjacent scale transitions:

`GALAXY <-> NEIGHBORHOOD <-> SYSTEM <-> ORBIT`

Transitions communicate focus/scale and are `PRESENTATION_ONLY`. They do not advance canonical time, simulate orbital motion, claim travel time, or claim velocity. Reduced-motion produces duration `0`.

## Working-set hard limits

- galaxy queries: 64;
- visible galaxies: 24;
- neighborhood system-site queries: 192;
- visible systems: 24;
- stars/system: 4;
- planets/system: 10;
- hit objects: 24;
- labels: 16 desktop / 8 mobile;
- decorative depth points: 72 default / 96 hard max;
- cached scenes: 8;
- total objects + guides + decoration per scene: 128.

## Integration ownership

Chat A should supply the global scale and product shell placement. Chat C should supply the primary planet renderer beginning at Orbit. This branch intentionally does not modify central product orchestration, the normalized selection bridge, the planet renderer, or main.