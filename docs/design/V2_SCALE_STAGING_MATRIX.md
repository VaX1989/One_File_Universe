# V2 Scale Staging Matrix

Status: implementation contract for the cinematic lane. Only scales exposed by current Living/V2 composition are treated as directly shippable; adjacent conceptual regimes are mapped to the nearest exposed stage rather than fabricated.

| Scale / exposed stage | Hero subject | Framing / FOV intent | Light / background | UI density / labels | Arrival / exit | LOD / mobile | Reduced motion |
|---|---|---|---|---|---|---|---|
| Universe / `UNIVERSE` | rare galaxies / luminous structure | broad field, large negative space, no central clutter | deepest black; sparse stellar hierarchy | minimal; context + rail; only important/selectable labels | context reveal from opening; deeper to galaxy | bounded rows; phone keeps larger glyphs, fewer competing labels | instant context reveal |
| Galaxy / `GALAXY` | selected galaxy mass | galaxy can occupy a large background fraction with off-axis structure | warm core, cooler halo, dust contrast | selected/near labels only | continuous scale travel into region | bounded deterministic glyph detail | no parallax sweep |
| Region / `REGION` | stellar region structure | medium-wide orientation; preserve parent galaxy cue | dark with sparse mid-depth structures | restrained | travel into neighborhood | existing spatial provider bounds | instant settle |
| Stellar neighborhood / `NEIGHBORHOOD` | nearby stellar destinations | spatial perspective, readable separation | stellar key points, low haze | labels only where legible | reveal system destinations | bounded row count, touch targets external to canvas | no large camera interpolation from cinematic layer |
| System / `SYSTEM` | dominant star + orbital architecture | star remains hierarchy anchor; destinations spaced around it | warm stellar key, faint orbit geometry | destinations + one context line | enter body/orbit; back restores system | provider already bounded; portrait emphasizes selected destination | existing semantic transition only |
| Orbit / `ORBIT` | selected body / star | selected world clearly dominant but contextual orbit preserved | dark space, key light from star direction | primary approach action and context | approach or back to system | same identity and model body | no cinematic sweep |
| Planet approach / `APPROACH` | planet | strongest hero moment; globe dominates minor viewport dimension, deliberate near-crop where safe | strong terminator, atmospheric limb, sparse celestial context | title-safe + one approach/descend action; evidence off-stage | arrival -> immediate manipulation; exit restores orbit | shader/detail scale down before composition does; phone hero remains large | instant hero framing, no parallax |
| Planet/global / `GLOBAL_SURFACE` | manipulable globe / world map context | calmer than approach; full readable globe or global map | same light direction/atmosphere continuity | contextual location + rail | continuous semantic descent | bounded map texture; phone keeps globe dominant | no long settle |
| Regional / `REGIONAL_SURFACE` | horizon/terrain region | lower eye line, distant haze, readable foreground | atmospheric sky/horizon, directional surface light | sparse local context | descend/return | existing terrain budget; reduce distant detail first | no camera sweep added |
| Surface/local / `LOCAL_SURFACE` | local terrain + selectable objects | foreground scale cues; avoid dashboard overlay | material-specific foreground, aerial distance | object labels selective; inspector on request | direct object selection / deeper human/material | existing terrain cells; larger touch affordances | immediate state |
| Human / `HUMAN` | organism/settlement/material at human scale | tighter framing, clear size cues | warmer local bounce / selective focus | contextual selection + evidence access | life/civ/material inspection | bounded local objects | no decorative drift |
| Life (within local/human where model exposes) | organism / ecological relation | subject-led composition inside same terrain | biosphere hue only when model eligible | role/lineage on selection, not always-on HUD | select/inspect/back | bounded populations | selection emphasis only |
| Civilization (within local/human where exposed) | settlement/infrastructure/history trace | terrain remains spatial context | warm emissive/mineral traces; no generic sci-fi neon | settlement/history only on demand | inspect/history projection/back | bounded settlement list/traces | no animated traffic fiction |
| Matter / actual `MATERIAL` stage | selected material/source components | optical-stage framing; layered structural hierarchy | dark neutral, mineral spectral accents | source identity + regime honesty | deeper to microstructure; back restores exact source | bounded components | instant regime change |
| Tissue / Cell | not a distinct Living stage in the authenticated source | **not fabricated**; represented only if a provider exposes it through existing micro contracts later | - | - | - | - | - |
| Microscopic / actual `MICROSTRUCTURE` stage | bounded source-derived structure | structural focus, not space-particle reuse | dark optical-stage | source + structure | deeper/back through existing Living history | bounded objects | no drift |
| Molecular / `MOLECULAR` | molecular structure | selective focus and depth ordering | cool neutral + restrained element accents | source + structure | deeper atomic / back | bounded atoms/bonds | instant settle |
| Atomic / `ATOMIC` | structural atom representation | sparse, schematic depth | dark field, element accents | explicit no-orbit/no-trajectory disclosure | back restores exact source | bounded atoms | no orbital animation |

Conceptual labels such as “Matter” or “Microscopic” are editorial names only; the shipping runtime stages are `MATERIAL` and `MICROSTRUCTURE`. The cinematic observer maps those exact stage tokens to the micro visual regime and does not introduce alternative scale state.

## Shared invariants

- Hero subject never loses canonical/model identity because of presentation framing.
- The stage may change composition by aspect ratio, but semantic state is identical.
- Labels yield before obscuring the subject; all critical actions have non-canvas equivalents.
- Background density and secondary effects are the first fidelity knobs reduced under resource pressure.
- Reverse traversal restores previous context from existing Living history rather than reconstructing it visually.
