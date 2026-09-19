# IND-BRIDGE-A — Headless bridge discovery packet

Status: G0A INPUT / PLANNING AND CHARACTERIZATION ONLY
Authority: HEADLESS_BRIDGE_DESIGN
Epoch: OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071
Frozen product base: 61f43071ad389d14b0df0d5fbd2c54ba5d829a0e
Frozen product tree: 3704247247940fa8c5f08291cd80ec9e24e7d49d
Control head used by this lane: fa88f7cec101a52d07916a0fdd3927c482a6f188
Control tree: 784e12501a7e0ba9e281787513bddbb6eed1c6bf

## 1. Finding

The smallest useful host-neutral JavaScript seam is smaller than the current PX/provider/runtime surface.

The repository already proves that the P2 canonical kernel and the P4 temporal kernel execute in Node without DOM, Babylon, camera, selection, browser storage, or a renderer. Existing P2/P4 tests load the checked-in source with Node vm and exercise canonical identity/address/derivation plus replay/checkpoint/archive behavior.

The current PX/provider path is not yet a consumer-independent public API. Its request contract requires selection, product bindings capture the current product selection, V1 bindings depend on pxProduct and the released preview context, and the spatial-continuum adapter captures the released product runtime before building its own graph. These are useful shipping-product seams, but they are not the minimal headless platform seam.

The V2X-01 materialization runtime is also not the public semantic seam. It owns measured runtime evidence and resource policy. RENDER_PREP, visible, selected, context-loss handling, GPU estimates, worker availability, and cache residency are implementation/runtime concerns. Its own runtimePacket explicitly denies central authority over selection, semantic scale, camera, scene composition, renderer, input routing, and persistence replay.

Therefore G0A should freeze a candidate boundary, not migrate product source:

1. Core candidate now: P2 identity/canonical address/derivation and P4 replay/archive/digest.
2. Query extraction later: selection-free domain/provider invocation must be proven by IND-JS-HEADLESS.
3. Runtime later: scheduler/materialization/worker/resource policy remains private until the semantic seam is independently useful.
4. Product adapters remain product: DOM bootstrap, renderer, camera, UI selection, viewport visibility, WebGL/Babylon, product lifecycle and convenience storage.

This packet does not create public API authority and does not change production source.

## 2. Exact coupling inventory

