# One File Universe — Multiscale Rendering & Scale Navigation Research Report

Status: **RESEARCH / PRESENTATION AUTHORITY ONLY**

Routing issue: #23

Certified code candidate:

- commit: `0f413f4240acc0b67b6b55de90d658acba60e217`
- tree: `f4c54e689815053133980332392eb99eff91c3ea`
- exact-head workflow: `33653001798` — **PASS**

This report is documentation-only. The certified implementation evidence below is pinned to the code candidate above.

## LIVE MAIN SHA/TREE

**MEASURED / VERIFIED**

- `main`: `5b088e079684627ccdb24c7bc7eec924b1cf1f12`
- tree: `0271a5229fb0f36cf6315f1ecc083277f48ad714`
- reference release: `v0.4.0-preview.1`
- certified baseline workflow `33645246040`: SUCCESS
- release workflow `33645444339`: SUCCESS

The live integration documentation still describes P2/P3/P4 as the canonical world stack and P5 as research/non-canonical at the start of this track.

## RESEARCH BRANCH

`research/rendering-scale-navigation`

The branch was created from the verified `main` commit above. Rendering routing is tracked in issue #23. `docs/INTEGRATION_MATRIX.md` was not modified and no competing authority registry was introduced.

## RESEARCH HEAD/TREE

The implementation certified by the evidence campaign is:

- code head: `0f413f4240acc0b67b6b55de90d658acba60e217`
- code tree: `f4c54e689815053133980332392eb99eff91c3ea`

The branch may have a later documentation-only commit containing this report. That documentation child does not change the certified renderer implementation.

## RENDER ARCHITECTURE

**IMPLEMENTED / MEASURED BY TESTS**

The research renderer is a presentation-only consumer of the real P2/P3/P4 runtime:

`canonical key / state -> sparse P3 query -> bounded presentation materialization -> renderer backend -> eviction`

Key implementation properties:

- P3 queries use the real `resolveWithMetrics(...)` API.
- P2/P3 entity identity is preserved; renderer-specific canonical identity is not created.
- P4 live-world replay/state is never replaced by renderer state.
- presentation objects are explicitly tagged `PRESENTATION_ONLY`.
- the surface provider adapter is explicitly `CONSUMER_ONLY`.
- LRU presentation cache has a hard entry bound and explicit eviction accounting.
- the renderer does not enumerate the conceptual universe globally.
- WebGL2 is the primary renderer; Canvas2D is a functional fallback for environments where WebGL2 is unavailable.
- WebGPU is capability-probed only and is not required.

Research implementation: `research/rendering/multiscale-renderer.js`.

## COORDINATE STRATEGY

**IMPLEMENTED**

Canonical spatial keys remain integer/address based and independent of camera floating-point coordinates. Presentation transforms use camera-relative subtraction before conversion to JavaScript `Number`, avoiding direct conversion of a very large absolute coordinate where practical.

A double-to-split-float helper is present for future high/low shader transforms. It is not yet wired into the WebGL2 shader path.

**TESTED**

Camera-relative transforms were exercised with offsets on the order of `10^18` while verifying that the canonical P3 fact digest is unchanged.

**NOT YET IMPLEMENTED**

- logarithmic depth pipeline;
- hierarchical high/low GPU transforms through shaders;
- production floating-origin transition policy;
- precision-error telemetry across the entire scale ladder.

These are presentation concerns and are not material blockers to canonical integrity.

## LOD STRATEGY

**IMPLEMENTED**

Named bounded plans:

| Scenario | Query budget | Materialization budget |
|---|---:|---:|
| `ASTRONOMICAL_OVERVIEW` | 125 | 125 |
| `GALAXY_REGION` | 65 | 64 |
| `SYSTEM_VIEW` | 16 | 16 |
| `PLANET_ORBIT` | 10 | 10 |
| `PLANET_APPROACH` | 4 | 4 |
| `SURFACE_LOCAL` | 2 | 64 |

LOD chooses which bounded canonical queries to request. It never chooses canonical facts or identity.

The current surface-local provider is an analytic presentation sphere patch. It is explicitly non-canonical and exists only to exercise the future planet-surface seam.

## WORKING-SET MODEL

**MEASURED, SELECTED TEST SYSTEM**

Initial canonical-query counts / materialized render objects for the exact research scenario used by the browser campaign:

| Scenario | Canonical queries | Materialized objects | Cache entries after initial plan |
|---|---:|---:|---:|
| `ASTRONOMICAL_OVERVIEW` | 125 | 1 | 125 |
| `GALAXY_REGION` | 65 | 48 | 65 |
| `SYSTEM_VIEW` | 7 | 7 | 7 |
| `PLANET_ORBIT` | 3 | 2 | 3 |
| `PLANET_APPROACH` | 2 | 1 | 2 |
| `SURFACE_LOCAL` | 2 | 2 | 2 |

The browser research artifact uses a hard presentation-cache bound of 160 entries. A separate executable test forces a 3-entry cache through ten distinct requests and verifies eviction while the size remains exactly bounded.

**DERIVED FROM CURRENT CODE, NOT A RUNTIME MEMORY COUNTER**

