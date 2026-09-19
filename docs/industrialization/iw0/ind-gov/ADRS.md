# IND-GOV-A — Industrialization ADR Set

**Status:** ACCEPTED_FOR_G0A_CANDIDATE  
**Authority:** INDUSTRIALIZATION_SPEC_CANDIDATE_ONLY  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`

These records harvest existing P2/P4 semantics. They do not modify frozen protocol authority.

## ADR-IGOV-001 — Freeze bytes before APIs

**Decision:** The first implementation-independent specification surface is the P2 byte/identity substrate: OFU-CBV-1, frozen Unicode, Canonical Address v1, Semantic Manifest v1, Universe/Entity Identity, addressed derivation and the narrow deterministic numeric contract.

**Rationale:** These surfaces already have explicit wire/semantic rules, golden vectors, an independent Python oracle and fail-closed rejection evidence. Their behavior can be implemented without reproducing JavaScript object layouts.

**Rejected alternative:** standardize the current JS kernel API as the public protocol. That would confuse implementation shape with semantic authority.

## ADR-IGOV-002 — Harvest only the narrow P4 semantic core

**Decision:** Specify P4 canonical time/event ordering, lineage/live-frontier semantics, exact transition binding, checkpoint/compaction invariants and archive integrity/authority invariants.

**Not decided:** a generic persistence API, storage provider ABI, host callbacks, reducer object layout, migration negotiation or storage backend.

**Rationale:** The selected invariants are frozen and executable; the surrounding host/API surface is not independently consumed enough to freeze.

## ADR-IGOV-003 — Runtime/resource policy is non-normative to world truth

**Decision:** Current scheduler tiers, adaptive materialization thresholds, cache/queue ceilings, renderer resource policy and performance heuristics remain implementation policy.

**Invariant preserved:** resource pressure may alter when, whether or at what presentation/derived fidelity work materializes, but must not silently alter admitted canonical results.

**Rejected alternative:** copying current V2X runtime constants into the normative protocol.

## ADR-IGOV-004 — Provenance boundary without freezing current PX wire shape

**Decision:** Preserve the rule that presentation and measured runtime evidence cannot silently become canonical authority, while keeping the current PX authority/evidence record vocabulary and registry schema draft-only.

**Rationale:** The authority separation is architectural; the exact current labels and JSON/JS shapes are not yet cross-consumer protocol evidence.

## ADR-IGOV-005 — Cross-scale verbs stay architectural

**Decision:** Reserve `REFINE`, `PROJECT`, and `RECONCILE` as architectural operations, but do not standardize the current 3-axis spatial, matter, observable or result payload schemas.

**Rationale:** A universal payload requires evidence from multiple scientific/model regimes and at least one independent external consumer.

## ADR-IGOV-006 — Legacy P1 save is compatibility material, not the future standard

**Decision:** `src/persistence/save.js` remains a legacy compatibility surface. Its `ofu-canonical-v1` JSON model and `generatorManifestHash` terminology must not be promoted into the P2/P4 industrialization specification by inertia.

**Migration rule:** any future migration to P4 archive/persistence semantics requires an explicit versioned differential path; no silent reinterpretation.

## ADR-IGOV-007 — Exact/fail-closed evolution until evidence proves negotiation

**Decision:** The harvested v1/v2 surfaces retain exact version/profile/schema matching and fail closed on unsupported semantics. This lane does not invent range negotiation, downgrade, extension negotiation or migration negotiation.

**Future trigger:** negotiation becomes eligible only after real cross-version consumers demonstrate a requirement and conformance corpus coverage can make it testable.
