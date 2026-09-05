# One File Universe — Long-range Architecture

## 1. Architectural thesis

OFU separates **identity**, **canonical procedural state**, **canonical mutable history**, **derived simulation**, and **presentation/product state**. The release artifact is one HTML file, but development remains modular and independently testable.

```text
VERSIONED CONTRACTS / SCHEMAS
        |
        v
CANONICAL KERNEL + DOMAIN AUTHORITIES
        |
        +---- P4 temporal events / checkpoints / lineage
        |
        v
CURRENT CANONICAL WORLD
        |
        +---- query context + model regime + resolution/fidelity
        v
DERIVED / LATE-MATERIALIZED REPRESENTATIONS
        |
        +---- rendering / audio / UX / diagnostics
        v
ONE SELF-CONTAINED HTML ARTIFACT
```

Presentation MUST NOT flow backward into canonical state without an explicit versioned deterministic event or domain transition contract.

## 2. Certified foundation preserved

The long-range architecture builds on, and does not silently expand, frozen contracts:

- P2 owns canonical value/address/identity/serialization/derivation semantics for its declared versions.
- P3 v1 owns sparse astronomical/genesis metadata within its scope.
- P4 v1 owns canonical time, accepted-event order, replay, checkpointing, compaction, lineage and portable archive semantics.
- P5 v1 owns its bounded terrestrial physical model and exact cube-sphere topology; its elevation code is stylized and dimensionless.
- P5 Environment v2 owns its declared atmosphere/pressure/effective-temperature authority and explicit unknown/unsupported states.
- P6 v1 owns its fail-closed eligibility witness/identity/transition guard scope; current real environments do not establish biology.

Future depth requires successor contracts, not reinterpretation of those versions.

## 3. Sparse query architecture

The semantic universe is a Multiscale Reality Graph. Existence and properties should be queryable without enumerating all siblings or descendants.

A long-range query is conceptually:

```text
Query({
  universeIdentity,
  entityOrAddress,
  queryContext: { time, spatialContext, resolution, fidelity },
  modelRegime,
  propertyOrCapability
}) -> AuthorityTaggedResult
```

`AuthorityTaggedResult` must distinguish canonical, derived, research, unknown/unsupported and presentation-only outputs. A camera position is query context, not identity. A renderer tile is not automatically a canonical surface entity.

## 4. Cross-scale protocol

Every cross-scale provider must define:

- `REFINE(coarse, queryContext) -> constrained finer representation`;
- `PROJECT(fine consequences, significance policy) -> coarser consequence candidate`;
- `RECONCILE(representations) -> invariant report`.

Cross-scale invariants include stable entity identity where the domain defines persistence, preservation of upstream mass/energy/resource/history constraints where applicable, deterministic reconstruction for canonical outputs, explicit uncertainty/fidelity, and no presentation-to-canonical promotion.

A planetary surface implementation, for example, should eventually bind a local patch to canonical planetary/regional state. A plausible but unrelated noise patch is permitted only as clearly labeled presentation; it cannot satisfy a future physical-terrain contract.

## 5. Model regimes

The architecture does not assume all detail is classical geometric containment.

Representative regime families:

- `COSMIC_STATISTICAL` / large-scale astronomy;
- `ASTRONOMICAL_BODY` / systems and bodies;
- `PLANETARY_CONTINUUM` / bulk, atmosphere, climate and geodynamics;
- `GEOSPATIAL_SURFACE` / global-to-local surface structure;
- `ECOLOGICAL_POPULATION` / ecosystem and population state;
- `ORGANISMAL` / organisms, anatomy and behavior;
- `CELLULAR` / cells, tissues and microbial systems;
- `MOLECULAR` / molecules and complexes;
- `ATOMIC` / future bounded atomic representations;
- `NONCLASSICAL_RESEARCH` / future quantum-compatible or otherwise non-classical semantics.

These names are architectural categories, not frozen byte vocabulary. Transitions between regimes require explicit adapters that define identity mapping, observables, units/reference frames, uncertainty and compatibility. A future non-classical regime may use state spaces and observables not representable as smaller classical coordinates.

## 6. Domain-provider architecture

Each domain authority or research provider should live behind a stable additive provider interface rather than editing a monolithic runtime switch. A provider declares:

- ID and semantic version;
- authority/evidence/fidelity class;
- accepted upstream contracts;
- canonical inputs and outputs;
- derived/presentation outputs;
- transition/reducer contract if mutable;
- cost and working-set envelope;
- `REFINE`/`PROJECT`/`RECONCILE` obligations;
- conformance vectors/oracle requirements;
- explicit unsupported states.

Provider registries, query interfaces and event contracts are shared integration seams with one writer per parallel wave.

## 7. Planetary-reality stack

A future planetary stack can be decomposed into independently versioned layers:

1. astronomical forcing and body baseline;
2. bulk composition/interior state;
3. thermal/geodynamic/tectonic regime where scientifically justified;
4. crust/provinces, volcanism, impacts and deformation;
5. physical hypsometry/topography and basin structure;
6. hydrology/ocean/ice/regolith/soil state;
7. atmospheric composition and radiative/convective state;
8. global/regional climate transport and seasonality;
9. local weather only where the model and runtime budget justify it;
10. ecology/biology boundary inputs.

Each layer can remain `UNKNOWN` or `UNSUPPORTED` rather than forcing a fake value. Research branches can prototype models without canonical promotion.

