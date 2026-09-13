# Spatial Continuum R2 and R3 evidence

- Mission checkpoint: 2026-09-13
- Stable base: `5f3dbdcccc409c3bc29684e062ad7730ddea0c69` / tree `f84f05f9a12e110bb48f7605d8f577b0886dfe02`
- Implementation measured: `8e2dd3f1944fab8898ce45cc8b54a9e37ea5fcac` / tree `3cb575fcf75706842944a929402ff63350afeeea`
- Engine: Babylon.js `9.26.0`, WebGL2 baseline
- Raw results: [browser](evidence/browser-results.json), [generalization](evidence/generalization-results.json), [matrix](evidence/matrix-results.json), [performance/resources](evidence/performance-results.json)

This is an architectural falsification checkpoint, not production certification. Automated assertions establish identity, transform, interaction, resource, and browser facts. Screenshots were inspected by a human; image hashes were not treated as quality evidence.

## Executive result

R2 converts the original authored vertical slice into a target-derived, frame-derived, multi-world kernel:

```text
SYSTEM → ORBIT → APPROACH → GLOBAL_SURFACE → REGIONAL_SURFACE
       → LOCAL_SURFACE → HUMAN → MATERIAL → MICROSTRUCTURE
       → MOLECULAR → ATOMIC → exact conceptual reverse
```

The default journey preserves canonical world `9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e` and source sample `4a7f86b77a6ef7aa8eba823a7a80662f4ac5614076d8c76e30bb64c639f20d35`. It does not confuse V2 navigation entity `2b618096266bf06162398a404355940664f5e8459d2be0787dab271c80c553e7` with canonical identity.

Three additional genuine OFU contexts at one real multi-body system complete SYSTEM → ATOMIC → SYSTEM with distinct physical radii, surface coordinates, surface/sample identities, and ROCK/ICE material classes. A Babylon ray pick of another rendered body rebinds the single focus/camera authority. Surface travel remains disabled when a sibling has not been genuinely materialized.

## Architectural hypotheses falsified

| Hypothesis | Adversarial test | Evidence | Result |
| --- | --- | --- | --- |
| Camera geometry derives from the selected target | Change selected body/radius; retain user yaw/pitch; compare derived pose and projected coverage | Unit and multi-world browser tests | SUPPORTED; no Cartesian `CAMERA_KEYS` remain |
| Renderer geometry derives from OFU frames | Compare registered frame-relative positions to Babylon mesh transforms across system/body/surface/sample | Unit and generalization tests | SUPPORTED |
| Hierarchical precision survives extreme range | Resolve a 3 m child separation below a `1e20 m` ancestor using LCA-relative output | Development tests | SUPPORTED; direct absolute subtraction would lose the delta |
| Surface target remains one location | Use three latitude/longitude pairs, verify body-fixed point, tangent frame, sample frame, renderer point, and reverse `surfaceId` | Generalization tests | SUPPORTED as `MODEL_DERIVED`, not canonical geodesy |
| Alternate body selection uses one renderer reality | Pointer-pick a visible sibling, then verify focus, frame, radius, camera geometry, one scene, and one camera | Generalization/browser tests | SUPPORTED |
| LOD is observable scene behavior | Traverse regional/local/human and assert active patch plan changes 4 → 16 from projected error while pool remains 16 | Browser and unit tests | SUPPORTED for bounded uniform refinement; sparse planetary refinement remains open |
| Resources remain bounded across reuse | Ten SYSTEM/HUMAN and HUMAN/ATOMIC loops with forced GC, history/resource snapshots | Performance test | SUPPORTED for this slice |
| Context restore is functional | Lose/restore WebGL context, then require nonblank render, original focus, picking, travel, and HUMAN movement | Chromium browser test | SUPPORTED |
| One happy world was not a hidden assumption | Exercise genuine orbit slots 0, 2, 5 at different geodetic targets and material classes | [generalization results](evidence/generalization-results.json) | SUPPORTED for terrestrial ROCK/ICE contexts; broader body classes remain open |

## Visual evidence reviewed

