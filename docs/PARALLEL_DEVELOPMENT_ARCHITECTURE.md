# Parallel Development Architecture

**Status:** ACCEPTED ownership architecture. The [v1.0 program](governance/V1_IMPLEMENTATION_CONTRACT.md) authorizes one convergence owner to implement PX-01 through PX-06, then the definitive product. Named future parallel lanes are examples, not automatically activated branches.

## 1. Objective

The goal is not the largest number of branches. It is:

> **Maximum independent validated progress per unit of integration conflict.**

OFU will increasingly use simultaneous AI/human development lanes. Parallelism is safe only when semantic authority, shared files and integration surfaces have explicit owners.

## 2. Why prior waves converged painfully

Repository history shows repeated concentration of product/runtime changes in shared surfaces:

- central bootstrap/template/product-shell composition;
- planet preview and primary renderer entrypoints;
- shared build scripts and rendering workflows;
- selection, scale, scene and input state represented across compatibility layers;
- release-specific tests touching the same runtime paths.

The v0.8 parallel architecture mitigated this with frozen shared surfaces and lane-owned modules. Wave IV improved the situation further by introducing explicit scale/input/selection/scene-provider contracts, but its own documentation records legacy listeners and polling compatibility debt. PR #48 changed a broad set of bootstrap/product/render/build/test files, demonstrating that the integration surface remains wider than the desired long-range topology.

The lesson is not "never touch shared files." It is: **one owner changes a shared contract; other lanes consume it additively.**

## 3. Core rules

### CONTRACT FIRST

A parallel wave begins only after shared semantic and runtime interfaces required by multiple lanes are frozen at an exact base commit/tree.

### SINGLE OWNER PER SHARED SEMANTIC SURFACE

Within one wave, a shared contract/registry/bootstrap/build surface has one designated writer. Other lanes treat it as read-only unless the integration owner explicitly adjudicates a contract change.

### ADDITIVE MODULES PREFERRED

Prefer new provider/adapter/reducer/projection modules over independent edits to monolithic switches, templates or global state managers.

### EXACT COMMON BASE

Every writer lane derives from a declared `PARALLEL_BASE_SHA` and `PARALLEL_BASE_TREE` unless a dependency requires an explicit stack. A stacked lane records its parent candidate exactly.

### RESEARCH != CANONICAL PROMOTION

Research branches may implement models, fixtures and oracles aggressively. They retain `RESEARCH` authority until a separate promotion transaction reviews scientific status, contracts, lineage and conformance.

### ONE CONVERGENCE OWNER

Parallel lanes do not merge `main` independently. One integration owner performs ancestry-aware composition, resolves shared-contract conflicts, runs cumulative evidence and produces one candidate.

### READ-ONLY ADVERSARIAL LANES

Independent reviewers should cover scientific validity, UX/product quality, rendering quality, performance/resources, security/conformance and architecture consistency. They report findings; they do not become competing writers.

## 4. Target stable integration seams

The authorized PX implementation converges toward narrow registries/interfaces. Names below are architectural roles, not frozen APIs.

| Seam | Purpose | Shared owner |
|---|---|---|
| Domain Provider Registry | register versioned astronomy/planet/life/civ/micro providers | canonical-contract owner |
| Exploration Query API | sparse discovery/address/query/target resolution | exploration-contract owner |
| Selection Bridge | immutable canonical selection projected to product/rendering | exploration-contract owner |
| Scale / Regime Travel API | semantic travel intent and cross-regime handoff | exploration-contract owner |
| Scene / Representation Provider Registry | register renderers for bands/regimes | rendering-platform owner |
| Input Intent Router | normalize mouse/touch/pen/keyboard actions | UX/input owner |
| Temporal Transition Adapter | bind domain reducers to P4 event authority | persistence/temporal owner |
| Inspection Projection | authority-tagged human scientific context | UX/inspection owner |
| Lab Projection | raw evidence/provenance/diagnostics | diagnostics owner |
| Audio Provider Registry | derived/presentation audio by context | audio owner |
| Build Component Manifest | additive source/assets/shaders inclusion | build/integration owner |
| Capability / Quality Adapter | WebGL2/WebGPU/worker/device quality selection | runtime/render platform owner |

A registry itself is a shared file; individual provider modules should not be. Prefer generated/manifest registration when deterministic build tooling can make it conflict-free.

## 5. Parallelization-enabling prerequisite tasks

Before a truly massive implementation wave, prioritize these integration-enabling changes as a short serial/low-concurrency transaction:

1. **PX-01 — Canonical extension-contract freeze:** define provider/query/event authority interfaces without changing existing frozen semantics.
2. **PX-02 — Product/runtime registry extraction:** reduce direct edits to the central product shell/bootstrap by moving scale/scene/input/selection registration behind stable modules.
3. **PX-03 — Build composition manifest:** replace repeated manual build-script injection edits with deterministic additive component metadata where feasible.
4. **PX-04 — Renderer backend adapter:** isolate WebGL2 baseline and future WebGPU Enhanced implementation behind one presentation-state contract.
5. **PX-05 — Cross-scale query/continuity seam:** make surface/local/micro providers consume explicit coarse constraints and emit reconciliation witnesses rather than implicit globals.
6. **PX-06 — Test harness extension points:** let lane-specific conformance register focused tests without every lane editing one monolithic workflow/test driver.

These are enabling refactors, not user-feature scope. They should land before high writer counts because otherwise each additional lane increases collision probability.

