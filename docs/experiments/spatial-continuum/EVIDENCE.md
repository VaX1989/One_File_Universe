# Spatial Continuum experiment evidence

- Mission checkpoint: 2026-09-13
- Base: `5f3dbdcccc409c3bc29684e062ad7730ddea0c69`
- Engine: Babylon.js `9.26.0`, WebGL2
- Browser run: Playwright Chromium `151.0.7922.34`, Windows host, direct `file://`
- Raw browser result: [browser-results.json](evidence/browser-results.json)

This is evidence for an architectural proving slice, not a production certification. The rendered result was reviewed visually; screenshot hashes were not used as a quality judgment.

## Product result

The experiment proves two connected, reversible journeys in one persistent scene:

```text
SYSTEM → ORBIT → APPROACH → GLOBAL_SURFACE → REGIONAL_SURFACE
       → LOCAL_SURFACE → HUMAN

HUMAN → MATERIAL → MICROSTRUCTURE → MOLECULAR → ATOMIC
```

The canonical planet remained `9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e` across the full journey. The donor's model world ID and material source world ID matched it exactly. The distinct V2 navigation entity `2b618096266bf06162398a404355940664f5e8459d2be0787dab271c80c553e7` was not misused as canonical identity.

The selected sample remained `4a7f86b77a6ef7aa8eba823a7a80662f4ac5614076d8c76e30bb64c639f20d35` through MATERIAL, MICROSTRUCTURE, MOLECULAR, ATOMIC, and the reverse return to HUMAN.

## Visual evidence reviewed

| State | Evidence | Human review |
| --- | --- | --- |
| SYSTEM | [system](evidence/system.png) | Genuine host star and selected world occupy one spatial system with a deterministic instanced star field. More immersive than V2, but still sparser and less explanatory than the best V1 system overview. |
| ORBIT | [orbit](evidence/orbit.png) | The selected world is a large shaded planet, not V2's tiny marker. System context recedes behind it. |
| APPROACH | [early](evidence/approach-early.png), [mid](evidence/approach-mid.png), [late](evidence/approach-late.png), [settled](evidence/approach-settled.png) | The same texture, light, curvature, and retained target grow without a blank or object replacement. |
| GLOBAL | [global](evidence/global_surface.png) | Planet curvature remains visible and the same surface target is explicit before terrain refinement. |
| REGIONAL | [regional](evidence/regional_surface.png) | The target resolves into an oblique deterministic terrain field with depth and silhouette. |
| LOCAL | [local](evidence/local_surface.png) | The same height function refines; local rocks and sample appear without loading another map. |
| HUMAN | [human](evidence/human.png) | A navigable local camera and selectable amber sample replace V1/V2's fixed compositions. The sample is visually oversized and art polish remains experimental. |
| MATERIAL | [material](evidence/material.png) | The genuine ICE sample becomes a source-tethered model-derived crystal volume rather than a generic slab. |
| MICROSTRUCTURE | [microstructure](evidence/microstructure.png) | A dense, explicitly presentation-only polycrystalline volume is spatial and nonblank. |
| MOLECULAR | [molecular](evidence/molecular.png) | Nonblank 3D contextual grammar; text explicitly says unknown chemistry remains unknown. |
| ATOMIC | [atomic](evidence/atomic.png) | Nonblank bounded nucleus/probability-field presentation; it avoids an electron-orbit claim. |
| Reverse micro | [HUMAN restored](evidence/human-reversed-from-atomic.png) | Exact sample focus survives ATOMIC → HUMAN. |
| Reverse planetary | [ORBIT restored](evidence/orbit-reversed.png), [SYSTEM restored](evidence/system-reversed.png) | Same canonical body and recognizable framing return; no arbitrary default world is loaded. |
| Mobile landscape | [844×390](evidence/mobile-landscape-844x390.png) | Full canvas remains usable, context inspector collapses, controls use 112.6 px of 390 px height, and pinch changes continuous scale. Rail crowding remains a polish issue. |

## VN vs VN-1 product differential

`VN` is this experiment. `VN-1` is V1 as the experiential oracle. Released V2 is a separate architecture/regression baseline.