| Surface | Exact source at control head | Coupling observed | Classification | G0A decision |
| --- | --- | --- | --- | --- |
| P2 hash | src/kernel/sha256.js @ 8016cbceef787b2df1b2faa25f2512bffd48ae03 | TextEncoder + global namespace only | host-neutral computation | candidate core |
| P2 Unicode | src/kernel/p2-unicode.js @ c5a16928ad49978a2a203111ae95afe5c9939822 | string normalization + global namespace | host-neutral computation | candidate core |
| P2 canonical | src/kernel/p2-canonical.js @ 3c995a95d88ebfc30fcde025f3beea196506d74c | TextEncoder/TextDecoder + P2 Unicode + global namespace | host-neutral canonical authority | candidate core |
| P2 strict address wrapper | src/kernel/p2-address-parser.js @ 7bc3570772f4633efc635cefcfadb26f03b3df8b | P2 only + global namespace | host-neutral canonical guard | candidate core |
| P4 temporal | src/temporal/p4-temporal.js @ 7e6d7d07d34609b194382a24c5e3cdf0a4ccae24 | P2 + TextEncoder + global namespace | host-neutral temporal authority | candidate core |
| PX contracts | src/extensions/contracts.js @ 034949f5cca2a15c85c2b0f4cb4c808a70d98c6f | validation is host-neutral, but request requires selection | mixed semantic/product request contract | do not freeze wholesale |
| PX registry | src/extensions/registry.js @ b3da9bdab4bb7fbe5a74afece0c67ef4776864cf | registry logic host-neutral; binding method set includes camera/render/dispose/probe | mixed provider/product registry | characterize; no public export yet |
| PX product binding | src/extensions/product-bindings.js @ 939d46451a01a5f0257a1f6db9531fadaa86becc | captured selection, scale runtime, preview surface camera, WebGL renderers, DOM readiness | product adapter | keep private/product-side |
| V1 provider binding | src/domains/v1/bindings.js @ a7b76aae07a7361fbcd0a6abc4498e417f9b1a9b | pxProduct, selection verification, preview context; some query bodies are pure after context injection | product-bound query adapter | extract context later, not now |
| P1 portable save | src/persistence/save.js @ e3d97e7f9057472b5fea2da7a72c87c3bf8e93cd | no browser storage dependency; separate P1 save schema and O.canonical dependency | portable but different persistence contract | do not conflate with P4 archive |
| Runtime contracts | src/runtime/v2x-01-contracts.js @ 31b9a07cc6e9b8c80d7efa67e32c1d37fa4d9877 | RENDER_PREP, INTERACTION, visible, selected, scale/causal relevance | runtime policy | private |
| Runtime scheduler | src/runtime/scheduling/adaptive-scheduler.js @ db074ebaa0b7e4210adf3e73fe61e8635c18d497 | bounded scheduling, no DOM | host-neutral implementation machinery | private until G1 |
| Resource ledger | src/runtime/resources/resource-ledger.js @ 4746128275849a80ac29a189e409aa358685abfa | optional performance.memory measurement | host measurement adapter | private |
| Worker executor | src/runtime/workers/worker-executor.js @ ea774db786825d8f8a260084ab2869934eaeea00 | Worker/Blob/URL/timers with direct fallback | host adapter + fallback | private |
| Materialization runtime | src/simulation/materialization/materialization-runtime.js @ ccdfe00e267e8f62bb4ccfa94ffa6e21a19ab2f2 | presentation field, adaptive visibility/selection signals, RENDER_PREP context loss | runtime/materialization policy | private |
| Product bootstrap | src/bootstrap/app.js @ 364151c877c029ed72e464e9e2efe91ed27b1c70 | document, DOMContentLoaded, performance, location, renderer probe | browser host adapter | product-only |
| R6 experience | src/experiments/spatial-continuum/experience.js @ 2a3065811facfb435b6ec1d448898d3857db826a | document, window, performance, location, requestAnimationFrame, renderer, orientation UX | product orchestrator | product-only |
| R6 renderer | src/experiments/spatial-continuum/renderer.js @ d0a7fd5047e2cfa9a367c6bfb82c8d05a1051f55 | Babylon Engine/Scene/Camera/materials, performance, frame loop | rendering adapter | product-only |
| R6 phase-2 renderer | src/experiments/spatial-continuum/renderer-phase2.js @ cda49ddcb8129dcac4101c510570efbd883e0f9f | Babylon math + renderer convergence facade | rendering adapter | product-only |
| R6 continuum kernel | src/experiments/spatial-continuum/kernel.js @ 5585433f456ea6d35d09ac2cd30a7b89a67d094c | continuous scale plus target-aware camera pose | navigation/presentation kernel | not semantic core |
| R6 world adapter | src/experiments/spatial-continuum/world-adapter.js @ 1d10c1212c203f1c73e71f22855a172c0272eea6 | global released OFU runtime, preview chosen key, runtime enterKey/scale/at/query; constructs cameraTargets | product-to-experiment adapter | not headless core |
| R6 discovery scheduler | src/experiments/spatial-continuum/discovery-scheduler.js @ f576e787a8a8a3197f3df9f4d11ac3dada457855 | injected/default yield only; scheduling excluded from identity | useful implementation pattern | not public authority |

## 3. Dependency direction map

Current shipping direction, simplified:

    Browser bootstrap / product UX
      -> pxProduct + V1 product bindings
        -> PX registry/contracts
        -> canonical/domain functions
      -> product runtime / selection / camera
      -> renderers and Babylon

    R6 experience
      -> world-adapter
        -> released product runtime + preview context
      -> open-universe / continuum navigation
      -> renderer-phase2 -> Babylon renderer

    V2X materialization runtime
      -> runtime contracts
      -> scheduler / resource ledger / worker executor
      -> materializer providers