| State | Evidence | Review |
| --- | --- | --- |
| SYSTEM | [system](evidence/system.png) | Genuine host/system bodies inhabit one selectable 3D frame. Stronger direct manipulation than V2, though V1 still has better explanatory composition. |
| ORBIT | [orbit](evidence/orbit.png) | Selected body is a large shaded planet rather than V2's marker; system context recedes. |
| APPROACH | [early](evidence/approach-early.png), [mid](evidence/approach-mid.png), [late](evidence/approach-late.png), [settled](evidence/approach-settled.png) | Same surface/light/target grows from 824 px at ORBIT through 1,178 px early to 1,521 px settled without a blank or identity replacement. |
| GLOBAL | [global](evidence/global_surface.png) | Planet curvature and the same model surface target remain visible before terrain handoff. |
| REGIONAL | [regional](evidence/regional_surface.png) | Oblique deterministic terrain reads as one continuous field. Shared finite-difference normals remove the former patch-border lighting seam. Art remains coarse. |
| LOCAL | [local](evidence/local_surface.png) | Same height field refines to 16 patches; rocks/sample enter without loading another map. |
| HUMAN | [human](evidence/human.png) | Real WASD camera movement and renderer-owned amber sample selection. Sample scale is now locally credible; terrain is still prototype-grade. |
| MATERIAL | [material](evidence/material.png) | Genuine sample identity remains explicit; geometry is honestly model-derived/presentation-only. |
| MICROSTRUCTURE | [microstructure](evidence/microstructure.png) | Spatial, nonblank contextual volume tied to the same sample. |
| MOLECULAR | [molecular](evidence/molecular.png) | Nonblank 3D grammar while exact chemistry remains explicitly unknown. |
| ATOMIC | [atomic](evidence/atomic.png) | Bounded nucleus/probability presentation avoids a false classical-orbit claim. |
| Reverse | [HUMAN restored](evidence/human-reversed-from-atomic.png), [ORBIT restored](evidence/orbit-reversed.png), [SYSTEM restored](evidence/system-reversed.png) | Sample, body, target, and meaningful prior context return without loading an arbitrary world. |
| Alternate worlds | [slot 0](evidence/world-0-atomic.png), [slot 2](evidence/world-2-atomic.png), [slot 5](evidence/world-5-atomic.png) | Lower-scale representation varies from genuine ROCK/ICE context without asserting exact chemistry. |
| Mobile/tablet | [844×390](evidence/mobile-landscape-844x390.png), [390×844 DPR2](evidence/mobile-portrait-390x844-dpr2.png), [1024×768 DPR2](evidence/tablet-1024x768-dpr2.png) | Primary world remains visible; inspector collapses; controls remain reachable. The horizontal rail clips/scrolls long labels instead of overlapping them. Physical-device quality remains unproven. |

Terrain color blocking, sparse SYSTEM art, and simple atmospheric/material treatment are visible limitations. R2 is clearly more coherent than released V2 but is not final art.

## Product differential

The R2 images were reviewed against the existing V1 experiential oracle and released-V2 audit evidence.

| State | Versus V1 | Versus released V2 | Reason |
| --- | --- | --- | --- |
| SYSTEM | ROUGHLY_EQUAL | BETTER | Direct spatial selection and frame continuity improve; V1 retains clearer explanatory composition. |
| ORBIT | BETTER | CLEARLY_BETTER | Large shaded subject, renderer-consistent picking, retained system context. |
| APPROACH | CLEARLY_BETTER | CLEARLY_BETTER | Target-derived monotonic growth replaces V2 state replacement. |
| GLOBAL_SURFACE | BETTER | CLEARLY_BETTER | Same body, hemisphere/target contract, and curvature persist. |
| REGIONAL_SURFACE | BETTER | CLEARLY_BETTER | Oblique inherited terrain replaces disconnected visualization. |
| LOCAL_SURFACE | BETTER | CLEARLY_BETTER | Progressive patch refinement and parallax preserve target. |
| HUMAN | CLEARLY_BETTER | CLEARLY_BETTER | Actual embodied movement, meaningful depth, accurate sample picking. |
| MATERIAL | BETTER | CLEARLY_BETTER | Source-specific contextual bridge and explicit authority. |
| MICROSTRUCTURE | CLEARLY_BETTER | CLEARLY_BETTER | Dense nonblank spatial representation. |
| MOLECULAR | BETTER | CLEARLY_BETTER | Nonblank context without fabricated species. |
| ATOMIC | BETTER | CLEARLY_BETTER | Nonblank probability context without a black scene or false orbital certainty. |

Overall versus V1: **BETTER for continuity, camera embodiment, interaction, and microscopic context; mixed on SYSTEM composition and final art polish.**

Overall versus V2: **CLEARLY_BETTER across the implemented slice.**

## Browser matrix

| Browser/runtime | Continuum result | Direct file | Offline | Notes |
| --- | --- | --- | --- | --- |
| Chromium 151.0.7922.34 | PASS | PASS | PASS | Full product suite plus matrix traversal |
| Firefox 153.0 | PASS | PASS | PASS | ORBIT → HUMAN → ATOMIC → SYSTEM, WebGL2 |
| Playwright WebKit 2336 | BLOCKED_ENVIRONMENT | UNTESTED | UNTESTED | Browser process closes during Windows headless startup before a page exists |
| Safari physical/runtime | UNTESTED | UNTESTED | UNTESTED | No Safari environment available |

[Chromium frame](evidence/matrix-chromium.png) and [Firefox frame](evidence/matrix-firefox.png) are captured from the Continuum itself. No legacy-only browser result is represented as Continuum coverage.