| State | Versus V1 | Versus released V2 | Reason |
| --- | --- | --- | --- |
| SYSTEM | ROUGHLY_EQUAL | BETTER | New view is spatial/direct and less dashboard-like; V1 still labels and composes its small system more clearly. |
| ORBIT | BETTER | CLEARLY_BETTER | Large shaded world, direct renderer picking, retained system context; V2 showed a marker. |
| APPROACH | CLEARLY_BETTER | CLEARLY_BETTER | Measured monotonic growth and camera travel preserve the same body. |
| GLOBAL_SURFACE | BETTER | CLEARLY_BETTER | Curvature and target survive before terrain handoff; no unrelated flat/global replacement. |
| REGIONAL_SURFACE | BETTER | CLEARLY_BETTER | Oblique depth and inherited target/height function are legible. |
| LOCAL_SURFACE | BETTER | CLEARLY_BETTER | Progressive geometry and parallax replace a disconnected diagram. |
| HUMAN | CLEARLY_BETTER | CLEARLY_BETTER | Actual WASD movement, target-aware view, and renderer-owned sample selection. |
| MATERIAL | BETTER | CLEARLY_BETTER | Source-specific model-derived ice volume and explicit tether. |
| MICROSTRUCTURE | CLEARLY_BETTER | CLEARLY_BETTER | Dense 3D volume with real occlusion; no blank/flat fallback. |
| MOLECULAR | BETTER | CLEARLY_BETTER | Readable nonblank 3D contextual representation with honest authority. |
| ATOMIC | BETTER | CLEARLY_BETTER | Nonblank probability context rather than a classical-orbit fiction or black scene. |

Overall V1 differential: **BETTER for continuity, embodiment, direct interaction, and the lower-scale bridge; mixed on SYSTEM explanatory composition and final art polish.**

Overall V2 differential: **CLEARLY_BETTER across the proving slice.**

## Transition differential

| Reversible handoff | Nature | Versus V1 | Versus V2 | Evidence/result |
| --- | --- | --- | --- | --- |
| SYSTEM ↔ ORBIT | continuous camera + overlapping system/body | BETTER | CLEARLY_BETTER | Context recedes while selected body becomes subject. |
| ORBIT ↔ APPROACH | continuous spatial travel | CLEARLY_BETTER | CLEARLY_BETTER | Planet diameter 839 px → 1,459 px; early/mid/late growth is monotonic. |
| APPROACH ↔ GLOBAL | continuous camera + globe handoff | BETTER | CLEARLY_BETTER | Identity, texture, orientation, and target ring persist. |
| GLOBAL ↔ REGIONAL | perceptual globe/terrain handoff | BETTER | CLEARLY_BETTER | No blank; terrain overlaps the outgoing global context. |
| REGIONAL ↔ LOCAL | screen-space-driven terrain refinement | BETTER | CLEARLY_BETTER | Same target and height function; active LOD derives from projected span. |
| LOCAL ↔ HUMAN | camera-frame blend + retained terrain | BETTER | CLEARLY_BETTER | Human camera becomes embodied without replacing the local world. |
| HUMAN ↔ MATERIAL | identity/context transition | BETTER | CLEARLY_BETTER | Exact source sample remains focused; literal geometric certainty is not claimed. |
| MATERIAL ↔ MICROSTRUCTURE | contextual representation handoff | BETTER | CLEARLY_BETTER | Overlap is source-anchored and authority-labeled. |
| MICROSTRUCTURE ↔ MOLECULAR | contextual representation handoff | BETTER | CLEARLY_BETTER | Nonblank, reversible, no canonical chemistry invented. |
| MOLECULAR ↔ ATOMIC | contextual representation handoff | BETTER | CLEARLY_BETTER | Probability context replaces a classical-orbit trope. |

Rapid SYSTEM → HUMAN interruption converged to HUMAN without corrupting state. Repeated HUMAN/SYSTEM and HUMAN/ATOMIC loops retained stable resource counts.

## Browser and interaction results

| Gate | Result |
| --- | --- |
| Direct-file | PASS |
| Offline / required runtime network | PASS / 0 requests |
| Backend | WebGL2 PASS; WebGPU not required or tested |
| Scene/camera authorities | 1 scene / 1 camera |
| Pointer selection | PASS: Babylon ray pick selected the visible canonical body and exact source sample |
| Continuous wheel/pinch | PASS; synthetic touch pinch moved the continuous target coordinate |
| HUMAN movement | PASS; W changed local camera position |
| Interruption | PASS; newer target won without state corruption |
| Reverse identity | PASS for ATOMIC → HUMAN and HUMAN → SYSTEM |
| Mobile 844×390 | PASS in emulation; no physical-device claim |
| Reduced motion | PASS in 289 ms; identity/context retained |
| Runtime errors | 0 |
| Context loss/restoration | exercised, 1 loss / 1 restoration observed |
| Resource soak | stable at 96 meshes, 26 materials, 1 texture after repeated loops |

