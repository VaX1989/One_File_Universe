# Spatial Continuum R6 — causal universe synthesis

R6 is stacked on exact R5 commit `5a4386d75f71e29007b9afa496de68b937fca9d6` / tree `2c90da0c5f606fd33acfa79d0fa24dd0647557ad`. Released V2 remains untouched.

## R6-01 cooperative discovery substrate

Sparse OFU discovery is deterministic but can consume thousands of expensive P3 probes synchronously. R6 begins with a bounded cooperative scheduler rather than hiding that work behind a loading animation.

Each request owns a canonical key and an interaction intent key. Work advances through a deterministic cursor in fixed probe-count slices, yielding to the browser between slices. Slice size, queue order, cancellation timing, and request history are excluded from entity identity. Partial results from cancelled requests never commit.

The scheduler provides:

- bounded pending work;
- priority with deterministic queue tie-breaking;
- explicit cancellation and `AbortSignal` support;
- latest-intent-wins supersession;
- progress snapshots;
- stale-work exclusion;
- scheduling-independent concatenation of canonical discovery order.

## R6-02 product integration and atomic window commits

Galaxy-window movement now uses the scheduler in the real direct-file product path. The previously committed field remains rendered and selectable while the next deterministic window is probed. A newer movement intent supersedes the prior request and composes from its pending spatial target, so rapid input still describes a continuous direction instead of repeatedly targeting the last settled cell.

Discovered entities are accumulated privately. R6 commits a complete bounded window atomically only when its request is still the owner of `ACTIVE_GALAXY_WINDOW`; cancelled or stale partial work cannot enter the materialization cache, graph, renderer, history, or canonical focus. Selection, Back, synchronous restore, and disposal cancel obsolete discovery explicitly.

The authority snapshot reports pending target, cursor work, slice count, item count, queue capacity, completions, cancellations, and stale-result attempts. The browser falsification test proves:

- the active window and scene remain unchanged while work is pending;
- browser timers and rendered frames advance between discovery slices;
- latest-intent supersession cancels the earlier request;
- only the composed latest target commits;
- Back cancels without mutating the active field;
- the scheduler and semantic working set remain bounded;
- the direct-file artifact makes no runtime network request.

R6 intentionally does not expose partial galaxy sets yet. Atomic bounded-window replacement has stable interaction semantics; progressively changing pick targets during navigation does not. Progressive presentation remains a possible later optimization only if it can preserve deterministic ordering, focus, and renderer-owned selection.

## R6-03 interactive seed bootstrap

The initial universe no longer performs a full sparse-window scan before exposing the product. It starts from the already-authoritative seed galaxy, renders that honest canonical result, marks the experience `INTERACTIVE`, and hydrates the remainder of the seed window through the same cancellable scheduler. Existing readiness consumers still receive `READY` after that hydration settles.

Input retains priority over bootstrap work. Moving to another cell, selecting the visible seed galaxy, navigating Back, or disposing the experience cancels hydration; no bootstrap completion can later overwrite the newer intent. In the Chromium software-rendered run used during development, interactive availability preceded a representative 3,501-probe neighbor result by roughly seven seconds. That does not make the underlying scan fast, but it removes the scan from the critical interaction path and makes the remaining latency measurable rather than frozen.

## R6-04 continuous macro cells

Galaxy windows are now bounded resident spatial cells rather than mutually exclusive pages. The authority retains the current cell plus relevant adjacent cells, flattens their canonical entities into one renderer-owned pick catalogue, prevents cross-cell identity duplication, and evicts cells beyond a strict resident-cell and adjacency budget. Each cell's presentation is offset relative to the current signed integer cell, so GPU coordinates remain bounded even when the address is extremely distant.

The one camera authority now carries a macro-space position. W/A/S/D moves it continuously at UNIVERSE scale. Crossing half a cell requests the relevant canonical neighbor without stopping camera input; changing direction cancels the obsolete request. On commitment, the cell origin and camera are rebased by the same exact presentation delta. The old cell moves to `-1`, the new cell becomes `0`, and the viewed objects retain their screen-space anchors.

