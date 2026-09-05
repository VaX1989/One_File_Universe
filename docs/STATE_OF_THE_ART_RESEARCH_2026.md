# State-of-the-Art Research Notes — 2026

**Status:** NON-NORMATIVE RESEARCH. Sources and conclusions here inform architecture choices but do not create canonical universe facts or freeze an implementation.

## Purpose

The founder-vision formalization reviewed modern techniques relevant to sparse planetary rendering, browser GPU execution, multiscale simulation, biological/agent modeling and accessible 3D interfaces. OFU should adopt principles that fit its one-file, deterministic, authority-separated architecture rather than copy any one engine.

## 1. Hierarchical spatial LOD and terrain

### Sources

- OGC 3D Tiles: https://www.ogc.org/standards/3DTiles/
- Losasso & Hoppe, *Geometry Clipmaps: Terrain Rendering Using Nested Regular Grids*: https://hhoppe.com/proj/geomclipmap/

### Relevant ideas

3D Tiles demonstrates hierarchical spatial data structures with bounding volumes and screen-space refinement for massive 3D datasets. Geometry clipmaps demonstrate viewer-centered nested regular grids, incremental updates, continuity and bounded terrain caches.

### OFU disposition

**Adopt principles, not file formats.** OFU should use hierarchical patch/tile identity, screen/error-driven visual refinement and bounded local caches. Planetary canonical state remains separate from renderer LOD. Crack skirts/stitching and synthesized microdetail are presentation techniques unless a physical terrain model owns them. Cube-sphere/quadtree-like surface addressing remains attractive because P5 already freezes an exact cube-sphere topology, but future physical terrain requires a separately versioned height/geology authority.

## 2. Large-world precision

### Source

- Cesium graphics pipeline discussion, including Relative-to-Eye high-precision rendering: https://cesium.com/blog/2015/05/26/graphics-tech-in-cesium-stack/

### Relevant idea

Large geospatial engines avoid feeding huge absolute coordinates directly into limited-precision GPU positions; they use high/low splits or eye-relative coordinates and local frames.

### OFU disposition

**Adopt.** Keep canonical/high-precision identity and model coordinates independent of GPU Float32. Use floating/local origins, patch-relative buffers and explicit reversible frame transforms. Wave IV's presentation local frame is evidence for this direction, not a final canonical geodesy contract.

## 3. WebGL2 baseline and WebGPU Enhanced path

### Sources

- Khronos WebGL 2 specification: https://registry.khronos.org/webgl/specs/latest/2.0/
- W3C WebGPU specification: https://www.w3.org/TR/webgpu/

### Relevant ideas

WebGL2 remains a broadly established web graphics API. WebGPU exposes modern GPU rendering and compute with explicit resources and pipelines.

### OFU disposition

**Dual backend architecture.** Strict Direct-Open keeps a WebGL2-class portable baseline. The same artifact may expose WebGPU as an Enhanced path for GPU-driven culling, compute-assisted materialization, indirect/batched rendering or other measured wins. Backend choice changes presentation/derived performance, not canonical world facts. A WebGPU path must have fallback/parity/resource-lifecycle evidence and must not become a requirement for semantic correctness.

## 4. Multiscale biological composition

### Sources

- Agmon et al., *Vivarium: an interface and engine for integrative multiscale modeling in computational biology*: https://doi.org/10.1093/bioinformatics/btac049
- Ghaffarizadeh et al., *PhysiCell: An open source physics-based cell simulator for 3-D multicellular systems*: https://doi.org/10.1371/journal.pcbi.1005991

### Relevant ideas

Vivarium composes heterogeneous mechanistic models with explicit adapters and different mathematical formalisms/timescales. PhysiCell couples many cell agents to a shared biochemical microenvironment and demonstrates that local multicellular simulation can be bounded to relevant populations rather than an entire biosphere.

### OFU disposition

**Strongly compatible with ModelRegime + late materialization.** Microscopic OFU should use explicit adapters for units, reference frames, time scales, state variables and uncertainty. Organism/tissue/cell/molecular regimes can use different solvers. Only locally relevant cell populations need materialization; aggregate canonical constraints can remain upstream. OFU does not inherit scientific validity from these tools and should not claim their disease/tissue models as universal exobiology.

## 5. Agent/ecology model documentation

### Source

- Grimm et al., *The ODD Protocol for Describing Agent-Based and Other Simulation Models* (2020 update): https://doi.org/10.18564/jasss.4259

### Relevant ideas

ODD makes agent-model purpose, state variables/scales, scheduling, design concepts, initialization, inputs and submodels explicit, improving reproducibility and structural clarity.

### OFU disposition

**Adopt as documentation inspiration.** Future ecology/civilization agent models should publish state variables, scales, scheduling, initialization, inputs, submodels, stochastic/deterministic semantics and observational outputs. OFU additionally requires canonical authority, P2/P4 lineage, cost budgets and `REFINE`/`PROJECT`/`RECONCILE` contracts.

## 6. Browser-native molecular visualization

### Source

- Sehnal et al., *Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures*: https://doi.org/10.1093/nar/gkab314

### Relevant ideas

Modern browser graphics can interactively visualize large biomolecular and mesoscopic structures using compressed/streamed representations, multiple visualization models and modular state/query architecture.

### OFU disposition

**Visualization precedent only.** It supports the credibility of future browser-native microscopic visualization, not full molecular simulation. OFU should separate structural/visual representations from dynamical authority and use bounded query-driven local materialization.

## 7. Accessibility for direct-manipulation 3D

### Source

- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/

### Relevant ideas

WCAG 2.2 includes requirements relevant to exploratory 3D product surfaces, including alternatives to dragging and minimum pointer target sizing, alongside established keyboard, focus, motion and semantic requirements.

### OFU disposition

**Adopt product requirements.** A canvas-only spatial gesture cannot be the only path to an essential function when an equivalent control is feasible. Explore should expose keyboard/single-pointer alternatives, semantic selected-object/scale context, reduced-motion behavior, adequate targets and non-color-only status.

## 8. Approaches not adopted as canonical architecture

- **One giant Euclidean scene graph:** rejected because identity/query/model-regime semantics span non-spatial and future non-classical domains.
- **Literal infinite subdivision:** rejected; implemented regimes are finite/versioned and working sets bounded.
- **GPU-authoritative simulation by default:** rejected; browser GPU variability remains downstream of canonical semantics unless a future conformance contract proves an operation safe.
- **Renderer LOD as world truth:** rejected; visual tessellation and canonical geography have different authority.
- **Universal per-agent simulation:** rejected; COLD/WARM/HOT/IMMEDIATE and late materialization are required to keep populations/cells/agents bounded.
- **Earth taxonomy as alien biology law:** rejected; Earth calibration must be explicit and separate from generalized/hypothetical/generative models.
- **Brute-force quantum universe:** rejected as an engineering claim; only bounded future non-classical regimes with explicit compatibility are reserved.

## 9. Research conclusion

The existing OFU constitutional primitives are unusually compatible with the long-range vision: sparse addressing, explicit ModelRegime, late materialization, bounded working sets, scientific authority separation and P4 event sourcing already solve the hardest architectural category errors. The next state-of-the-art step is not a new monolithic engine; it is stronger **composable provider contracts, cross-scale reconciliation, hierarchical resource virtualization and product-grade direct exploration**.
