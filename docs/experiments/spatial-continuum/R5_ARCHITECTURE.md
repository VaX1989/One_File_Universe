# Spatial Continuum R5 — deterministic generative universe

R5 is stacked on the exact R4 checkpoint `1f45d11be404c37a520150f056c60609d969ad05` / tree `a058db472f62c4fa2b93ec5f9a39ab5d6518e4e4`. It does not modify released V2.

## Proving contract

R5 must separate four identities which R4 still partially conflated:

1. a canonical hierarchical address;
2. versioned deterministic scientific/model state;
3. a separately versioned presentation description;
4. a bounded materialized working set.

The intended derivation is order-independent:

```text
child seed = HASH(generator version, parent seed, canonical address, domain tag)
scientific state = SCIENCE(scientific model version, canonical inputs, scientific seed)
representation = ADAPT(representation version, scientific state, presentation seed)
```

Scientific state hashes must not change when only presentation changes. Revisit proof must destroy the materialized context, reconstruct it from address and versions, and recover identical scientific and representation hashes.

## R5-01 correctness boundary

Before generative claims, R5 closes three R4 debts:

- all of `MATERIAL`, `MICROSTRUCTURE`, `MOLECULAR`, and `ATOMIC` require an explicitly selected source sample;
- the exact active `world:<body>:<latitude>:<longitude>:<sample>` cache entry is pinned;
- world contexts expose an idempotent disposal lifecycle, while the cache records eviction, callback, model-session, representation, and resource disposal separately.

These are prerequisites for trustworthy revisit, collision, and resource-soak evidence. They are not evidence that the generative-universe hypothesis is proven.

## Acceptance state

Current recommendation: `CONTINUE_EXPERIMENT`.

## R5-02 versioned seed tree

The experiment owns a small synchronous canonical hashing contract so seed derivation works identically in the offline browser artifact and in development tests. Values are type-tagged, object keys are sorted, non-finite numbers and cyclic/non-plain records fail closed, and SHA-256 is used for each domain boundary.

The three independent version axes are:

- generator: `ofu-spatial-continuum-generator-r5-1`;
- scientific model: `p3-astronomy-1+p5-planet-physical-1+ofu-v1-model-suite-1`;
- representation: `ofu-spatial-continuum-representation-r5-4`.

Changing representation input or version cannot mutate a scientific-state hash. A bounded 4,096-address collision and order audit is part of the rapid suite; it is useful falsification evidence, not a proof that SHA-256 can never collide.

## R5-03 scientific state to visual grammar

The first representation adapter consumes existing P3/P5 authority rather than introducing a second planet model. Canonical astronomy and P5 physical values are normalized into a versioned scientific state. Separate planet, surface, sample, and complete-context hashes are retained. Planet texture, atmosphere, terrain wavelengths/amplitudes/palette, local density, and contextual microscopic seed then derive from a separate presentation stream.

The causal trace explicitly lists influences, non-influences, and unknowns. Terrain elevation, palettes, local scatter, molecular layout, and atomic layout remain `PRESENTATION_ONLY`; their conditioning by mass, radius, gravity, insolation, source location, and sample kind is not promoted into a physical measurement claim.

Planetary presentation is downstream only from planet/system scientific state and the body's presentation seed. A selected local sample may condition material and microscopic grammar, but it cannot recolor or otherwise mutate its parent planet's visual identity.

## R5-04 bounded galaxy streaming

The former eight-galaxy universe is now an eight-galaxy active window. The user can traverse positive or negative galaxy-field coordinates through visible controls or bracket keys. Window addresses use unbounded integer coordinates supplied to the existing P3 exploration authority; only one window and a bounded LRU working set are active.

Window revisit rematerializes the same identities independent of visit order. Checkpoints retain the galaxy-window coordinate so a branch can return across streamed fields. The working node index is rebuilt from the active window instead of accumulating every galaxy ever seen.

## R5-05 durable deterministic bookmarks

A versioned bookmark serializes the open-universe address, active galaxy window, body-fixed surface point, selected source sample, camera/scale state, and generator/science/representation integrity hashes. Restoration reconstructs through the same authority path and fails closed if any recorded version or hash differs.

The active world lifecycle can be explicitly released before restoration. This makes exact revisit evidence prove reconstruction after disposal, and the JSON-safe bookmark can also cross a full document reload rather than relying on retained in-memory object identity.

