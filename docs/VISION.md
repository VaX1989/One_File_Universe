# Vision

## One file. One universe. Verifiable by construction.

One File Universe (OFU) explores how far a modern browser can be pushed when a complete deterministic universe, simulation engine, renderer, persistence model, diagnostics and verification machinery are delivered as one self-contained HTML artifact.

The project does **not** define success as storing the most data or claiming the largest theoretical seed space. OFU seeks a stronger combination:

- a single portable release artifact;
- an astronomically large sparse address space;
- deterministic random access to canonical facts;
- causal, multiscale world generation;
- bounded memory and simulation cost;
- meaningful late materialization;
- versioned, portable mutable history;
- reproducible builds and independent conformance evidence.

## Product identity

OFU is simultaneously:

1. a playable procedural universe;
2. a deterministic world-generation reference implementation;
3. a browser systems-engineering experiment;
4. a reproducibility and conformance experiment;
5. a public demonstration of extreme single-artifact software architecture.

The game layer matters: technical infinity without meaningful consequences is not the target. Exploration should reveal causally different worlds, ecosystems, societies and histories rather than cosmetically different noise fields.

## Conceptual scale

The semantic hierarchy may include:

`Universe → Galaxy → Region → Sector → System → Star → Planet → Moon → Surface Region → Biome → Ecosystem → Species → Civilization → Settlement → Agent/Event`

This hierarchy is semantic. Implementations MUST NOT assume it is a fully instantiated object tree.

## Non-goals

OFU does not promise:

- detailed simultaneous simulation of the entire universe;
- perfect scientific fidelity across all modeled domains;
- backward-compatible execution of every historical generator forever inside the newest artifact;
- WebGPU, SharedArrayBuffer or origin-dependent browser storage as baseline requirements;
- a raw-size record obtained through padding or irrelevant embedded assets.

## Long-term ambition

A mature release should allow a user to open one HTML file, enter or generate a Universe Identity, navigate from astronomical to local scales, encounter procedurally coherent environments and histories, change the world, export those changes portably, return later, and obtain the same canonical universe under the same lineage.

The release should also be able to explain itself: which generators produced a fact, which versions were used, what is canonical, what is approximate, what is merely visual, what tests passed, and what claims are externally certified.