The old field labels have been removed from the primary controls. The remaining buttons are optional keyboard-accessible Drift nudges over the same camera/streaming path, not direct state replacement. In the focused Chromium proof, two eight-galaxy cells coexisted in one scene, the prior cell survived handoff, the new cell added eight canonical identities, one camera and one scene remained authoritative, and the measured prior-object anchor displacement across rebasing was below `0.001 CSS px` on both axes.

## R6-05 causal planetary grammars

The durable V1 modeled-world donor already provides bounded scenario outputs for interior heat, geodynamic regime, volatile retention, temperature, hydrosphere, erosion potential, and impact retention. Those fields now participate in the versioned scientific-state hash and condition a separate presentation decision. Six bounded visual families cover fluid giants, cryogenic fracture, active ridges, eroded basins, retained-impact highlands, and mixed lithic terrain.

The family name, structural weights, palette, global directional field, and local scatter silhouette are explicitly `PRESENTATION_ONLY`. Inputs remain `MODEL_DERIVED`; the classifier sets `scientificLandformClaim: false`, and the causal trace records that actual crater, tectonic, basin, and fracture placement is unknown. Gas and ice giants report that no solid-surface descent is supported rather than receiving terrestrial terrain.

The global body texture, cube-sphere refinement, tangent-frame terrain, and local prop field consume the same regime-conditioned profile. A focused deterministic test holds the seed constant while switching structural weights and obtains distinct crater, ridge, fracture, and basin directional signatures. A direct-file Chromium proof binds the released selection to `FRACTURED_CRYOGENIC_PRESENTATION` from its modeled 184.828 K surface-temperature scenario and 544,175 ppm modeled ice fraction, then confirms the same family at ORBIT, GLOBAL, and HUMAN with zero runtime network requests.

Human review finds the cyan/ice regime immediately more legible than the former generic olive field, but GLOBAL remains visibly soft and HUMAN remains too sparse to count as a convincing place. Those are active recovery problems, not hidden by the passing causality contract. The software-rendered browser probe also remains slow (`66.6 ms` median and `316.6 ms` p95 in the focused traversal), so this checkpoint does not claim performance convergence.

## R6-06 coordinate-addressed local environments

HUMAN no longer owns one fixed decorative rock patch. A deterministic local-environment generator divides the retained ENU tangent frame into 32-metre cells and keeps a bounded 5×5 neighborhood around the camera. Crossing a cell boundary retains overlapping feature identities exactly, streams new outer cells, and evicts obsolete cells without changing canonical world or surface identity. One Babylon thin-instance mesh renders at most 120 active features, so added place density does not add draw calls per feature.

Five object-placement processes now follow the causal grammar: directional fracture clusters, slope-exposed clusters, basin deposition clusters, radial ejecta clusters, and sparse jittered fields. Silhouette distributions also differ: cryogenic shards are tall and narrow, sediment clasts are low and rounded, uplifted fragments emphasize height, and ejecta fragments emphasize radial angular scatter. Every generated feature remains non-pickable `PRESENTATION_ONLY` context; genuine model-derived local samples retain the renderer-owned selection path.

The direct-file browser proof walks 320 metres across ten local cells while preserving the exact world and surface identities. The resident set remains at 25 cells, active features remain capped at 120, and 35 obsolete cells are evicted. Screenshots show different formations entering and leaving the view rather than a repeated tile reset. This is meaningful place generation, but it is not final art: near-camera shards can dominate composition, the distant terrain still lacks a strong horizon silhouette, and the next body-fixed handoff beyond the 1,024-metre tangent budget still needs a perceptually invisible feature-frame transfer.

## R6-07 source-conditioned material and microscopic context

The lower-scale renderer no longer selects one generic particulate composition for every sample. A bounded deterministic grammar now derives from the selected sample's model kind, phase, structure, porosity, component fractions, and chemistry authority. Its presentation families distinguish lattice-oriented, grain-boundary, disordered, porous, fibrous, multiphase, fluid-neighborhood, dispersed, and unresolved contexts. MATERIAL, MICROSTRUCTURE, MOLECULAR, and ATOMIC all retain the same source-sample identity and consume that grammar.