Continuum bootstrap and subsequent discovery now use the experiment's isolated read-only authority runtime. The released Living runtime is disposed after authority startup but is never driven through scale or selection as a data-query shortcut; this prevents an experimental inspection from contaminating V2's persisted semantic navigation state.

## R5-06 cross-galaxy causal diversity

A dedicated browser falsification traverses three independently selected galaxies through three regions, systems, supported solid bodies, surface contexts, local samples, and every material/microscopic landmark to `ATOMIC`, then performs the complete conceptual reverse for each. The sample records scientific and presentation state separately and requires diversity in physical inputs, terrain relief/frequency descriptors, planetary palettes, and microscopic layouts. Unsupported physical domains remain explicit blockers.

The test found and removed an inverted dependency: local `sample.kind` had been allowed to choose the parent planet's palette. Planet appearance now derives only from planet/system scientific state plus the body's presentation stream; sample identity is confined to local material and microscopic grammar. Three audited worlds differ across radius, gravity, mass, insolation, terrain spectra, palettes, and microscopic layouts without promoting presentation geometry to scientific fact.

## R5-07 pointer-directed travel and bounded semantic memory

Wheel travel now asks the Babylon scene what is visibly under the pointer before changing the continuous scale coordinate. A positive gesture may rebind the canonical focus to a visible galaxy or body, or derive a new body-fixed surface direction from the rendered globe. Surface retargeting is independent from the `GLOBAL_SURFACE` semantic landmark, so a second gesture can redirect an approach already in flight instead of inheriting a forced stage switch. Each gesture performs an immediate renderer update before accepting another hit; the second hit is therefore evaluated against the current rendered frame rather than stale screen coordinates.

Branch checkpoints distinguish streamed galaxy windows as well as hierarchical addresses. This closes a root-level alias in which many galaxy fields all appeared to history as the same universe address. Root focus is now a valid graph operation, allowing a durable root bookmark to restore after deeper traversal.

The semantic working index is rebuilt from the active galaxy window and the currently exposed region, system, and body choices. It explicitly does not retain the complete exploration history. The independent caps are:

- 8 active galaxies;
- 12 materialization-cache entries;
- 64 visited galaxy-window keys;
- 64 branch checkpoints;
- one bounded current semantic working index.

The pointer/bounds browser falsification redirects galaxy, body, and surface travel twice, restores the root bookmark, then visits 70 unique galaxy windows. This is a correctness and retention test, not a latency pass. On software-rendered headless Chromium, the synchronous discovery/rebind loop is conspicuously slow. R5 therefore still requires event-demand/deferred visual rebinding and explicit field-navigation timing evidence before deterministic streaming can be considered product-ready.

## R5-08 population diversity falsification

The canonical diversity manifest samples 12 deterministic galaxy-field windows without rendering or deep world materialization. Sparse discovery produced 88 galaxies, 48 model regions, and 60 complete stellar-system descriptors. IDs are excluded from scientific descriptor hashes, so a unique hash requires distinct state rather than merely a different address.

Observed results:

- all 88 galaxy, 48 region, and 60 system identities were unique;
- all corresponding scientific/model descriptor hashes were unique, with zero duplicate full-state hashes;
- galaxy morphology distribution was 72 `DISK`, 12 `IRREGULAR`, and 4 `SPHEROID`;
- system architecture distribution was 57 `PRIMARY_HOSTED` and 3 `CIRCUMBINARY`;
- 60 systems produced 53 distinct structural shapes from star count, planet count, moon count, architecture, and body-class histogram;
- replaying the same windows in reverse order reproduced the exact ordered galaxy lists;
- runtime network requests remained zero.

One sampled sparse window returned fewer than the requested eight galaxies inside the fixed 4,096-probe budget. The test records that density outcome instead of forcing every window to contain an identical count. This lightweight dossier demonstrates state diversity and catches template/hash collapse; it does not perform the required label-free human visual anti-sameness review. The pronounced synchronous sampling time remains a performance blocker rather than a correctness exception.

## R5-09 body-stable planetary presentation

An adversarial surface-retarget test exposed that the original R5 representation seed included the selected surface identity. That made it possible for moving to another location on the same planet to change the parent planet palette and replace the global terrain seed. This violated both causal direction and landmark continuity.

Representation contract `ofu-spatial-continuum-representation-r5-4` separates the streams:

```text
body seed
  ├─ planet-presentation seed → planet palette, atmosphere, terrain spectrum
  ├─ terrain seed             → one global field for the body
  └─ surface-context seed
       ├─ local seed          → location-dependent local distribution
       └─ micro seed          → selected-sample contextual grammar
```

