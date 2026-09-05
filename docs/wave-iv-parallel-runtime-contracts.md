# Wave IV parallel runtime contracts

Status: development interface freeze for the Wave IV parallel base. These interfaces are presentation/runtime contracts only and do not alter canonical P1-P6 authority.

## Scale Runtime — `ofu-wave-iv-scale-runtime-1`

Authoritative owner: `OFU.waveIVScaleRuntime`.

Owns continuous distance intent, always-defined semantic scale, selected canonical target reference, active scene provider, transition state, camera intent source, navigation source and last stable state. Current bands are `SYSTEM`, `ORBIT`, `APPROACH`, `CLOSE`. The contract is explicitly extensible to `GALAXY`, `STELLAR_NEIGHBORHOOD`, `SYSTEM`, `ORBIT`, `APPROACH`, `GLOBAL_SURFACE`, `REGIONAL_SURFACE`, `LOCAL_SURFACE`, `HUMAN` without adding a second scale variable.

Continuous free zoom is represented as `intentKind = continuous`; it never uses a null semantic stage. Projection-aware named anchors remain `intentKind = anchor`.

Events: `selectionChanged`, `scaleChanged`, `sceneChanged`, `cameraIntent`, `rendererReady`, `viewportChanged`, `transitionChanged`, `scaleAnchorsChanged`.

## Input Intent — `ofu-wave-iv-input-intent-1`

Authoritative owner: `OFU.waveIVInputRouter`.

Mouse, touch, pen, keyboard, wheel and stage-button camera/scale actions enter one capture-phase router. The router emits camera or scale intent to the Scale Runtime. Compatibility listeners may still exist in legacy modules, but the normalized router intercepts the supported user path before those listeners can independently mutate scale/camera state.

Touch preserves native vertical scrolling and pinch zoom. Horizontal direct drag becomes camera rotation intent.

## Selection — `ofu-wave-iv-selection-1`

Canonical selection remains established by the existing fail-closed Inspector/renderer selection bridge. Once established, the bridge publishes the immutable canonical key, planet identifier and presentation support state to the Scale Runtime. Camera interaction cannot mutate canonical identity.

## Scene Provider — `ofu-wave-iv-scene-provider-1`

Providers register a stable id, supported semantic bands, optional `setActive(active)` lifecycle callback, camera-intent handler and/or distance handler.

Normalized ownership:

- `SYSTEM` -> `visual-universe-system`
- `ORBIT` -> `planet-webgl`
- `APPROACH` -> `planet-webgl`
- `CLOSE` -> `planet-webgl`

The Canvas2D visual-universe overlay is hidden outside SYSTEM by the scene normalizer; therefore it cannot paint a second planet over the hardened WebGL renderer in planet-primary scales.

## Renderer Lifecycle — `ofu-wave-iv-renderer-lifecycle-1`

Registration announces `rendererReady`. Scale ownership changes invoke provider activation/deactivation. Inactive compatibility renderers must not own scale or selection truth. Existing resource-release semantics for canonical target changes remain unchanged.

## Transition — `ofu-wave-iv-transition-1`

A scale-band change records `{from,to,source,startedAt,id}`. Transition state is descriptive presentation/runtime state only. It cannot alter canonical facts. Named-stage resize recomputes projection-aware anchors while preserving the named semantic band.

## Compatibility debt

Legacy `v08ExploreNavigation`, `planet-preview` listeners and product-shell polling remain embedded for backward compatibility. They are not authoritative in the normalized user path: input capture delegates to the Wave IV runtime, `navigateToRadii` is delegated one-way into the runtime, and Explorer scene convergence is event-driven. Removing the dormant legacy listeners and generic UI polling can be done after downstream Wave IV lanes migrate fully to these contracts.