## Artifact results

- Build contract: `ofu-spatial-continuum-build-1`
- Artifact: `dist/One_File_Universe_Spatial_Continuum.html`
- Bytes: 4,580,694
- SHA-256: recorded by `dist/spatial-continuum-build-manifest.json` for the exact checkout (the donor artifact embeds the checkout revision, so this value intentionally changes across commits)
- Same-revision second build: byte-identical
- External runtime URLs: none
- CSP runtime connections: `connect-src 'none'`
- Babylon license: complete Apache-2.0 text embedded; normalized-text SHA-256 `3a1160f88f3ffdafee129832f8bf5806073f77a43962f15a13ab63f1a5047372`

The experiment adds about 1.69 MB over the released V2 HTML. That cost is material and must be reduced when the current full V2 donor is replaced by an authority-only donor.

## Performance

The final targeted journey window reported:

- median frame interval: 50.0 ms
- p95: 83.3 ms
- p99: 100.0 ms
- frames over 34 ms: 115 / 153
- frames over 50 ms: 42 / 153
- median input-to-first-visible-response: 19.4 ms

The established released-V2 audit aggregate on the same host was approximately median 16.7 ms, p95 50 ms, p99 383.2 ms, with severe multi-second outliers. The experiment removes that pathological p99 tail and responds immediately, but its ordinary software-rendered motion is too slow and p95 is worse. The measurement windows are not identical, so this evidence does **not** support a blanket performance-win claim.

Performance acceptance is therefore **NOT MET**. Physical-GPU profiling, render-time instrumentation, backend/browser coverage, and further representation/material optimization are required before expansion.

## Planetary acceptance

| Condition | Result |
| --- | --- |
| Same canonical world SYSTEM → HUMAN | PASS |
| ORBIT presents a planet | PASS |
| Coherent apparent-size growth | PASS |
| Camera targets actual selected body | PASS |
| Picking matches rendered objects | PASS |
| APPROACH differs from ORBIT | PASS |
| APPROACH → GLOBAL target/orientation continuity | PASS |
| GLOBAL → REGIONAL → LOCAL refinement | PASS |
| Genuine HUMAN movement | PASS |
| No blank critical scale | PASS after visual review |
| Spatially intelligible reverse | PASS |
| Safe interruption | PASS |
| Reduced-motion identity | PASS |
| Runtime network | PASS: none |
| Offline/direct-file artifact | PASS |
| Visually competitive with V1 | PARTIAL: better overall; SYSTEM and final surface art need convergence |
| Performance tails materially better than V2 | PARTIAL/FAIL: p99 better, p95 worse |

## Microscopic acceptance

All ten mission conditions pass in this slice: source object and world are explicit; material/micro representations remain linked to the same sample; MOLECULAR and ATOMIC are nonblank; authority is explicit; no exact chemistry/positions are claimed; and reverse travel restores the sample at HUMAN.

## Remaining limitations

- Performance is not proven for expansion.
- Only SYSTEM through ATOMIC is implemented; UNIVERSE/GALAXY/REGION/NEIGHBORHOOD are not migrated.
- Final terrain, HUMAN sample scale, atmosphere, and SYSTEM composition need art-direction work.
- Audio is not integrated in the experiment.
- WebGPU, Firefox, Safari, physical mobile/touch, device memory trends, and repeated GPU-driver context recovery are not yet covered.
- The artifact still embeds the whole released V2 donor before disposing its visual product; a production migration needs a smaller authority-only bootstrap.
- The evidence uses one deterministic OFU-selected system/body/sample. Additional canonical worlds and material kinds must be adversarially sampled.

## Recommendation

`CONTINUE_EXPERIMENT`

The architectural hypothesis is supported: a persistent graph, continuous scale, target-aware camera, overlapping representations, and renderer-owned picking solve the major V2 experience failures without discarding canonical OFU authority. The result is not yet eligible for expansion or stable-product replacement because the p95 motion gate and cross-browser/physical-device evidence remain open.