The runtime `SURFACE_LOCAL` analytic patch is requested at level 4, producing one 289-vertex presentation patch. No index buffer is generated and the current WebGL2 path does not yet rasterize that terrain patch as a mesh.

**NOT MEASURED BY THE CURRENT HARNESS**

- process RSS / browser private memory;
- GPU memory bytes;
- transient allocation bytes / GC pressure;
- retained byte size of individual cached facts;
- true peak CPU/GPU working-set bytes.

Therefore no byte-level memory budget is claimed yet.

## WEBGL2 STATUS

**PASS AS PRIMARY BACKEND ON FOUR TEST TARGETS**

WebGL2 rendered successfully under:

- Linux Chromium;
- Linux Playwright WebKit;
- Windows Chromium;
- macOS ARM64 Playwright WebKit.

The implementation uses a persistent context/program per canvas, one point draw per scenario in the current vertical slice, and rebuilds renderer resources after WebGL context restoration.

Linux headless Firefox in the current GitHub Actions runner did not expose WebGL2. That target passed using the functional Canvas2D fallback. This is a statement about the tested headless runner, not a claim that desktop Firefox generally lacks WebGL2.

## WEBGPU STATUS

**OPTIONAL / NOT IMPLEMENTED AS A RENDERER**

Capability observation in the exact-head browser campaign:

- Windows Chromium: WebGPU exposed;
- macOS ARM64 Playwright WebKit: WebGPU exposed;
- Linux Chromium: not exposed in this runner;
- Linux Firefox: not exposed;
- Linux Playwright WebKit: not exposed.

No WebGPU rendering, compute culling, indirect drawing or terrain generation path is implemented yet. WebGPU is not required for semantic correctness or functional exploration.

## PLANET-APPROACH STATUS

**PROTOTYPE PASS**

The scale ladder contains `PLANET_ORBIT`, `PLANET_APPROACH`, and `SURFACE_LOCAL` transitions over real P3 planet identity/facts.

`SURFACE_LOCAL` adds only an analytic presentation sphere patch. It does not claim canonical P5 terrain.

A versioned, read-only surface-provider adapter seam exists so a future canonical P5 provider can replace presentation-only surface data without changing the renderer's authority model.

## FILE:// STATUS

**PASS**

The generated research artifact was executed directly through `file://` on all five requested browser/platform targets in the exact-head workflow.

## OFFLINE STATUS

**PASS**

The artifact is self-contained, has CSP `connect-src 'none'`, embeds source/shaders, requires no CDN/runtime fetch and recorded **0 unexpected network requests** on every browser target.

## CANONICAL NON-INTERFERENCE TESTS

**PASS**

Exact-head Node tests verify:

- same P3 canonical planet digest across different camera paths;
- same canonical result across all six LOD choices;
- cold/warm/cleared cache equivalence;
- bounded LRU behavior and eviction;
- real P4 live-world replay digest unchanged after rendering materialization;
- presentation surface data remains tagged non-canonical;
- surface provider adapter remains consumer-only.

Measured witness digests:

- P3 selected planet fact digest: `c2f6bb2d2ce9c51b3047d0da9db2fd1d72c01c7a8dba37ee7302354ec8bf56ff`
- P4 replay digest before/after presentation work: `bd770c8354eca27e732bf37c5e0cd8d385fc41350fa0cf944b436f868cdb8d44`

The full canonical P1-P4 regression job also passed at the same code head.

## BROWSER MATRIX

**MEASURED — workflow `33653001798`**

| Target | Engine/version | WebGL2 | WebGPU | Backend used | Context-loss test | `file://` + offline | Result |
|---|---|---|---|---|---|---|---|
| Linux Chromium | Chromium 151.0.7922.34 | yes | no | WebGL2 | attempted + recovered | PASS | PASS |
| Linux Firefox | Firefox 151.0 | no in current headless runner | no | Canvas2D | n/a | PASS | PASS |
| Linux WebKit | Playwright WebKit 26.5 | yes | no | WebGL2 | attempted + recovered | PASS | PASS |
| Windows Chromium | Chromium 151.0.7922.34 | yes | yes | WebGL2 | attempted + recovered | PASS | PASS |
| macOS ARM64 WebKit | Playwright WebKit 26.5 | yes | yes | WebGL2 | attempted + recovered | PASS | PASS |

Playwright WebKit is not Safari. Real Safari/iOS are separate future certification targets.

## PERFORMANCE RESULTS

**MEASURED, BUT LIMITED**

The browser harness records synchronous JavaScript command elapsed time for repeated warm-cache `materialize + render command` calls. It does **not** measure RAF frame-time, GPU completion time or a complete rendered-frame latency distribution.

Observed warm command path across the tested targets is generally in the low single-digit milliseconds for these deliberately small research scenes. Examples:

- Linux Chromium: roughly 1.7–3.3 ms typical, with observed outliers up to 5.0 ms in the recorded samples.
- Linux WebKit: roughly 2–4 ms typical, with an observed 10 ms outlier in `GALAXY_REGION`.
- Windows Chromium: roughly 2.4–3.6 ms typical, with an observed 5.4 ms outlier.
- macOS ARM64 WebKit: roughly 1–3 ms typical, with an observed 6 ms outlier.
- Linux Firefox Canvas2D fallback: low single-digit millisecond warm command path in the same bounded scenes.

These measurements are useful for detecting gross regressions only. They are **not production frame budgets**.

**MEASURED RENDER LOAD IN CURRENT VERTICAL SLICE**

- draw calls: 1 per scenario;
- rendered point counts on the WebGL2 path: 1 / 48 / 7 / 2 / 1 / 1 across the scale ladder listed above;
- canonical query and materialization counts remain bounded as shown in the working-set table.

**NOT MEASURED**

- dedicated cold initialization time;
- cold materialization distribution retained as evidence;
- browser main-thread CPU attribution;
- GPU timing queries;
- full frame-time percentiles;
- CPU/GPU memory bytes;
- cache byte churn;
- terrain mesh upload cost.

## ARTIFACT SIZE DELTA

**MEASURED**

Exact research artifact at the certified code head:

- `One_File_Universe_Render_Research.html`
- size: **112,285 bytes**
- SHA-256: `2cd1aa58219608d192d8d87cefbdb683e522a86ca35d01f59780bbb77ea5e959`

Certified P1-P4 preview release artifact recovered from release workflow `33645444339`:

- size: **144,116 bytes**

Standalone difference: **-31,831 bytes** (research artifact is smaller).

This is **not an integration-size delta**. The research artifact embeds a narrower UI/product surface than the canonical preview. The true additive size cost of integrating selected modules into the production single-file build has not yet been measured.

## MATERIAL BLOCKERS

**NONE FOUND IN THIS RESEARCH SLICE.**

No tested renderer behavior changed canonical facts, corrupted persistent state, introduced a required network dependency, broke strict single-file execution, caused unbounded materialization, or made the WebGL2 baseline architecture impossible.

## IMPORTANT NON-BLOCKERS

- no WebGPU rendering path yet;
- no logarithmic-depth implementation;
- split-float helper is not yet used by shaders;
- no production floating-origin transition choreography;
- analytic surface patch is not rasterized as terrain and has no crack/stitching solution;
- no canonical P5 terrain, by design;
- no GPU/CPU memory-byte telemetry;
- no true RAF/GPU frame-time distribution;
- no dedicated cold-start benchmark;
- Linux headless Firefox used Canvas2D because WebGL2 was unavailable in that runner;
- real Safari/iOS not certified;
- product UI is a diagnostic vertical slice, not final navigation UX.

These do not block P5/P6 or current canonical integration work.

## INTEGRATION CANDIDATES

Presentation-only modules that are technically defensible candidates for later focused integration:

1. bounded LRU presentation cache and explicit scenario budgets;
2. sparse P3 query/materialization planner using `resolveWithMetrics`;
3. camera-relative coordinate helper and the high/low split helper after further shader validation;
4. backend abstraction with WebGL2 primary and functional fallback;
5. WebGL context loss/resource recovery pattern;
6. single-file/offline/direct-`file://` research build harness;
7. canonical non-interference tests;
8. versioned read-only planet-surface provider adapter;
9. user-visible diagnostics for canonical Entity ID/digest, active scale, query count, materialized objects, cache bound and backend.

No integration PR is recommended from this report alone. Terrain presentation, stronger coordinate precision validation and production-oriented measurements should be developed further before extracting a focused vertical slice.

## P5 INTERFACE NEEDS

Rendering needs a **read-only, versioned consumer contract**, not access to P5 internals. A future provider should expose, at minimum:

- provider/schema version and explicit authority classification;
- canonical planet Entity ID as input/reference;
- stable versioned patch addressing, e.g. face/level/x/y or a P5-owned equivalent;
- bounded patch/snapshot retrieval;
- coordinate frame, units and reference radius/ellipsoid metadata;
- immutable terrain/surface/material payloads or explicit snapshot revisions;
- time/validity/provenance metadata when P5 makes those canonical;
- deterministic handling for unavailable/unknown data.

The renderer must not infer canonical elevation, climate or material truth from tessellation, shaders, cache state or camera LOD.

Until P5 is canonical, any P5 provider must be labelled research/presentation data explicitly.

## P6 INTERFACE NEEDS

Rendering should eventually consume versioned, read-only P6 outputs such as:

- biome/field snapshots;
- ecological region facts;
- species/entity IDs and bounded materialized organism sets;
- provenance and temporal validity;
- provider-owned semantic-LOD visibility summaries where appropriate.

The renderer must not own ecology, evolution, population dynamics or semantic simulation LOD. It only selects bounded views of upstream facts.

## CONCLUSION

The research result supports the target architecture:

`same canonical queries/history + different camera/LOD/cache/backend behavior = same canonical world digest`

The exact-head campaign passed the canonical regression suite and the requested browser matrix while preserving direct-file, offline, single-file operation and bounded materialization. The next rendering work should deepen coordinate precision, terrain raster/LOD and working-set instrumentation rather than expand renderer authority.
