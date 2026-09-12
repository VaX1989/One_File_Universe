# V2 Motion Grammar

Status: ships with the cinematic lane. Motion authority remains subordinate to existing Living/V2 camera and navigation state.

## Governing rule

**User input has authority.** Cinematic motion is presentation around the authoritative state, never a second camera or queued movie. Existing drag, wheel, pinch, keyboard, selection and back/deeper controls may interrupt at any time.

## Families

| Family | Semantic weight | Typical behavior | Interruption |
|---|---:|---|---|
| Micro | very low | 80–140 ms hover/press/focus response | immediate |
| UI | low | 140–220 ms opacity/position settle | immediate |
| Object | medium | 180–320 ms selection emphasis or focus settle | immediate |
| Camera | high | existing authoritative damped travel/framing | pointer/wheel/key/selection wins immediately |
| Scale | very high | departure → travel → context reveal → arrival → settle | input cancels presentation continuation |
| World | ambient | very slow bounded environmental variation | nonessential; removed for reduced motion |
| System | functional | loading/recovery/context restore | never blocks input longer than required by state |

## Easing intent

- Micro/UI: fast ease-out, no elastic overshoot.
- Object selection: critically damped visual emphasis; no repeated pulse.
- Camera/scale: velocity-aware damping from existing authority; cinematic layer may crossfade edge contrast but does not synthesize camera coordinates.
- Recovery/loading: opacity only where possible.

One generic easing curve is not used for every semantic class.

## Stage change choreography

A semantic stage mutation is interpreted as:

1. **Departure** — previous context remains legible while state changes.
2. **Travel** — existing camera/travel systems own geometry and scale.
3. **Context reveal** — title-safe and regime treatment update.
4. **Arrival** — new stage cue becomes readable.
5. **Settle** — transient cue clears; the world is immediately manipulable.

The cinematic observer only marks presentation phase and removes it on user input or a bounded settle timer. It never delays the underlying navigation transaction.

## Interruption contract

`pointerdown`, `wheel`, navigation key input, touch/pinch and subsequent stage changes terminate any transient cinematic presentation marker. No input lock, animation queue or click suppression is permitted.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- no parallax or sweeping transform is introduced by the cinematic layer;
- stage-change treatment becomes effectively instantaneous opacity/contrast change;
- no decorative drift or continuous scale animation is allowed;
- existing semantic navigation, selection, keyboard focus and context remain unchanged;
- transient guidance does not animate in/out.

## Responsive motion

Mobile/coarse-pointer staging shortens transient UI movement and avoids large lateral UI travel. Portrait mode prioritizes stable hero framing and bottom navigation. Motion never depends on hover availability.

## Audio relationship

Existing systemic audio may observe arrival/focus/selection/scale semantics. This lane does not add soundtrack dependence or create a second audio state machine. Reduced motion does not automatically mute audio, but all audio remains user-controlled and optional under the existing product contract.