## Interaction, mobile, and accessibility

| Gate | Result |
| --- | --- |
| Real pointer selection | PASS for visible body and source sample through Babylon ray picking |
| Continuous wheel/pinch | PASS; target coordinate changes rather than advancing an enum |
| HUMAN WASD | PASS; authoritative local camera position changes |
| Transition interruption | PASS; newest target wins without divergent focus/history |
| Reverse context | PASS after arbitrary camera orbit/pitch and lower-scale travel |
| Context loss/restore | PASS: one loss/restore, then visible frame + focus + pick + travel + HUMAN movement |
| Mobile 844×390 | PASS in emulation; canvas 844×390, controls 112.6 px high, no page overflow, pinch continuous |
| Portrait 390×844 DPR2 | PASS in emulation; meaningful 390×785 canvas remains visible |
| Tablet/high DPR/orientation | PASS in emulation |
| Skip/canvas focus | PASS |
| Keyboard landmark travel | PASS |
| Keyboard body selection | PASS |
| 200% CSS zoom | PASS |
| Forced-colors compatibility rules | PASS automated probe |
| Reduced motion | PASS in 456 ms with canonical/context identity retained |

This does not claim physical touch, screen-reader, vestibular, or forced-colors human certification.

## Artifact and reproducibility

- Build contract: `ofu-spatial-continuum-build-1`
- Artifact: `dist/One_File_Universe_Spatial_Continuum.html`
- Exact implementation revision bytes: `4,610,586`
- SHA-256: `e645b49c85acc53eb5f1a9fcf99780e39265cdc81cbe74681f064e8fb58a89a5`
- Repeated same-revision build: byte-identical
- Runtime network requests: `0`
- CSP: `connect-src 'none'`
- Complete Babylon Apache-2.0 license embedded; normalized-text SHA-256 `3a1160f88f3ffdafee129832f8bf5806073f77a43962f15a13ab63f1a5047372`

The donor embeds source revision metadata, so documentation-only commits intentionally change the final artifact hash even when runtime code is identical. Cross-machine byte identity is not claimed.

## Performance and resource evidence

Environment: Playwright Chromium 151, Windows, 1440×900, headless/software rendering; `physicalGpu=false`.

| Metric | Exact R2 result |
| --- | ---: |
| Renderer CPU median / p95 | 1.1 ms / 3.0 ms |
| Update CPU median / p95 | 2.0 ms / 10.2 ms |
| Input-to-first-visible-response median | 19.5 ms |
| Headless animation interval median / p95 / p99 | 50.0 / 100.0 / 116.7 ms |
| Draw calls, SYSTEM / ORBIT / LOCAL / MOLECULAR | 9 / 8 / 17 / 20 |
| Meshes / materials / textures | 54 / 24 / 1 |
| Vertices / terrain pool | 58,264 / 16 |
| Scene / camera authorities | 1 / 1 |
| Idle renderer samples added | 0 |
| Full resource-soak loops | 10 |
| Forced-GC JS heap start / end / max | 30,609,396 / 29,324,493 / 30,609,396 B |
| History bound | 64 |

The full browser journey separately recorded headless interval median/p95/p99 `50.0/83.3/83.4 ms` and input response `15.1 ms`. Run-to-run requestAnimationFrame cadence is unstable under software rendering even while measured renderer CPU cost is low.

Released V2's prior audit showed a roughly 383 ms p99 and multi-second tails. R2 removes that pathological tail and substantially reduces per-frame scene work, but normal physical-GPU smoothness is not proven. This is a meaningful architectural improvement, not a release-ready performance claim.

## Acceptance status

Planetary conditions pass for canonical identity, visible planet, monotonic approach, target-aware camera, scene-consistent picking, distinct APPROACH, model-target surface continuity, refining terrain, HUMAN movement, nonblank stages, reverse, interruption, reduced motion, zero network, and direct-file/offline artifact.

Microscopic conditions pass for source/sample identity, nonblank material through atomic representations, explicit epistemic authority, no invented exact chemistry, and exact contextual reverse.

The architectural expansion gate remains **NOT MET** because:

- physical-GPU performance evidence is absent;
- WebKit/Safari Continuum behavior is unproven;
- terrain refinement is bounded but still uniform, not sparse planet-scale refinement;
- alternate displayed bodies cannot yet be genuinely materialized in-place for their own surface path;
- physical mobile/touch and assistive-technology review are absent;
- the full released-V2 donor still boots before the replacement takes ownership;
- presentation quality is improved but not production art.

## Recommendation

`CONTINUE_EXPERIMENT`

The Spatial Continuum hypothesis survives R2's highest-risk falsification: camera, render geometry, target geodesy, alternate-body focus, multi-world context, LOD, picking, and reverse travel now share one data-derived spatial authority. Expansion would still be premature until the explicit browser, physical-GPU, alternate-surface, terrain-scaling, donor-boundary, and product-polish blockers close.