Changing the surface point now preserves the planet scientific hash, planet representation hash, palette, terrain profile, and terrain seed while changing the local stream. The browser regression performs an actual renderer-owned globe pick and fails if any parent-planet presentation mutates. Existing R5 bookmarks fail closed across the representation-version change instead of silently reconstructing a different visible planet.

## R5-10 one planetary field, two coordinate views

The terrain elevation address is now a normalized body-fixed direction plus the body-stable terrain seed. A continuous deterministic 3D value-noise field is sampled on that sphere; cube faces, LOD patches, camera state, and the selected landmark do not participate in the address. The local terrain sampler maps east/north metres through the retained tangent basis back to a body-fixed direction, then subtracts the exact target elevation. Therefore the local height is a view of the same planetary field rather than a freshly seeded map.

The field adds no measured elevation claims. Its authority remains `PRESENTATION_ONLY`, while the surface target itself remains `MODEL_DERIVED`. Unit falsification now covers cube-face seam equivalence, exact local/global correspondence, target-relative zero, and non-repetition across two locations on one body. The real browser path proves the target contract survives renderer-owned surface retarget, HUMAN materialization, destructive reconstruction, and full document reload.

Human review rejected the original solid-world output because a model-derived terrestrial body read as a striped gas giant. Representation R5-3 now conditions globe albedo on the bulk prior and separates subtle elevation tint from body-seeded albedo variation. The classification error is repaired, but orbital surface detail remains too smooth in software-rendered evidence. This checkpoint strengthens spatial causality; it does **not** satisfy the R5 visual-quality or complete cube-sphere geometry gate. Cube-sphere patch planning still does not own the rendered global mesh.

## R5-11 rendered bounded cube-sphere

Representation R5-4 makes the screen-space-error cube-sphere plan own rendered geometry during APPROACH and GLOBAL. Each active tile obtains its UV bounds from its stable face/level/x/y address, samples the shared body-fixed terrain field, and contributes to one aggregate Babylon mesh. The aggregate keeps the planetary surface to one draw-call-scale mesh instead of turning the 96-patch budget into 96 draw calls. A bounded 128-entry LRU geometry cache preserves nearby refinement work; cache entries and the active plan are exposed as renderer evidence.

The planner now uses the actual camera position transformed into selected-body local coordinates rather than substituting the retained surface target as the camera direction. The underlying canonical sphere remains a seam backstop while mixed LOD is active. This is a deliberate proving compromise: it closes the gap between diagnostic LOD and real mesh ownership without claiming final crack-free neighbor stitching. Elevation remains `PRESENTATION_ONLY`; the visible radial displacement uses 6× presentation exaggeration and is disclosed in the renderer snapshot. The globe representation applies one stable body-scale Nyquist cutoff to the shared field so microscopic terrain bands do not alias into a wrinkled planet; the full field remains available to the local ENU view.

Visual falsification rejected two intermediate implementations before this checkpoint. Per-patch computed normals exposed mixed LOD as large polygon facets. Sampling ridge/local frequency bands at global distance then produced a topologically clean but visibly wrinkled sphere. Shared radial normals and the body-scale cutoff remove both storage artifacts. The remaining result is coherent but generic and soft; it is an architectural improvement, not a claim that the R5 visual differential is satisfied.

The exact software-rendered Chromium profile reports 10.5 ms median input response and renderer work of 1.3 ms median / 5.6 ms p95; GLOBAL itself measures 1.0 ms median / 1.3 ms p95. Headless animation cadence remains poor at 66.6 ms median / 133.3 ms p95, and the environment identifies SwiftShader rather than a physical GPU. Ten complete resource loops held meshes, materials, textures, vertices, scene count, and camera count exactly stable; sampled JS heap ended 3,429,452 bytes below its first sample. This is bounded-resource and CPU-cost evidence, not physical-GPU frame-pacing certification.

The R5 browser convergence pass also repaired two accessibility defects exposed by the open-universe test adaptation: the dynamic destination selector now receives its accessible name from the visible label, and forced-colors mode gives explicit focus outlines to the canvas, selector, scale landmarks, and primary controls. The pass covers context-loss restore followed by render, pick, travel, and HUMAN movement, plus landscape phone, portrait high-DPR phone, orientation change, tablet, 200% zoom, and reduced motion.
