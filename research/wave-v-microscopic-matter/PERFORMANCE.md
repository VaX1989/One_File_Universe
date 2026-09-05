# WV-E Performance and Bounded-Materialization Notes

## Complexity model

The research tissue prototype uses a 2-D nearest-neighbour conservative flux update plus O(number of cells) uptake:

```text
per step time: O(gridCells + cellAgents)
state memory:  O(gridCells + cellAgents)
```

The sparse materialization prototype derives each requested representation independently and bounds cache residency by tier. It never requires enumerating all tissues, cells, organelles or molecules in an organism/world.

```text
per request derivation: O(1) in universe size for the fixture provider
cache memory: bounded by tier maxNodes
cross-scale depth: bounded by tier maxDepth
```

A real provider may have larger local complexity, but the bridge contract should keep dependency depth and local working sets explicitly bounded.

## Local microbenchmark

Environment used for the pre-commit research check:

```text
Node v22.16.0
Linux x64 container
```

Representative single-process results from the research container:

| Fixture | Result |
|---|---:|
| 32×32 grid, 64 agents, 200 steps | ~17 ms total; ~11k steps/s |
| 64×64 grid, 256 agents, 100 steps | ~13–14 ms total; ~7k steps/s |
| 128×128 grid, 512 agents, 25 steps | ~7.5 ms total; ~3.3k steps/s |
| 10,000 deterministic materialization requests | ~37 ms; ~270k requests/s |

These are **microbenchmarks, not product capacity or scientific performance claims**. Results vary with hardware/runtime and the prototype omits many costs of real biological models (geometry, mechanics, reaction networks, stochastic solvers, I/O, validation, etc.).

## Literature-scale context

The 2018 PhysiCell paper reports feasibility of roughly `10^5–10^6` cells for its specific 3-D agent/biotransport architecture on then-current desktop/HPC configurations. That result demonstrates that agent/field models can scale well; it does not set an OFU target or imply equivalent cost for richer intracellular/molecular regimes.

At molecular scales, adaptive-resolution methods provide evidence that local fine detail coupled to a coarse reservoir can reduce cost while preserving selected thermodynamic behavior under a carefully constructed method. OFU should borrow the **principle of localized detail**, not claim those physical guarantees without implementing and validating the corresponding method.

## Future performance gates

Before a FULL_ISOLATED_LANE candidate could be considered promotion-ready, benchmark at minimum:

- deterministic sparse query latency by regime and tier;
- peak resident memory under HOT/IMMEDIATE refinement;
- REFINE/PROJECT/RECONCILE cost and dependency depth;
- cell/tissue scaling by cells, field voxels, substrates and solver class;
- molecular adapter cost by beads/atoms and trajectory frames;
- worker-order/query-order determinism;
- cancellation/eviction behavior;
- browser/mobile working-set ceilings if any prototype ever reaches product surfaces.
