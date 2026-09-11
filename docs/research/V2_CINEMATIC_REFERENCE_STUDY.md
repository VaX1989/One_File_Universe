# V2 Cinematic Reference Study

Date: 2026-09-08
Lane: `parallel/v2.0-cinematic-total-experience-2026-09-08`
Authority: design/research guidance only; no source below is imported as runtime content.

## Purpose

This study extracts implementation principles for OFU's own visual language. It is not an asset/code/layout copying plan. OFU remains offline, deterministic, single-file and WebGL2-capable; scientific/model authority is never inferred from presentation fidelity.

## References and implementation consequences

| Reference | Feature observed | Why it works perceptually | OFU implication | Performance implication | Accessibility implication | Tier |
|---|---|---|---|---|---|---|
| Three.js WebGPURenderer manual, https://threejs.org/manual/en/webgpurenderer | WebGPU-first renderer with automatic WebGL2 fallback; node-based material/post stack; WebGPU renderer still described as experimental | Fidelity can progress without making a newer backend a semantic prerequisite | Keep OFU's strict WebGL2 path authoritative for presentation availability. Treat WebGPU only as an optional fidelity backend and never branch world state on backend | New effects must be budgeted and degradable; no backend-specific truth | Feature detection must not alter navigation or information | Optional enhancement |
| Three.js WebGPU post-processing manual, https://threejs.org/manual/en/webgpu-postprocessing.html | Effect combination and MRT-oriented post chain | High-end images come from a controlled stack rather than many unrelated effects | Prefer a small stack: exposure/tone shaping, restrained bloom/haze, AA. Do not make post FX compensate for weak composition | Combine work where possible; preserve low-tier composition | Effects must remain legible when reduced/disabled | Optional enhancement |
| NASA Eyes, https://science.nasa.gov/eyes/ and 2026-09-03 release notes | Browser-based spatial exploration; object/mission focus; 2026 Mars terrain/free-fly expansion; direct mouse + WASD free flight | The world remains the primary object while controls reveal progressively; spatial continuity creates confidence | Preserve direct object selection, reversible scale travel and one world context; surface descent should feel like continuation, not a page change | Terrain and mission detail are level/budget dependent rather than all materialized at once | Keyboard paths remain real controls, not secondary documentation | Baseline principle |
| Google Earth Studio camera target, https://earth.google.com/studio/docs/advanced-features/camera-target/ | Explicit target tracking; target influence can blend with camera rotation; manual camera changes can interrupt tracking | Subject remains composed while camera motion stays understandable | Cinematic framing must wrap the authoritative OFU camera, never replace it. User gesture immediately wins and cancels presentation interpolation | Target framing is cheap relative to scene complexity | Interruptibility and reduced motion are mandatory | Baseline principle |
| MDN `prefers-reduced-motion`, https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion | OS preference removes/reduces non-essential large motion; scaling/panning are specifically relevant vestibular triggers | Motion can communicate hierarchy without becoming mandatory | Large parallax, travel sweep and decorative drift collapse to near-instant state changes while preserving focus/selection | Reduced motion also lowers work on constrained devices | First-class contract | Baseline |
| Active Theory XR experiments, https://xr.activetheory.net/ | Reusable glow/PBR/post modules and explicit effort to keep high-fidelity compositing practical on mobile/XR | Material response, environmental light and compositing make objects feel spatially present | Reuse bounded rendering primitives across macro/planet/micro instead of adding scene-specific spectacle | Mobile must use the same composition with reduced samples/density, not an unrelated low-quality skin | Avoid effects that destroy contrast/focus | Baseline principle |
| SpaceEngine navigation FAQ/manual, https://spaceengine.org/manual/faq/ | Select target, go-to target, land, change velocity/FOV; strong object-centric navigation | A small, consistent gesture vocabulary scales to an enormous space | OFU should keep click/select, explicit approach/deeper, wheel semantic depth and reversible back behavior consistent across regimes | No implication to simulate unbounded visible content | High-DPI UI must stay readable and selectable | Baseline principle |
| Awwwards Astral Frontier planet study, https://www.awwwards.com/inspiration/3d-planet-slider-astral-frontier | Large asymmetrically staged planet, editorial typography, dark negative space, sparse controls | Subject dominance and deliberate cropping create scale before metadata is read | Planet approach becomes a hero composition: 40–75%+ viewport occupation where geometry/aspect permit, atmospheric separation, restrained context chrome | Achievable with shader/composition changes rather than brute-force geometry | Text must move away from the subject and survive narrow screens | Baseline visual principle |

## Decomposition: what OFU should borrow as principles

1. **Subject dominance before decoration.** Camera/framing and negative space deliver more perceived quality per millisecond than particle count.
2. **Lighting carries geometry.** Key light, terminator, rim/atmosphere and material response should make a planet or structure readable even with post effects disabled.
3. **Target-aware movement, not canned movies.** Arrival can be cinematic only while it remains interruptible and selection-preserving.
4. **One visual grammar across regimes, distinct material grammar per regime.** Shared typography, safe zones and selection language; different macro/planet/surface/micro lighting and depth cues.
5. **Progressive disclosure.** Persistent UI communicates only location, way back/deeper and immediate affordance. Evidence and expert state remain available on demand.
6. **Backend fidelity is presentation-only.** WebGPU may improve fidelity later, but WebGL2 remains a high-quality baseline and no backend may alter identity, history or simulation outcome.
7. **Bounded quality scaling.** Lower tiers reduce sample density/secondary haze/detail while preserving hero framing, light direction, readable subject and semantic UI.

## Explicit non-adoptions

- No remote textures, fonts, shaders, models, analytics or APIs.
- No proprietary reference assets or branded layout cloning.
- No mandatory WebGPU dependency.
- No particle-count escalation as a quality strategy.
- No fake scientific detail promoted by a more realistic shader.
- No second cinematic camera or autonomous navigation authority.
- No perpetual decorative motion that competes with semantic movement.