The scientific boundary is part of the data contract rather than a disclaimer added after rendering. Mesh placement, grain geometry, proximity scaffolds, context-field samples, and the abstract core are all `PRESENTATION_ONLY`. Molecular links explicitly mean `PRESENTATION_PROXIMITY_NOT_BOND`; atomic field points explicitly mean `SOURCE_TOPOLOGY_CONTEXT_NOT_PARTICLE_POSITIONS`; and the central polyhedron is not a proton/neutron assembly. Known element symbols are exposed only when upstream component records provide them. Model fraction labels such as silicate or metal do not silently become element facts.

Focused tests exercise ice, rock, soil, liquid water, manufactured composite, and unresolved gas sources. They produce five distinct material topologies and at least four distinct atomic context-field distributions from the same bounded algorithm. Unresolved gas produces no proximity links. The direct-file Chromium journey retains one selected ICE sample across all four lower scales and back to HUMAN, renders nonblank frames, exposes the visual grammar and epistemic warning in the visible context panel, and makes zero runtime network requests.

Human visual review finds MATERIAL and MICROSTRUCTURE now visibly related through a crystalline grammar, while remaining different in composition and scale. MOLECULAR remains an abstract site/proximity diagram; despite the explicit non-bond contract, its conventional spheres-and-rods language still carries some risk of being read as exact chemistry. ATOMIC no longer depicts a classical nucleon cluster and now uses a topology-conditioned anisotropic context field, but it remains an explanatory abstraction rather than a scientific atomic visualization. Those limitations are explicit and should constrain later art-direction work.

## R6-08 content-aware planetary LOD and physical handoff space

The cube-sphere planner now measures each candidate patch with a deterministic 3×3 sample of the actual presentation terrain field. Its screen-space error combines the sampled bilinear terrain residual with spherical chord error, rather than treating angular span as a sufficient proxy for all worlds. Cross-face edge neighbors are derived through the cube projection itself, and a bounded balancing pass constrains adjacent visible leaves to a one-level difference. A focused falsification suite checks 576 edge relationships through levels 0–5, including 336 cross-face relationships, then exercises face-, edge-, and corner-facing cameras against flat and rugged content.

Visual inspection exposed a more basic defect that earlier final-frame tests had missed: the aggregate cube-sphere indices faced inward, so back-face culling hid the displaced surface while an underlying sphere disguised the failure. The winding is now outward and explicitly tested. Radial skirts were prototyped as a crack treatment and rejected after they produced dark diamond stamps across the globe. R6 therefore retains the underlying sphere as an honest coarse backstop while the balanced patch hierarchy is active; it does not claim final crack-free stitching or geomorphing.

The first browser run after exposing the real surface also falsified the camera handoff. GLOBAL → REGIONAL mixed two endpoint positions authored in different frame-local render spaces, which made the transition blank. Camera endpoints are now represented as physical root-oriented offsets from their actual spatial targets. Both endpoints are rebased through the same interpolated reference-frame origin and the same logarithmically interpolated metres-per-render-unit before interpolation. A test using distinct body and surface frames requires the shared target to remain at render-space zero, and the direct-file browser frame now keeps the retained surface location visible.

The regional terrain representation is no longer a flat square placed over a curved world. Its ENU mesh includes the spherical tangent curvature implied by the selected body's radius, and its outer presentation boundary fades before the bounded tangent domain ends. The body-fixed terrain address and presentation-only elevation remain unchanged. The handoff consequently reads as the globe becoming the surrounding context of the retained terrain location instead of an unrelated rectangular map appearing over it.

This checkpoint remains deliberately limited. The sampled residual is an approximation rather than a conservative maximum; adjacency statistics cover active touching leaves and not holes created by horizon rejection; the sphere backstop remains part of seam policy; and settled APPROACH/GLOBAL views currently select root cube faces because their projected-error budget does not demand finer leaves. The Chromium evidence ran through a software renderer and remained slow (roughly 50 ms median with substantially worse p95/p99 tails), so R6-08 makes no performance-convergence claim. Presentation contract `ofu-spatial-continuum-representation-r6-2` records the changed visible geometry and handoff semantics without changing scientific state.

