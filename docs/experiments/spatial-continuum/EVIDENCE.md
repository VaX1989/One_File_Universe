# Spatial Continuum R2 evidence

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