## 8. Biological and civilization stack

Biology should progress from governed environment eligibility to bounded ecology/lifecycle models, then to richer evolution and organismal detail. Earth-calibrated biology, generalized constraints, hypothetical exobiology and generative fictional extensions must remain distinguishable.

Civilization should consume environment, resources, biology, population and history. Settlement/city/culture outputs must be causally explainable within their declared fidelity rather than independent decorations. Technology, economy, language, institutions and conflict are separate model families that can share population/resource/history interfaces.

## 9. Temporal architecture and player intervention

P4 remains the reference ownership model for canonical time/history. A future mutable domain publishes a versioned transition contract consumed by the temporal layer. Player intervention follows:

```text
intent -> authority/precondition check -> canonical event candidate
       -> P4 ordering/admission -> domain reducer -> new canonical state
       -> derived consequences -> presentation
```

No renderer, scene provider, UI form or debug control has authority to bypass this path.

## 10. Late materialization

COLD/WARM/HOT/IMMEDIATE is a resource and semantic-detail strategy, not a license to change facts.

- COLD stores/derives coarse constraints and statistical/macroscopic state.
- WARM activates populations, regions and aggregate dynamics.
- HOT materializes local systems and concrete processes.
- IMMEDIATE materializes interaction-relevant entities and high-resolution derived state.

Promotion/demotion between tiers must declare what persists canonically, what can be regenerated, what gets projected upward and what error/approximation bounds apply.

## 11. Rendering architecture

Rendering is a co-equal product pillar and a consumer of truth, never its silent author.

Long-range rendering should use an adapter boundary with at least:

- **Strict WebGL2 path:** portable baseline, direct-open compatible;
- **Enhanced WebGPU path:** optional compute/render acceleration when available;
- capability/quality profiles that can change visual fidelity, dynamic resolution, LOD, antialiasing, shadows, volumetrics and streaming budgets without changing canonical values;
- scene/representation providers keyed by semantic scale/model regime rather than hard-coded showcase destinations;
- hierarchical visibility/LOD structures, local/floating origins and patch-relative geometry for large-world precision;
- bounded caches with explicit CPU/GPU resource ownership and destruction;
- instancing/batching/streaming or virtualized material/texture concepts where measured useful;
- renderer-independent canonical selection and identity.

Future atmosphere, water, ice, vegetation, organisms or city lights may only use scientific labels when the corresponding authority exists. Otherwise they must be presentation-labeled approximations or omitted.

## 12. Product / UX architecture

The universe viewport should be the primary interface. Product state must be downstream of canonical selection/query state.

Stable product seams should include:

- `SelectionService`: canonical selected entity/address + support state;
- `ExplorationQueryService`: address/query-driven discovery and target resolution;
- `ScaleTravelService`: semantic travel intent and cross-regime transitions;
- `SceneProviderRegistry`: presentation providers by supported regime/band;
- `InputIntentRouter`: mouse/touch/pen/keyboard intents without duplicate ownership;
- `InspectionProjection`: human-readable authority-tagged scientific context;
- `LabProjection`: raw canonical/provenance/diagnostic data;
- `AccessibilityProjection`: semantic nonvisual alternatives and equivalent controls.

Current v0.8/v0.9 implementations are compatibility evidence, not permanent interface names.

## 13. Runtime and precision architecture

Large worlds require layered coordinate/reference-frame strategies. Canonical addresses and high-precision model state should not be forced into GPU Float32 world coordinates. Rendering should use relative-to-eye/floating-origin or equivalent local frames, patch-relative buffers and explicit frame transforms.

Runtime budgets include active canonical/derived entities, worker queues, simulation milliseconds, main-thread frame budget, heap, GPU memory/buffers/textures, material/geometry cache sizes, event tail/checkpoints and startup/decode amplification. Budget violations must degrade derived/presentation quality before changing canonical truth.

## 14. Persistence and lineage

Portable archives remain authoritative. Future archives must identify Universe Identity, semantic manifest lineage, domain transition versions, event/checkpoint state, migrations and integrity commitments. Deep history may be compacted only through deterministic, authority-preserving rules. Cached late-materialized detail is not automatically portable state.

## 15. Build and artifact architecture

The deterministic build embeds modular JS/CSS/WASM/shaders/data/tests/assets into one HTML. Artifact size may grow with useful capability. Startup and runtime working-set budgets remain independent; large embedded payloads should be staged, indexed and decoded/materialized on demand where possible.

## 16. Parallel-development seam strategy

Future concurrency depends on reducing shared-file edits. Central bootstrap/build/runtime files should evolve toward small registries and stable adapters. Science providers, renderer providers, UX projections, audio systems and research models should be additive modules with explicit ownership.

The canonical rule is **contract first, additive implementation second, single convergence owner third**. See `PARALLEL_DEVELOPMENT_ARCHITECTURE.md` and `frontier/WORKSTREAM_DAG.json`.

## 17. Architectural quality gates

A workstream is not promotion-ready until it has, as applicable:

- versioned input/output and authority contracts;
- determinism/fidelity/evidence classification;
- cross-scale and temporal invariants;
- bounded cost/materialization policy;
- independent oracle/property/conformance evidence;
- product journey and accessibility evidence for user-visible work;
- rendering quality and resource evidence for visual work;
- compatibility/migration policy;
- adversarial review appropriate to the claim.

A green test suite alone does not establish product completeness.
