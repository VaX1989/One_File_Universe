# Risk Register

Scale: likelihood (L) and impact (I) from 1 low to 5 critical. Score = L×I. Scores are prioritization aids, not substitutes for evidence.

| ID | Risk | L | I | Score | Primary mitigation | Validation phase |
|---|---|---:|---:|---:|---|---|
| R-001 | `file://` security/origin behavior blocks required APIs on a target browser | 4 | 5 | 20 | Strict profile excludes origin-dependent requirements; P1 direct-open harness | P1 |
| R-002 | Canonical outputs diverge across JS engines/architectures | 4 | 5 | 20 | D3 kernel, deterministic numeric contract, golden corpus | P2 |
| R-003 | Global/sequential RNG creates cascading world changes | 4 | 5 | 20 | Addressed PRF with domain separation | P2 |
| R-004 | Generator changes silently rewrite existing worlds | 4 | 5 | 20 | Generator Manifest + explicit lineage/migration | P2+ |
| R-005 | Procedural space is huge but perceptually repetitive | 5 | 4 | 20 | causal generation, domain-specific diversity/quality metrics | P5–P9 |
| R-006 | Late-generated detail contradicts committed history | 4 | 5 | 20 | facts→constraints→detail contract; refinement property tests | P4–P8 |
| R-007 | Runtime memory/GC grows with theoretical universe size | 4 | 5 | 20 | bounded working set, LOD, transferable buffers, explicit budgets | P1+ |
| R-008 | Embedded artifact size causes parse/decode/startup amplification | 4 | 4 | 16 | P1 payload experiments, staged decoding, measure peak memory | P1/P12 |
| R-009 | Browser-local persistence is evicted/unavailable | 4 | 4 | 16 | portable authoritative save; storage only convenience/cache | P1/P4 |
| R-010 | Event log grows without bound | 4 | 4 | 16 | checkpoints + deterministic compaction | P4 |
| R-011 | WebGPU/SharedArrayBuffer assumptions break Strict portability | 3 | 5 | 15 | WebGL2 baseline; optional capability acceleration only | P1 |
| R-012 | Scientific claims exceed model fidelity | 3 | 4 | 12 | fidelity classes, provenance, assumptions/invariants | all domains |
| R-013 | Reproducible build is defeated by toolchain/environment nondeterminism | 3 | 5 | 15 | pinned toolchain, normalized inputs, independent rebuilds | P1/P11 |
| R-014 | Record claim is dismissed as padding/marketing | 4 | 4 | 16 | Record Vector, CFP manifest, evidence taxonomy | P0/P11 |
| R-015 | Backward compatibility makes artifact grow forever | 3 | 4 | 12 | historical artifact execution + explicit migration policy | P2+ |
| R-016 | Browser or repository host file-size limits constrain distribution | 3 | 3 | 9 | source remains Git-sized; large certified artifacts via release assets/external archival mirrors as policy permits | P11/P12 |
| R-017 | Procedural subsystems become tightly coupled and untestable | 4 | 4 | 16 | domain contracts, bounded dependency graph, domain tags, conformance vectors | P2+ |
| R-018 | Non-deterministic acceleration leaks into canonical state | 3 | 5 | 15 | canonical/presentation authority boundary; reference oracle | all |
| R-019 | Save/event semantics drift across versions | 3 | 5 | 15 | event schema versioning, migrations, compatibility tests | P4+ |
| R-020 | Premature implementation lock-in (language/math/compression) | 4 | 3 | 12 | treat as experiments until benchmarked; ADR status gates | P0/P1 |

## Risk-management rule

A phase exit report must update risks materially affected by evidence. New high-impact risks discovered during implementation are added immediately; they are not deferred until release.

A mitigation is not considered effective merely because it is documented. It becomes evidence-backed only after the associated validation phase passes.