## 6. Ownership matrix for every writer lane

Every lane prompt/branch must declare:

- exact base SHA/tree;
- write-authorized branch only;
- owned files/directories;
- shared files that are read-only;
- allowed integration interfaces;
- forbidden semantic surfaces;
- upstream contract versions;
- expected outputs/evidence;
- stop condition and handoff SHA/tree;
- whether the lane is canonical implementation, presentation implementation, research or read-only review.

A lane that cannot state ownership precisely is not ready to run in a massive parallel wave.

## 7. Recommended directory direction

This formalization does not itself refactor code. The subsequent authorized PX implementation should favor structures such as:

```text
src/
  contracts/                 # single-owner versioned interfaces
  domains/
    astronomy/providers/
    planetology/providers/
    biology/providers/
    civilization/providers/
    microscopic/providers/
  simulation/
    temporal-adapters/
    cross-scale/
  product/
    exploration/
    inspection/
    lab/
    accessibility/
  rendering/
    core/
    webgl2/
    webgpu/
    macro/
    planet/
    surface/
    biology/
    civilization/
    microscopic/
  audio/
  runtime/
    scheduling/
    capability/
    resources/
  build/components/
```

The exact paths remain implementation decisions. The architectural goal is isolated ownership and additive registration.

## 8. Safe concurrency model

### Phase 0 — shared-contract enabling wave

Keep writer concurrency deliberately low. Suggested owners:

1. canonical/query contract owner;
2. runtime/build seam owner;
3. rendering backend/provider seam owner;
4. test/conformance extension owner.

These lanes are not independent if they edit the same registry/bootstrap/build surfaces; sequence or explicitly stack them. Read-only research/review can run concurrently.

### Phase 1 — high-throughput capability wave after seams land

A realistic safe initial topology is **10 parallel writer/research lanes plus read-only reviewers**, assuming prerequisite seams are actually frozen:

- Astronomy depth research/implementation provider;
- Planetology/environment science research provider;
- Biology-v2 research on explicit environment boundary;
- Macrocosm rendering provider;
- Planet/surface rendering provider;
- UX/direct-manipulation/accessibility lane;
- Runtime/performance/worker/resource lane;
- Audio research/presentation lane;
- Microscopic architecture/research lane;
- Civilization model research lane.

These do **not** all have canonical promotion authority. Planetology and biology scientific promotion remain dependency-gated; civilization/micro work is research until upstream contracts exist.

### Phase 2 — convergence

One integration owner composes only accepted candidates in dependency order, re-runs shared-contract compatibility, then cumulative product/science/resource evidence. No lane independently promotes `main`.

## 9. Critical path versus parallel research

Canonical scientific-promotion path:

`shared seams → universal exploration/query → governed planetary/environment authority → positive biology successor → civilization/history canonicalization → gameplay consequences`.

The active v1.0 product also has an authorized model-derived path: explicit versioned causal models may ship as `MODEL_DERIVED_SIMULATION` without relabeling frozen P5/P6 evidence. Their environment, life, society and microscopic dependencies still require real implemented contracts, provenance and reconciliation; this is not permission to populate an unsupported canonical field.

Parallelizable earlier work:

- astronomical generator research;
- planet/climate/geology research that does not claim promotion;
- bounded biology lifecycle research;
- rendering platform and provider work using existing authority;
- UX/accessibility/direct manipulation;
- performance/resource scheduling;
- audio architecture;
- microscopic/molecular architecture research;
- civilization/language/economy model research;
- independent scientific/product/performance adversaries.

## 10. Integration order

For a convergence wave, default order is:

1. contracts/governance and schema changes;
2. persistence/temporal adapters;
3. scientific canonical providers in upstream dependency order;
4. derived simulation/cross-scale providers;
5. runtime/resource platform;
6. renderer providers/backends;
7. UX/input/product projections;
8. audio/presentation adjuncts;
9. focused cross-domain tests;
10. cumulative certification candidate.

A downstream lane may be integrated earlier only if its authority is presentation/research and it is contract-compatible without pretending its upstream science is canonical.

## 11. Conflict rules

Additional writers are counterproductive when:

- two lanes need the same frozen schema or registry file;
- two lanes independently own selection/scale/camera truth;
- a science lane and renderer lane both redefine the same scientific field;
- multiple build lanes inject into one monolithic bundle script;
- a research branch is treated as an implicit promotion base;
- two integration owners converge the same wave;
- a read-only adversary starts fixing findings in parallel with the designated writer.

When conflict appears, stop multiplying branches and assign one surface owner.

## 12. Evidence and promotion

Each implementation lane supplies targeted deterministic/unit/browser/resource evidence appropriate to its scope. The convergence owner supplies cumulative compatibility. Canonical science additionally requires source/provenance, independent oracle or equivalent falsification, evidence/fidelity classification and explicit unsupported behavior. User-visible work requires product journey and visual/accessibility evidence, not only semantic tests.

## 13. Relationship to current Wave IV

PR #48 was technically certified and merged as `e33156ee8ed9c6e906d0d4e0b8142fa235a833c7` (tree `5d46fd5e346fd6440cc1efd8cbc67fa13a9390c4`). This formalization is reconciled onto that exact history. Its provider/input/selection/scale work is the preserved product baseline; the actual PX transaction must replace shared integration contention with enforceable additive seams without regressing that baseline. No independent Wave IV release ceremony is required before the authorized v1.0 program continues.