Already headless:

    Node host
      -> sha256
      -> P2 Unicode -> P2 canonical -> strict address guard
      -> P4 temporal -> replay/checkpoint/archive/digests

Candidate future direction must invert host ownership:

    external host or shipping product
      -> additive headless facade
        -> P2 + P4
        -> later: selection-free query adapters
      -> host adapters
        -> DOM / renderer / camera / workers / storage convenience

The core must never call back upward into product selection, camera, renderer, DOM, browser storage, or materialization policy.

## 4. Answers required by the lane

### Which current calls require DOM, Babylon, camera or selection?

DOM/browser host:
- src/bootstrap/app.js boot/readiness/reporting.
- src/experiments/spatial-continuum/experience.js interaction/frame/product orchestration.
- pxProduct readiness uses document/requestAnimationFrame/setTimeout.

Babylon/render:
- src/experiments/spatial-continuum/renderer.js.
- src/experiments/spatial-continuum/renderer-phase2.js.
- product renderer bindings in src/extensions/product-bindings.js.

Camera:
- px.scale.context currently reads the surface camera anchor.
- px.interaction.camera is an explicitly presentation-only provider.
- continuum kernel owns target-aware camera pose.
- world-adapter creates cameraTargets.
- renderer consumes camera state.

Selection/product context:
- pxContracts.request requires selection.
- pxProduct.inspect constructs requests from captured product selection.
- V1 bindings verify q.selection against pxProduct.captured and use the released preview context.
- world candidate discovery is relative to the selected context.

### Which P2/P4/query operations are already headless?

Proven headless today:
- P2 canonical encode/decode, semantic manifest validation/hash, universe/entity identity, canonical address encode/parse/validation, derive, fixed arithmetic.
- P4 canonical time/event, sorting, replay, history reconstruction, state/event digests, checkpoints, compaction, live-world commit/replay, archive import/export, schedule.

Conditionally headless computation exists below current query bindings:
- functions such as V1 astronomy discovery can compute from explicit semantic inputs without DOM.
- PX contract/registry validation logic itself does not require DOM.

Not yet consumer-independent:
- the shipping provider invocation envelope, because selection is mandatory and product/V1 bindings obtain context from pxProduct/preview state.
- generic domain query extraction therefore remains evidence work for IND-JS-HEADLESS.

### What is the minimum useful consumer-independent lifecycle?

For G0A, explicit P2/P4 primitives behind one opaque session are enough:
1. open from master seed + semantic manifest and optionally P4 archive bytes;
2. obtain identity/provenance metadata;
3. canonicalize an address;
4. derive a deterministic property witness from explicit domain/property/counter;
5. obtain P4 replay/state/history witness;
6. export P4 archive bytes;
7. close/evict all materialized process state;
8. reopen from the same semantic inputs/archive and require byte/digest equality.

A generic provider query method is intentionally not frozen at G0A.

### Which runtime concepts remain private?

RENDER_PREP, INTERACTION task priority, visible, selected, scale relevance, causal relevance, cache residency, HOT/WARM/COLD/IMMEDIATE materialization state, GPU estimates, worker-vs-fallback choice, context-loss handling, memory-pressure eviction, frame timing, camera spatial frame and runtime packet telemetry remain private runtime/product concepts.

They can influence when/how a representation is materialized. They cannot change canonical identity, canonical derived value, admitted P4 history, replay result or provenance.

### What product state must never enter the public semantic API?

- DOM nodes and event objects.
- canvas/WebGL/Babylon objects.
- camera pose/FOV/orbit/controller objects.
- viewport visibility, occlusion and current frame.
- current UI selection as an implicit authority source.
- pointer/keyboard/touch state.
- requestAnimationFrame timestamps or performance.now values.
- materialization tier/residency/cache key as semantic identity.
- worker/Blob/URL handles.
- browser storage keys.
- presentation seed/mesh/material/scene identifiers unless explicitly typed PRESENTATION_ONLY outside the semantic result.
- __OFU_PLANET_PREVIEW__, __OFU_REPORT__ and other product globals.
- pxProduct captured state.
- product lifecycle readiness.

