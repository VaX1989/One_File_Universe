# Risk Register

Scale: likelihood (L) and impact (I) from 1 low to 5 critical. Score = L×I. Scores are prioritization aids, not substitutes for evidence.

| ID | Risk | L | I | Score | Primary mitigation | Validation frontier |
|---|---|---:|---:|---:|---|---|
| R-001 | `file://` security/origin behavior blocks required APIs on a target browser | 2 | 5 | 10 | Strict direct-open matrix and explicit environment-limited behavior | F-ENGINE/F-CERT |
| R-002 | Canonical outputs diverge across JS engines/architectures | 4 | 5 | 20 | D3 kernel, independent oracle, Golden corpora | F-GOV/F-CERT |
| R-003 | Global/sequential RNG creates cascading world changes | 4 | 5 | 20 | addressed derivation with explicit domain/property/counter separation | F-GOV |
| R-004 | Generator changes silently rewrite existing worlds | 4 | 5 | 20 | semantic Generator Manifest + explicit lineage/migration | F-GOV/F-STATE |
| R-005 | Procedural space is huge but perceptually repetitive | 5 | 4 | 20 | causal generation, systemic diversity and product-quality metrics | F-ASTRO/F-PLANET/F-LIFE/F-CIV |
| R-006 | Late-generated detail contradicts committed history | 4 | 5 | 20 | `REFINE`/`PROJECT`/`RECONCILE`; cross-scale property tests | F-HISTORY/F-MICRO |
| R-007 | Runtime memory/GC grows with theoretical universe size | 4 | 5 | 20 | bounded materialized working set, LOD and explicit budgets | F-ENGINE |
| R-008 | Embedded artifact size causes parse/decode/startup amplification | 4 | 4 | 16 | staged/indexed decoding, on-demand materialization and measured startup budgets | F-ENGINE/F-CERT |
| R-009 | Browser-local persistence is evicted/unavailable | 3 | 4 | 12 | portable authoritative save/archive | F-STATE |
| R-010 | Event/save history grows without bound | 4 | 4 | 16 | checkpoints, deterministic compaction, future migration/archive policy | F-STATE |
| R-011 | WebGPU/SharedArrayBuffer assumptions break Strict portability | 2 | 5 | 10 | optional Enhanced acceleration only; WebGL2-class baseline | F-ENGINE/F-VIS |
| R-012 | Scientific claims exceed model fidelity | 4 | 5 | 20 | evidence/fidelity/authority classification and fail-closed unknown/unsupported | all scientific fronts |
| R-013 | Reproducible build is defeated by toolchain/environment nondeterminism | 2 | 5 | 10 | pinned toolchain, normalized inputs, exact-source evidence | F-CERT |
| R-014 | Record claim is dismissed as padding/marketing | 4 | 4 | 16 | Record Vector and meaningful functional-payload inventory | F-CERT |
| R-015 | Backward compatibility makes artifact grow forever | 3 | 4 | 12 | explicit protocol lineage/migration and historical executors where necessary | F-STATE/F-ENGINE |
| R-016 | Browser/host file-size limits constrain distribution | 3 | 3 | 9 | distribution/archive policy separated from runtime semantics | F-CERT |
| R-017 | Procedural subsystems become tightly coupled and untestable | 5 | 4 | 20 | provider contracts, additive modules, bounded dependency DAG | F-GOV/F-ENGINE |
| R-018 | Non-deterministic acceleration leaks into canonical state | 2 | 5 | 10 | authority boundary + reference oracle/non-interference tests | F-VIS/F-ENGINE |
| R-019 | Save/event semantics drift across versions | 3 | 5 | 15 | explicit schemas, compatibility tests and fail-closed migrations | F-STATE |
| R-020 | Premature implementation lock-in | 3 | 4 | 12 | keep reversible choices experimental until measured | F-GOV |
| R-021 | Green per-job CI hides cross-target disagreement | 2 | 5 | 10 | machine-enforced aggregate evidence gate | F-CERT |
| R-022 | Fixed-width address conversion aliases out-of-range coordinates | 1 | 5 | 5 | checked signed/unsigned boundaries; no modulo wrapping | F-GOV |
| R-023 | Portable in-memory values cannot be represented safely in save format | 2 | 5 | 10 | explicit bounded portable value domain and canonical serialization | F-STATE |
| R-024 | Strict artifact quietly depends on another local file | 1 | 5 | 5 | request/DOM/Resource Timing audit plus positive controls | F-CERT |
| R-025 | Engines agree on an unintended semantic change and silently redefine baseline | 2 | 5 | 10 | committed expected corpus digests and versioned vectors | F-GOV/F-CERT |
| R-026 | Weak volatile prior becomes canonical scientific certainty | 2 | 5 | 10 | Environment v2 `NO_CANONICAL_GENESIS`; research/canonical separation | F-PLANET |
| R-027 | Effective temperature is consumed as mean surface temperature | 3 | 5 | 15 | distinct fields/authority; greenhouse surface climate remains separately gated | F-PLANET/F-LIFE |
| R-028 | Test/research biology fixtures become canonical life | 2 | 5 | 10 | shipped-runtime separation, witnesses and promotion-only authority | F-LIFE |
| R-029 | Combinatorial scale explosion defeats bounded runtime | 4 | 5 | 20 | sparse queries, semantic LOD, late materialization, significance projection | F-ENGINE/F-HISTORY/F-MICRO |
| R-030 | Presentation terrain becomes fake canonical geography | 4 | 5 | 20 | physical-geography authority contract; presentation-only labels/non-claims | F-PLANET/F-VIS |
| R-031 | Cross-scale representations contradict each other | 4 | 5 | 20 | `CROSS_SCALE_CONTINUITY`, reconciliation witnesses and upstream constraint binding | all multiscale fronts |
| R-032 | Terrain/planet LOD cracks or visual discontinuities break the exploration illusion | 4 | 4 | 16 | crack-free LOD strategy, cross-band visual oracles and founder-visible gates | F-VIS/F-UX |
| R-033 | Graphics quality is treated as optional after semantic correctness | 4 | 4 | 16 | co-equal product-completeness gate with visual evidence | F-VIS/F-CERT |
| R-034 | UX becomes engineering-first and panel-dominated | 4 | 4 | 16 | universe-first hierarchy, direct manipulation and progressive disclosure | F-UX |
| R-035 | Mobile/touch semantics diverge from desktop truth or trap page gestures | 3 | 4 | 12 | semantic input router, touch ownership, physical-device testing | F-UX/F-CERT |
| R-036 | WebGPU/WebGL paths visually or resource-wise diverge | 3 | 4 | 12 | shared presentation contract, fallback/parity/resource lifecycle tests | F-VIS/F-ENGINE |
| R-037 | Large artifact causes transient memory amplification far above resident target | 4 | 4 | 16 | staged decoding, compressed/indexed assets, working-set telemetry | F-ENGINE |
| R-038 | Unbounded agent/cell populations collapse simulation cost | 4 | 5 | 20 | COLD/WARM/HOT/IMMEDIATE, bounded populations, aggregate state and late materialization | F-LIFE/F-CIV/F-MICRO |
| R-039 | Civilization is generated as decorative state without causal history | 4 | 4 | 16 | environment/resource/population/history dependency contracts | F-CIV/F-HISTORY |
| R-040 | Molecular/atomic detail is mistaken for validated biology/physics | 3 | 5 | 15 | regime-specific evidence/validity and visualization-vs-dynamics separation | F-MICRO/F-MATTER |
| R-041 | Quantum-compatible reserve is marketed as quantum simulation | 2 | 5 | 10 | `RESEARCH/SPECULATIVE` status and explicit non-classical regime contract | F-NONCLASS |
| R-042 | Many AI writer lanes collide on central bootstrap/build/shared contracts | 5 | 4 | 20 | exact-base ownership matrix, single writer per shared surface, additive providers | F-GOV/F-ENGINE |
| R-043 | Integration owner becomes throughput bottleneck | 4 | 4 | 16 | smaller shared seam, machine-readable DAG, lane-local evidence, deterministic composition | F-GOV/F-CERT |
| R-044 | Research branch is silently used as production truth | 3 | 5 | 15 | explicit authority metadata; promotion transaction/reconciliation required | all research fronts |
| R-045 | Current release-specific navigation APIs become permanent architecture accidentally | 4 | 3 | 12 | architecture roles distinct from v0.8/v0.9 compatibility names | F-EXP/F-UX |
| R-046 | Accessibility is postponed until a visually rich 3D UI is expensive to remediate | 4 | 4 | 16 | accessibility projection and equivalent controls designed with exploration seams | F-UX/F-CERT |
| R-047 | Systemic audio creates inaccessible or non-deterministic meaning | 3 | 3 | 9 | audio remains derived/presentation; visual/semantic equivalents | F-SOUND/F-UX |

## Risk-management rule

A phase/workstream exit report must update risks materially affected by evidence. A mitigation becomes evidence-backed only after its associated test executes and passes. Current P0–P6 certification mitigates only each versioned declared scope; future planetology, positive biology, civilization, microscopic and non-classical work retain their own risks. Product certification must treat material visual/UX defects and scientific overclaim as blockers even when semantic CI is green.