## R6-09 cooperative local discovery and frame-tail recovery

Instrumentation separated Babylon render time, complete update time, GPU timer-query time, stage distributions, and cold representation construction. It falsified the assumption that HUMAN's multi-hundred-millisecond cold frame was a mesh-construction problem. The dominant cost was a synchronous semantic call hidden inside `createLocalDetail`: resolving up to nine nearby OFU model points through `runtime.at()` while the renderer was constructing a frame.

Local discovery now uses the same bounded cancellable scheduler as galaxy discovery. A newly materialized surface exposes its already-resolved current-point objects immediately, then resolves at most one deterministic local model point per browser slice. Only the complete, still-current body/surface result enters the materialization cache. Body selection, surface retarget, galaxy travel, Back/restore, explicit context release, and disposal cancel obsolete work. Scheduling affects latency only: catalogue identity and order still come from the deterministic offset sequence and model identities. If HUMAN is reached before completion, the renderer presents the current-point catalogue and atomically refreshes its pickable local layer after the full catalogue commits; the renderer never invokes semantic discovery itself.

The terrain refinement hot path was also reduced without changing its address or height field. Each patch now evaluates the expensive body-fixed terrain function once per grid vertex, caches the resulting height grid, and derives normals from adjacent cached samples rather than making four additional terrain calls per vertex. The body-fixed ENU basis is normalized once per surface sampler, and HUMAN reuses the exact terrain layer sampler instead of constructing a parallel terrain reality. Small deterministic faceted source meshes replace repeated general polyhedron construction and are cloned for same-shape local destinations.

The renderer profile makes these boundaries falsifiable: local build evidence reports `semanticDiscoveryMs: 0`, whether the input catalogue was complete, and whether local/terrain share one sampler. The authority reports discovery request, progress, cancellation, stale-result, duration, and completed slice data. The R6 representation contract advances to `ofu-spatial-continuum-representation-r6-3`; source IDs are now included even when a parent presentation seed is supplied, and lattice-oriented microscopic scaffolds receive a deterministic source-conditioned orientation. This fixes the discovered case where two distinct same-kind samples could otherwise render the same microscopic wallpaper.

A physical-GPU run used Chrome 152.0.7977.83 with ANGLE D3D11 on an NVIDIA Quadro RTX 4000 at 1440×900. Against the pushed R6-08 baseline on the same machine, frame cadence moved from 18.0 ms median / 18.2 ms p95 / 143.9 ms p99 with 25 frames over 34 ms and 15 over 50 ms in 652 samples, to 16.7 ms median / 16.9 ms p95 / 33.4 ms p99 with 4 over 34 ms and 3 over 50 ms in 780 samples. Input-to-visible response measured 16.4 ms. Babylon render CPU measured 1.3 ms median / 3.0 ms p95, GPU timer queries measured 1.25 ms median / 4.98 ms p95, and HUMAN update time measured 3.1 ms median / 6.2 ms p95 / 18.1 ms maximum. The complete renderer remained bounded at 97 meshes, 25 materials, one texture, one scene, one camera, and 61,593 vertices through ten full loops; forced-GC heap ended about 0.89 MB above its starting sample. Headless compositor cadence is not display-present timing, but the non-software GPU identity and timer-query evidence are explicit.

Visual review confirms that this work did not blank or disconnect HUMAN, MOLECULAR, or ATOMIC, and the exact renderer geometry remains pickable after the asynchronous catalogue refresh. It does not establish final art quality. HUMAN's selected ice specimen is still oversized and overexposed at the default camera, distant procedural shards remain sparse, the GLOBAL/REGIONAL handoff still exposes coarse cube-face structure, and molecular spheres-and-rods remain vulnerable to conventional chemical interpretation despite the visible non-bond warning. R6-09 is a performance and authority-boundary convergence checkpoint, not a product-visual completion claim.