## R3 exact-head evidence

- Implementation: `9140811ffbdee805dbeb57b25f35fe48ee421c83` / tree `11fb6ae45159d812a6a73d3334b18a0bbe4e934a`
- Artifact: `One_File_Universe_Spatial_Continuum.html`, `4,620,166` bytes, SHA-256 `e6befd497121f1f9434557caaf7b75758b6c9c7813cdd4e83f3e8b8786b1ce76`
- Canonical machine-readable packet: [R3 evidence manifest](evidence/r3/evidence-manifest.json)
- Raw suites: [browser](evidence/r3/browser-results.json), [generalization](evidence/r3/generalization-results.json), [matrix](evidence/r3/matrix-results.json), [physical GPU/performance/resources](evidence/r3/performance-results.json)

| R3 question | Exact-head result |
| --- | --- |
| Identity vs transform authority separated? | PASS: entity, position, orientation, phase, bounds, geometry, and elevation are independently classified |
| Terrain physically metric across LOD? | PASS: one `LOCAL_ENU_METRES` field and surface/sample contract; LOD adds resolution, not a new coordinate system |
| Sparse mixed-level refinement? | PASS: bounded recursive selection, mixed levels, projected-error decisions, view-radius rejection, 48-patch residency pool |
| Dynamic sibling materialization? | PASS: renderer-picked sibling gains its own graph/frames/surface/sample/material and completes ORBIT → HUMAN → SYSTEM in the same scene/camera |
| Unsupported body behavior? | PASS: no terrestrial path is fabricated; capability fails closed with an explicit reason |
| Chromium / Firefox / WebKit direct-file Continuum? | PASS / PASS / PASS, WebGL2, offline, zero network |
| Physical GPU path? | VERIFIED: NVIDIA Quadro RTX 4000, ANGLE D3D11, non-software renderer |
| Animation median / p95 / p99 | `16.7 / 16.8 / 50.1 ms` (headless compositor on physical GPU; not display-present certification) |
| Input response median | `13.1 ms` |
| Renderer CPU median / p95 | `1.2 / 3.3 ms` |
| GPU median / p95 | `0.672 / 3.572 ms`, 448 valid queries, zero disjoint |
| Soak | 10 full loops, stable 86 meshes / 24 materials / 1 texture / 48 terrain meshes / 1 scene / 1 camera |
| Heap trend | `35,802,896 → 30,313,748 B`; no monotonic growth in forced-GC samples |
| Context recovery | PASS: visible frame, identity, pick, travel, and HUMAN motion verified after restore |
| Deterministic/offline/single-file/direct-file | PASS |

### R3 visual review

- [Alternate-world ORBIT](evidence/r3/world-alternate-orbit.png) clearly shows the renderer-picked sibling as a large shaded planetary subject while retaining subordinate system context.
- [REGIONAL](evidence/r3/regional_surface.png) visibly demonstrates mixed coarse/fine patch coverage without the former inverted-face failure; resolution-aware band limiting removes high-frequency aliasing at coarse LOD.
- [LOCAL](evidence/r3/local_surface.png) preserves the same metric field but is visually too flat and undifferentiated.
- [HUMAN](evidence/r3/human.png) provides real navigable depth, rocks, and a visible sample, but remains sparse procedural art rather than a production-quality place.
- [Alternate-world HUMAN](evidence/r3/world-alternate-human.png) proves the sibling's distinct ICE-derived context and exact identity, but also exposes weak lighting/terrain readability.
- [WebKit settled evidence](evidence/r3/matrix-webkit.png) is generated by the Continuum itself, not by the legacy runtime.

The honest product differential is therefore split: camera, identity, interaction, planetary framing, continuity, browser reach, and performance are clearly stronger than released V2; terrain art and local sense of place are not yet clearly superior to V1. Screenshot hashes in the manifest establish provenance only, not quality.

### R3 gate and recommendation

The R2 blockers for WebKit, physical-GPU measurement, dynamic supported-sibling materialization, component-level authority, and bounded sparse LOD are closed. The following remain:

- the surface quadtree is a local tangent-plane proof, not a globe-wide topology with horizon-aware arbitrary-target travel;
- current camera profiles still supply high-level cinematic intent;
- the experiment still bootstraps the full V2 donor;
- physical-device touch, display-present frame pacing, and assistive-technology workflows are not certified;
- surface visual quality remains prototype-grade and is not yet a clear V1 product win.

`CONTINUE_EXPERIMENT`

Do not migrate UNIVERSE/GALAXY/REGION/NEIGHBORHOOD yet. The next bounded proving step is planet-wide surface topology plus product-quality local terrain/lighting, followed by an authority-only donor extraction spike once that spatial substrate holds.
