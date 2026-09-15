# R6-J Systemic Audio and Scientific Sonification Research

Status: `RESEARCH_ONLY`
Freeze: `OFU-R6-W0-2026-09-15-27657AB9`
Base: `de796908d30ed52aedcc20830e94ccb5a730a94d` / tree `66652b162f496f36c2baced048815f525b3c5433`
Authority: `PRESENTATION_ONLY`

## Scope and activation result

R6-J is explicitly research-only in the W0 ownership record. No production audio extension point is authorized in this wave. This lane therefore does not modify Spatial Continuum production source, central test runners, bootstrap/provider registries, workflows, package/build surfaces, renderer, camera, experience, kernel, or canonical science.

The lane contributes only isolated architecture, a directly executable prototype, tests and integration evidence under the R6-J evidence path.

## Research conclusion

A scientifically honest audio system for Spatial Continuum should be a read-only presentation consumer of explicit world/context values. It should not infer missing physical acoustic conditions, should not mutate world truth, and should treat silence as a valid output.

The prototype separates three categories:

1. `environmental`: context-conditioned presentation that is permitted only when an input medium explicitly supports acoustic propagation and the context is not vacuum;
2. `sonification`: non-diegetic mapping of supplied model/presentation values to audible parameters, explicitly labeled as sonification rather than literal physical sound;
3. `presentation`: UI/orientation cues that may exist independently of physical acoustic propagation, but are never represented as diegetic ambience.

## Scientific-honesty rules

- Vacuum suppresses environmental propagation cues.
- Missing or unresolved medium support fails closed for environmental audio.
- Wind/weather inputs are accepted only when explicitly supplied; R6-J does not synthesize a fictional wind field from unrelated terrain or visual features.
- Microscopic audio requires explicit normalized density/energy/variation inputs and is labeled `SONIFICATION_NOT_LITERAL_SOUND`.
- The prototype does not claim measured waveforms, recorded ambience, exact acoustics, atomic audibility, molecular audibility, or canonical scientific evidence.
- Device quality adaptation reduces render budget only. The `semanticTruth` description is invariant across quality levels.
- Every audio layer carries a non-audio alternative statement; audio is not required to communicate essential status.

## Deterministic context contract

The isolated prototype accepts a bounded read-only context with:

- identity/regime;
- medium kind, propagation support, vacuum flag, optional normalized density and authority;
- optional wind/weather/terrain/material presentation values plus authority;
- optional microscopic density/energy/variation values plus authority;
- optional presentation travel/status intensity.

All numeric values are clamped and rounded deterministically. Unknown values remain `null`; they are not filled with pseudo-physical estimates.

## Resource and lifecycle design

Prototype hard bounds:

- at most one `AudioContext` per runtime instance;
- at most six procedural oscillator voices;
- no `AudioBuffer` allocation requirement;
- no network assets;
- no fetch/import/WebSocket dependency in the prototype;
- lazy context creation only after `resume({userGesture:true})`;
- resume without an explicit user-gesture acknowledgement is blocked;
- `suspend()` tears down active voices and suspends the context;
- `dispose()` tears down voices and closes the context;
- unsupported audio degrades to silence.

This is a research witness, not production certification of browser-policy behavior across all engines/devices.

## Accessibility model

Controls are modeled independently for:

- master enable/mute/volume;
- environmental audio mute/volume;
- scientific sonification mute/volume;
- presentation audio mute/volume;
- reduced-sensory gain reduction.

No audio layer is allowed to be the only carrier of essential state. Each layer records a non-audio alternative expectation.

## Relationship to prior systemic-audio work

The repository already contains the V1X-13 systemic-audio implementation. Its useful established principles include `PRESENTATION_ONLY` authority, explicit vacuum honesty, bounded procedural audio, lifecycle management and optional controls. R6-J does not copy that provider into Spatial Continuum production or activate its registry binding. Instead, this research prototype narrows the contract for R6 continuous-reality needs and strengthens fail-closed handling of missing medium/model inputs.

## Current R6 seam gap

The current R6 ownership/control record states that no dedicated R6 audio extension point has been identified. Current Spatial Continuum modules also do not expose a stable, convergence-owned audio context envelope containing all of the values required for environmental acoustic presentation.

Examples:

- `local-environment.js` provides deterministic presentation geometry, not wind/weather acoustic context;
- `micro-grammar.js` provides epistemically bounded presentation structure but not a canonical normalized density/energy/variation sonification contract;
- `experience.js`, `renderer.js` and `kernel.js` are convergence-owned/read-only to this lane.

Therefore no production hook is proposed as an R6-J write.

## Future convergence seam (proposal only)

If control convergence later promotes an audio seam, a minimal read-only interface could conceptually provide:

```text
readAudioContextSnapshot() -> {
  contextId,
  regime,
  medium: {
    kind,
    supportsAcousticPropagation,
    vacuum,
    densityNormalized?,
    authority
  },
  environment: {
    windIntensity?,
    weatherIntensity?,
    terrainRoughness?,
    materialHardness?,
    authority
  },
  micro: {
    active,
    densityNormalized?,
    energyNormalized?,
    variationNormalized?,
    authority
  },
  presentation: {
    travelIntensity?,
    statusIntensity?
  }
}
```

This should be immutable/read-only and must not grant audio authority over camera, navigation, selection, renderer picking, canonical science, model generation or world mutation.

A production integration should also define one convergence-owned user-gesture mount/resume path, lifecycle ownership on navigation/disposal, and UI wiring for independent categories. None of those are implemented by this research lane.

## Prototype files

- `prototype/systemic-audio-research.js`
- `prototype/systemic-audio-research.test.mjs`

The prototype is intentionally stored inside evidence rather than `src/` because R6-J is not a writer lane.

## Test evidence

Command:

```bash
node docs/experiments/spatial-continuum/evidence/r6-w0-systemic-audio/prototype/systemic-audio-research.test.mjs
```

Post-commit verification of the exact prototype/test blobs committed at `e51daebd5d37d5a8c62125643ec66ebe7bcce8be` (fetched from GitHub and executed after commit):

- status: `PASS`;
- cases: `13`;
- deterministic plan: PASS;
- vacuum suppresses environmental propagation: PASS;
- missing medium fails closed: PASS;
- micro mapping explicitly non-literal: PASS;
- independent category mute and non-audio alternatives: PASS;
- capability adaptation preserves semantic truth: PASS;
- inputs remain unmutated: PASS;
- silence is valid: PASS;
- runtime is lazy and gesture-aware: PASS;
- suspend/resume reuses a single context and respects voice bounds: PASS;
- unsupported audio fails to silence: PASS;
- no network/import dependency: PASS;
- environmental cues never claim literal physical evidence: PASS.

The subsequent evidence-only wording update does not modify either prototype/test blob.

Physical-device acoustic quality: `NOT_VERIFIED`.
Browser-policy matrix: `NOT_VERIFIED`.
Production integration: `NOT_IMPLEMENTED`.
Final systemic audio quality: `NOT_CLAIMED`.

## Falsification attempts

### Hypothesis: R6-J can directly turn current R6 local presentation geometry into environmental ambience.

Result: rejected. Geometry alone does not establish wind, weather or an acoustic medium. Doing so would create fictional physical ambience.

### Hypothesis: micro presentation grammar can be made audible as if microscopic motion were literal sound.

Result: rejected. The prototype requires explicit sonification values and labels the mapping non-diegetic and non-literal.

### Hypothesis: quality adaptation can alter the meaning of world-derived audio.

Result: rejected by contract/test. Capability controls only the selected render voices/update rate; the semantic truth envelope remains equal.

### Hypothesis: sound should always be present to improve immersion.

Result: rejected. Silence is an explicit valid state for unknown context, vacuum environmental layers, muted categories, unsupported devices, zero audio budgets, or no qualifying inputs.

## Integration patch requests

None. R6-J does not request a shared-surface edit in W0 because there is no authorized production seam and audio is not an M0 blocker.

## Known limitations

- Procedural oscillator rendering is a lifecycle/resource witness, not a quality target.
- No HRTF/spatialization, occlusion, terrain acoustics, material impulse response or atmospheric attenuation is claimed.
- No real audio-device quality measurement was performed.
- No cross-browser autoplay/user-gesture certification was performed.
- No canonical or model-derived environment fields are added.
- The normalized micro sonification inputs are an interface proposal and are not currently guaranteed by R6 production state.

## Recommendation

Keep R6-J `RESEARCH_ONLY` for W0. Preserve the evidence/prototype as the architecture foundation. Promote a production module only after control convergence owns a stable read-only context seam and explicitly authorizes R6-J paths or a successor audio lane.