## 5. Candidate seam boundary

The candidate is documented separately in HEADLESS_API_CANDIDATE.md.

The important negative decision is part of the seam: do not export pxProduct, the complete PX registry, V2X materialization runtime, continuum kernel, open-universe authority or renderer as the public core merely because they already have JavaScript object APIs.

At G0A, the only justified semantic core is the small P2/P4 slice whose behavior is already independently exercised outside the browser.

## 6. Tiny external consumer falsification target

The additive probe tests/industrialization/bridge/external-consumer-probe.mjs deliberately behaves like a renderer-free consumer:
- no document/window/Babylon;
- loads the current P2/P4 source only;
- uses the committed Golden Universe Corpus seed/manifest/address fixture;
- resolves the existing exact canonical address and property derivation;
- creates deterministic P4 history, exports an archive, discards the OFU namespace, reloads the kernels, imports/replays, and requires the same witness.

This is a G0A characterization probe, not G0B proof. It still loads checked-in source files directly. That limitation is intentional and prevents this lane from falsely claiming an external package/API exists before IND-JS-HEADLESS.

## 7. Error, async and cancellation decision

Do not freeze a public error-code taxonomy in G0A. Current P2/P4 kernels fail closed with Error messages; PX has its own coded failures. A future facade may normalize these, but freezing new codes now would be invention rather than extraction.

G0A invariants:
- malformed/unsupported input fails closed;
- no partial canonical result is returned;
- cancellation is irrelevant to the synchronous P2/P4 primitive slice;
- future async domain queries may accept AbortSignal, but abort must discard the incomplete result and must not mutate canonical/P4 state;
- scheduling and cancellation order must not alter admitted semantic bytes.

## 8. Migration and rollback plan

Phase 0 — this lane:
- documents boundary;
- adds source characterization and external-consumer probes;
- changes no production implementation.

Phase 1 — IND-JS-HEADLESS after G0A:
- add one facade/module outside production authority;
- delegate to existing P2/P4 functions;
- keep shipping product unchanged;
- run the same consumer probe through both direct-source characterization and the facade;
- any mismatch is a blocker, not an invitation to reinterpret semantics.

Phase 2 — only if the facade survives:
- extract one selection-free domain query adapter using explicit canonical address/time/history context;
- compare results against shipping product calls at identical semantic context;
- keep camera/selection/visibility translation in the product adapter.

Rollback:
- delete the additive facade/tests/docs and leave shipping product untouched;
- no migration of canonical source means rollback is structural, not semantic;
- if independent use still requires product globals, or provider extraction requires reinterpreting P2/P4/query semantics, set PLATFORM_EXTRACTION_PREMATURE.

## 9. Falsification and kill checks

The platform thesis should be paused/killed if any of these occur during the next lane:
- the facade needs DOM, Babylon, camera, pxProduct or __OFU_PLANET_PREVIEW__;
- canonical results differ after cache/materialization eviction or P4 archive restore;
- a public query needs visible/selected/RENDER_PREP to define semantic output;
- provider extraction requires changing P2/P4 meaning instead of adapting explicit context;
- shipping product changes repeatedly force semantic API churn;
- the independent consumer can only function through source-internal bypass after the public seam is meant to exist.

None of these is proven at G0A. The present evidence instead supports proceeding to a very small JS facade experiment.

## 10. Ownership and integration result

Changed surfaces are lane-owned bridge docs, additive bridge characterization tests, and the lane execution state.

No production renderer, current runtime authority, canonical kernel, package/build workflow, public API implementation, main branch, tag, release or R7 surface is modified.

INTEGRATION_PATCH_REQUEST count: 0.
