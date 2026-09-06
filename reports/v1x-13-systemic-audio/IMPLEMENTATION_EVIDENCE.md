# V1X-13 Systemic Audio Implementation Evidence

Authority: `PRESENTATION_ONLY`.

## Production delta

The lane adds an optional systemic audio presentation provider with:

- a read-only contextual plan for macro, approach/surface, life/ecology, civilization and micro sonification;
- explicit non-diegetic vacuum sonification so no cue is presented as literal sound propagation in vacuum;
- a bounded `AudioWorklet` procedural path with oscillator-only fallback and safe silence when audio APIs are unavailable;
- explicit resume, suspend and dispose lifecycle management;
- mountable enable, volume, mute and reduced-sensory controls that state audio is not required for navigation or accessibility;
- a pure PX `REPRESENT` binding that returns a presentation envelope without canonical mutation capability.

The frozen Prompt-0 ownership validator authorizes `src/v1x-13-systemic-audio/**`, not the prompt-local `src/audio/v1/**` spelling. The lane therefore preserves the frozen ownership oracle and leaves any relocation/alias to convergence.

## Cue authority map

| Cue | Context | Diegetic policy | Authority / fidelity |
| --- | --- | --- | --- |
| `orientation_sonification` | macro / approach travel | non-diegetic, allowed in vacuum | `PRESENTATION_ONLY`; no physical sound claim |
| `atmospheric_motion_cue` | audible medium + supplied wind context | qualitative diegetic presentation | `PRESENTATION_ONLY`; not measurement evidence |
| `surface_weather_cue` | audible medium + supplied weather context | qualitative diegetic presentation | `PRESENTATION_ONLY`; not meteorological evidence |
| `biophony_cue` | audible medium + supplied life-present/activity context | qualitative diegetic presentation | `PRESENTATION_ONLY`; not species/abundance evidence |
| `civilization_activity_cue` | supplied civilization activity context | abstract non-diegetic pulse | `PRESENTATION_ONLY`; no historical/population/event proof |
| `micro_sonification` | micro/molecular/atomic presentation context | always non-diegetic | `PRESENTATION_ONLY`; microscopic processes are not claimed literally audible |

## Resource/lifecycle bounds

Hard runtime limits: one `AudioContext`, one worklet node, at most six fallback voices, at most 13 live Web Audio nodes, six presentation layers, and zero `AudioBuffer` bytes. Context creation is lazy and occurs only on explicit `resume()`. Muting or disabling tears down render nodes; `suspend()` tears down render nodes and suspends the context; `dispose()` tears down nodes and closes the context. Worklet module object URLs are revoked after load.

## Local deterministic evidence

Command:

`node tests/v1x-13-systemic-audio/run.mjs`

Observed result:

- status `PASS`, 17 cases;
- fallback peak: 9 live nodes;
- worklet peak: 2 live nodes;
- max allowed live nodes: 13;
- buffer bytes: 0;
- vacuum literal sound claim: false;
- supplied world-context SHA-256 before and after audio operations: `e2747cb94e00e193ee01c049c14a92ed35d8cec593507f6cd224d9d0786bc2a1` (unchanged);
- physical-device evidence: `NOT_VERIFIED`.

A lane-owned browser journey fixture is included for DOM control/vacuum-honesty inspection. The current execution container's headless Chromium process did not complete its DOM dump, so no browser or physical acoustic evidence is claimed from that attempt.

## Accessibility and non-interference

Audio remains optional. No audio cue is the sole carrier of navigation, selection, provenance, state, or accessibility meaning. Reduced-sensory mode suppresses civilization pulses and caps retained environmental/life layer gain. The provider accepts read-only context, copies only bounded scalar fields into runtime context, emits no P4 events, owns no selection/camera/scene/input authority, and reports `worldStateMutations: 0` in its lifecycle witness.

## Integration dependencies

Convergence must bind `v1x13.representation.systemic-audio` into the shared PX registry and choose where to mount the control panel / call `resume()` in an actual user gesture. V1X-10 owns broader accessibility/input integration; V1X-11 owns shared resource-budget semantics. No lane-local rebase onto those branches is authorized.
