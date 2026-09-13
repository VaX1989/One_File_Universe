# Spatial Continuum R4 — open-universe architecture

Status: implementation checkpoint, not production approval  
Parent: `7d83af02fc86db30ff3c5579d0facebe79f5502a`  
Branch: `experiment/spatial-continuum-r4-open-universe-2026-09-13`

## Falsified R3 assumption

R3 proved physical and identity continuity along one deliberately authored route. It did not prove agency. The implementation started at `SYSTEM`, eagerly captured a bounded set of sibling worlds, fixed one surface location during bootstrap, and automatically replaced focus with one body/sample as scale crossed hard-coded thresholds. Its one molecular layout was also independent of the selected local object. The founder's “all roads return to the demo” observation is therefore an architectural failure, not a discoverability problem.

R4 reverses that ownership:

```text
canonical/model address space
        ↓
visible bounded working set
        ↓
user selection / aim
        ↓
one persistent focus path
        ↓
demand materialization
        ↓
scale-dependent overlapping representation
```

Scale describes how the focused address is represented. It does not select the address.

## Authority recovered from released V2

R4 will consume the already-shipping `OFU.v1ExplorationAddressSpace` contracts rather than inventing macro astronomy:

- `universe` and bounded `discoverGalaxies`;
- canonical galaxy keys and P3 identity;
- model-derived galactic regions backed by present P3 sectors;
- bounded stellar-neighborhood windows;
- canonical system discovery and canonical body children;
- stable model-derived surface hierarchy and microscopic handoff identities.

A live bounded probe of the R3 artifact on this branch resolved ten distinct P3 galaxies within one window. Their identity is canonical; their layout and visible geometry remain explicitly model-derived or presentation-only.

## Persistent address contract

Every supported destination is represented by an immutable path:

```text
universe / galaxy / region / neighborhood / system / body
         / surface-target / local-object / sample / micro-context
```

Each segment contains an entity ID, kind, parent ID, authority, deterministic materialization key, and representation capabilities. Navigation history stores the full address, scale, camera pose, surface coordinates, and local body-fixed position. Backtracking restores that state rather than asking a stage to choose a default object.

## Materialization contract

Macro discovery produces lightweight nodes only. Deeper contexts are created only after focus enters them. A bounded LRU cache will:

- pin the active focus and its ancestors;
- distinguish macro catalogs, systems, worlds, surface contexts, and samples;
- report hits, misses, evictions, and disposals;
- deterministically reconstruct an evicted address;
- dispose engine-owned representations separately from OFU-owned semantic records.

The initial target is eight retained semantic contexts and one live renderer representation set. The limit is a falsifiable product budget, not a claim that the universe contains eight objects.

## Macro representation

The fresh entry is `UNIVERSE`: several independently selectable galaxies, placed from their bounded integer galaxy keys with a deterministic camera-relative presentation transform. Morphology affects presentation grammar without turning visual shape into canonical fact. Selection of a galaxy materializes only that galaxy's regions; selection of a region materializes only its system window. At least three complete branches must produce different canonical systems and bodies.

## Zoom intent

Deeper travel resolves destination in this order:

1. explicit selected entity;
2. renderer-owned pointer/reticle hit;
3. current focus;
4. current anchor.

No scale boundary may replace the selected identity. When deeper context is not yet materialized, the transition exposes `MATERIALIZING`; when unsupported it fails closed with an explicit capability boundary. It must never silently stall.

## Planetary topology decision

R4 selects a six-face cube-sphere with a quadtree per face as the smallest global topology that supports bounded sparse refinement, arbitrary ray-selected surface directions, deterministic addressing, and traversal without latitude/longitude pole singularities. A tile key is:

```text
body-id / cube-face / level / x / y
```

Latitude/longitude remains an interoperability view of the authoritative body-fixed unit direction. Adjacent face mapping is derived geometrically from the shared direction, so faces are not six isolated flat maps.

The terrain contract is one continuous deterministic presentation-only scalar field sampled from the body-fixed unit direction. Coarse vertices sample that same function at shared coordinates. Fine levels add a deterministic octave hierarchy whose low-frequency parent contribution is unchanged; geomorphing blends a fine vertex toward the parent interpolation, never toward a separately seeded surface. Skirts are retained initially as a bounded crack mask while cross-face neighbor constraints and edge stitching are proven.

This follows the relevant primary engineering evidence:

- Cesium terrain stores tile vertices relative to tile centers and carries an ellipsoid-scaled horizon occludee: <https://cesium.com/downloads/cesiumjs/releases/b24/Documentation/TerrainMesh.html>
- Cesium exposes screen-space error as a refinement control and explicitly describes its performance/quality trade-off: <https://cesium.com/downloads/cesiumjs/releases/1.127/Build/Documentation/VoxelPrimitive.html>
- GPU Gems' geometry-clipmap design uses nested regular grids, coarse-to-fine residual prediction, and transition-region geomorphing to preserve a single multiresolution surface: <https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry>

R4 does not adopt Cesium as a runtime dependency and does not implement a full geometry clipmap. These sources inform the tile-relative precision, SSE, bounded residency, hierarchical residual, and morph contracts implemented over Babylon.js.

## One authority per concern

Babylon.js continues to own the WebGL context, scene, meshes, buffers, materials, disposal, and ray intersection. OFU owns identity, hierarchy, focus, scale intent, history, surface direction, generation seeds, and epistemic classification. There remains one Babylon scene and one camera. Picking uses the rendered scene; no parallel screen projection becomes interaction truth.

## R4 falsification gates

The branch cannot claim `OPEN_UNIVERSE_ARCHITECTURE_PROVEN` until automated and human evidence show:

- multiple visible galaxies are independently selectable and lead to distinct descendants;
- different systems yield different body sets;
- different selected bodies and body-fixed surface rays yield different local contexts;
- HUMAN locomotion changes persistent body-fixed position and visible parallax;
- different selectable local objects yield different source/sample identities and contextual micro metadata;
- transition retargeting and repeated planet/surface crossings never silently stall;
- macro/materialization/terrain working sets remain bounded under randomized branches;
- deterministic, direct-file, offline, browser, mobile, accessibility, and physical-GPU properties do not regress.

Until those gates are evidenced, the recommendation remains `CONTINUE_EXPERIMENT`.
