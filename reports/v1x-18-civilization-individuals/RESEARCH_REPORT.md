# V1X-18 Research Report — Civilization / History / Individuals

**Lane:** PROMPT 18 / R&D-18  
**Branch:** `research/v1x-18-civilization-individuals-2026-09-06`  
**Authority:** RESEARCH_ONLY; MODEL_DERIVED_SIMULATION candidate only  
**Prompt-0 base:** `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19` / tree `3324e6354b5ff1b90156d1693e6051595b6f1219`

## Status

`RESEARCH_ADVANCED` — the lane now contains executable causal settlement dynamics, sparse aggregate population identity slices, selected-person refinement/reconciliation, history-to-present structural legacies, deterministic AI-independent person fallbacks, a P4 transition-family bridge prototype, causal golden oracles, and bounded-working-set tests.

It is **not promotion-ready**. The V1X-17 logical dependency branch was still at the frozen Prompt-0 base when this work began, so ecology enters through explicit exogenous PPM drivers rather than a V1X-17 research contract. No shipping registry, canonical source, P4 core, or renderer path was modified.

## Causal behavior demonstrated

A 30-year deterministic two-settlement fixture diverges under an 11-year severe ecology shock. The baseline river settlement ends at population 20,048 with conflict 40,330 ppm; the drought branch ends at population 10,081 with conflict 70,779 ppm and a nonzero route legacy. A separate high-conflict fixture accumulates persistent ruins and records structural history events. These numbers are **test oracles for the research model**, not historical estimates.

Historical effects persist through explicit stocks: `ruins`, `routeLegacy`, infrastructure, demographic cohort slices, migration location, settlement abandonment/reoccupation markers, technology, institutions, and bounded event history. Later state therefore depends on prior transitions rather than a scripted story label.

## Aggregate ↔ individual result

The aggregate simulation never creates a person object. It maintains bounded cohort/residence slices with origin, birth year and contiguous serial ranges. `REFINE` materializes only selected addresses (max 128), with stable SHA-256 research IDs, age/role, bounded knowledge, goals, memories, life events and model-derived relationship candidates. `PROJECT` produces age/role counts for the materialized sample. `RECONCILE` verifies unique identity, current aggregate membership, exact deterministic rematerialization and cognition bounds.

A late-materialization test evolves 12 years with no individuals and compares it to a run that materializes four persons before every aggregate step; final aggregate worlds are deep-equal. This demonstrates that refinement is observational in the prototype.

## Runtime / boundedness evidence

Diagnostic runtime: Node 22.16.0 (repository canonical engine is 24.20.x; therefore this evidence is non-canonical research evidence).

- Main research test suite: PASS, 17 assertions/groups.
- 300-year two-settlement stress simulation: PASS.
- Maximum observed cohort slices per settlement in stress fixture: 110.
- Hard slice cap: 256.
- Hard settlement cap: 64.
- Hard selected-individual cap: 128/request.
- Birth ledger: hard 8,192 entries and fail-closed on overflow.
- Structural history: bounded to 1,024 in-memory events in this research prototype.

## P4 compatibility result

`p4-bridge.mjs` mirrors the frozen P4 exact-transition-contract shape and declares three research-only event families. A reducer API smoke test verifies deterministic bounded trace behavior against a contract-construction stub. This is **structural compatibility evidence only**, not executed exact-P4 replay evidence. Promotion requires running the bridge through the actual frozen `O.p4.createTransitionContract`, canonical event encoding, checkpoint/replay, compaction, export/import, and exact Node 24/browser environments.

## Dependency posture

V1X-18 logically depends on V1X-17. At execution start, `research/v1x-17-life-evolution-2026-09-06` still pointed to the common base SHA `760c0c70...`. This lane therefore treats ecology/resource productivity as external bounded inputs and does not fabricate a biosphere interface. Once V1X-17 publishes a checkpoint, a read-only adapter research pass can bind those inputs without rebasing this branch or mutating V1X-17.

## Promotion prerequisites

1. Exact Node 24.20.x rerun plus browser deterministic vectors.
2. Actual frozen P4 replay/checkpoint/archive execution with a centrally adjudicated transition contract.
3. Convergence-owner decision for cross-scale civilization address schema and which state, if any, becomes promoted MODEL_DERIVED_SIMULATION.
4. Bind to admitted V1X-17/V1X-16 environmental/ecological quantities with units, provenance and uncertainty.
5. Replace research SHA binding with frozen OFU canonical digest and add collision/domain vectors.
6. Calibrate any relationship intended to make empirical claims; retain explicit era/geography validity domains and uncertainty.
7. Add archive/checkpoint compaction for birth ledger and history rather than research fail/rolling truncation.
8. Adversarial tests for migration slice fragmentation, polity-scale graphs, integer upper bounds, long-run extinction/recolonization and save compatibility.
9. Independent ethics/product review before representing individuals, culture, institutions or conflict as anything beyond stylized model-derived simulation.

## Shipping extraction plan

Extract mechanism, not files. A future shipping lane should define a narrow civilization provider behind PX contracts, map settlement aggregates to sparse addressed entities, use P4 only via an admitted exact transition contract, and implement REFINE/PROJECT/RECONCILE with central cross-scale authority. Keep the global model aggregate-first; materialize persons only for selected/nearby contexts and evict them without losing their aggregate address. AI agents may enrich dialogue/planning but must never be required to reproduce canonical simulation state.
