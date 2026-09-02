# Risk Register

Scale: likelihood (L) and impact (I) from 1 low to 5 critical. Score = L×I. Scores are prioritization aids, not substitutes for evidence.

| ID | Risk | L | I | Score | Primary mitigation | Validation phase |
|---|---|---:|---:|---:|---|---|
| R-001 | `file://` security/origin behavior blocks required APIs on a target browser | 2 | 5 | 10 | Strict direct-open matrix and explicit environment-limited behavior | P1+ |
| R-002 | Canonical outputs diverge across JS engines/architectures | 4 | 5 | 20 | D3 kernel, independent oracle, Golden Universe Corpus v1 | P2 |
| R-003 | Global/sequential RNG creates cascading world changes | 4 | 5 | 20 | addressed derivation with explicit domain/property/counter separation | P2 |
| R-004 | Generator changes silently rewrite existing worlds | 4 | 5 | 20 | semantic Generator Manifest + explicit lineage/migration | P2+ |
| R-005 | Procedural space is huge but perceptually repetitive | 5 | 4 | 20 | causal generation and domain quality metrics | P5–P9 |
| R-006 | Late-generated detail contradicts committed history | 4 | 5 | 20 | facts→constraints→detail contract; refinement property tests | P4–P8 |
| R-007 | Runtime memory/GC grows with theoretical universe size | 4 | 5 | 20 | bounded materialized working set, LOD, explicit budgets | P1+ |
| R-008 | Embedded artifact size causes parse/decode/startup amplification | 3 | 4 | 12 | staged decoding and measured budgets | P12 |
| R-009 | Browser-local persistence is evicted/unavailable | 3 | 4 | 12 | portable authoritative save | P1/P4 |
| R-010 | Event log grows without bound | 4 | 4 | 16 | checkpoints + deterministic compaction | P4 |
| R-011 | WebGPU/SharedArrayBuffer assumptions break Strict portability | 2 | 5 | 10 | optional acceleration only | P1+ |
| R-012 | Scientific claims exceed model fidelity | 3 | 4 | 12 | orthogonal evidence/fidelity classification and provenance | P2+ |
| R-013 | Reproducible build is defeated by toolchain/environment nondeterminism | 2 | 5 | 10 | pinned Node, normalized inputs, matrix hash aggregation | P1/P11 |
| R-014 | Record claim is dismissed as padding/marketing | 4 | 4 | 16 | Record Vector and evidence taxonomy | P11 |
| R-015 | Backward compatibility makes artifact grow forever | 3 | 4 | 12 | explicit protocol lineage/migration policy | P2+ |
| R-016 | Browser or repository host file-size limits constrain distribution | 3 | 3 | 9 | release/archive distribution policy | P11/P12 |
| R-017 | Procedural subsystems become tightly coupled and untestable | 4 | 4 | 16 | domain contracts and bounded dependency graph | P2+ |
| R-018 | Non-deterministic acceleration leaks into canonical state | 2 | 5 | 10 | authority boundary + reference oracle | all |
| R-019 | Save/event semantics drift across versions | 3 | 5 | 15 | explicit schemas, compatibility tests and fail-closed future versions | P4+ |
| R-020 | Premature implementation lock-in | 3 | 4 | 12 | keep reversible choices experimental until P2 evidence | P1/P2 |
| R-021 | Green per-job CI hides cross-target disagreement | 2 | 5 | 10 | machine-enforced aggregate evidence gate | P1+ |
| R-022 | Fixed-width address conversion aliases out-of-range coordinates | 1 | 5 | 5 | checked signed/unsigned boundaries; no modulo wrapping | P1/P2 |
| R-023 | Portable in-memory values cannot be represented safely in the save format | 2 | 5 | 10 | explicit bounded portable value domain and deterministic serialization | P1/P4 |
| R-024 | Strict artifact quietly depends on another local file | 1 | 5 | 5 | request/DOM/Resource Timing audit plus local-file positive control | P1+ |
| R-025 | Engines agree on an unintended semantic change and silently redefine baseline | 2 | 5 | 10 | committed expected corpus digest and versioned vector evolution | P1/P2 |

## Risk-management rule

A phase exit report must update risks materially affected by evidence. A mitigation becomes evidence-backed only after its associated test is executed and passes. P1 reduced several runtime risks but did not eliminate P2 protocol, independent-oracle, mobile/Safari or record-scale risks.
