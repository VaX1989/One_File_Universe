# Independent Integration Board — Cycle 1

**Date:** 2026-09-02  
**Repository:** `VaX1989/One_File_Universe`  
**Board scope:** P2/P3/P4/P5 architecture, contracts, evidence and cross-phase integration.  
**Feature ownership:** unchanged; this board does not own P3 astronomy, P4 temporal implementation or P5 planetology implementation.

## Live state

Reverified before adjudication:

| Track | Ref | Exact reviewed SHA | State |
| --- | --- | --- | --- |
| main / P2 | `main` | `0d802f2af87e7db4ba9553f11cc9914c93a3cebc` | P2 merged/frozen; current-main conformance green |
| P2 PR | #6 | merged | closed upstream implementation |
| P2 issue | #5 | administratively closed during this cycle | technical exit gate already satisfied |
| P2 preview release | `v0.2.0-preview.1` | target `0d802f2af87e7db4ba9553f11cc9914c93a3cebc` | published |
| P3 prototype | `prototype/p3-universe-skeleton-pre-freeze` | `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a` | isolated schema-0 prototype |
| P4 candidate | `feature/p4-temporal-kernel` | `14537ef25083787cc13b8c93a250995e8dacdc28` | PR #9 draft; material blockers found |
| P5 research | `research/p5-planetology` | `efe2b8ce29267deb26f3f34d18433c96947c467e` | research only |

### P2 exact-main evidence

P2 Conformance run `33619697428` on exact `main@0d802f2af87e7db4ba9553f11cc9914c93a3cebc` passed the oracle/build, Linux Chromium/Firefox/WebKit, Windows Chromium, macOS ARM64 WebKit and aggregate jobs. Release artifact `One_File_Universe.html` is published under `v0.2.0-preview.1`; recorded SHA-256: `91f34fd081e172ae992a160af197d4ea69dbe8dc167be0ac0ae7f81834960a98`.

Issue #5 was therefore an administrative inconsistency after the Roadmap and release evidence already declared P2 complete. This cycle added a final evidence-seal comment and closed #5 as completed. No P2 protocol defect was reproduced. P2 remains frozen.

### P4 exact-head evidence

On exact P4 head `14537ef25083787cc13b8c93a250995e8dacdc28`:

- Foundation Integrity: PASS;
- P1 Conformance: PASS;
- P4 Conformance: PASS;
- P2 runtime/oracle/browser/reproducible-build jobs: PASS;
- P2 aggregate: FAIL.

The P2 aggregate failure is reproduced as foreign artifact contamination, not semantic regression. Aggregate job `100219028661` found `p2-build/evidence/p4-node-replay.json` and correctly rejected its `phase: P4` / unsupported P2 evidence kind.

Root cause at this head:

1. P2 workflow invokes generic `npm test`;
2. P4 extended generic `npm test` to execute P4 tests;
3. P4 test writes `dist/evidence/p4-node-replay.json`;
4. P2 `p2-build` uploads generic `dist/`;
5. P2 aggregate correctly fails closed when foreign P4 evidence enters its input.

The fix belongs to evidence execution/packaging isolation. The P2 validator must not be weakened.

## Contract matrix

| Contract | Owner | Consumers | State | Cycle-1 decision |
| --- | --- | --- | --- | --- |
| OFU-CBV-1 | P2 | all | FROZEN | unchanged |
| Unicode profile | P2 | all | FROZEN | unchanged |
| Universe / Entity Identity | P2 | P3+ | FROZEN | unchanged |
| Address / derivation / manifest / numeric authority | P2 | P3+ | FROZEN | unchanged |
| Phase-owned evidence | Integration + phase CI | all | STABLE_SNAPSHOT | explicit phase roots; foreign evidence still fails closed |
| Astronomy Facts | P3 | P4/P5 | PROPOSED | promote prototype to schema-v1 work from certified main |
| Normalized P3 System identity/address | P3 under P2 | P4/P5 | STABLE_SNAPSHOT | preserve normalized absolute-site design |
| P3 -> P5 planetary input | P3/P5 boundary | P5 | STABLE_SNAPSHOT | one owner per fact; physical radius belongs to P5 unless explicitly re-adjudicated before P3 freeze |
| Temporal Contract | P4 | P5/P6/P7 | PROPOSED | material replay/compaction/reducer blockers remain |
| Planet Physical Contract | P5 | P6 | RESEARCH | causal architecture retained; no premature D3 claim |
| P4 -> P5 temporal ownership | P4 time + P5 transitions | P5 | STABLE_SNAPSHOT | no P5-private canonical clock/history |

## Findings

| Track | Finding | Severity | Reproduced | Impact | Owner | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| P2 | Issue #5 remained open after exact-main certification/release/Roadmap closure | IMPORTANT NON-BLOCKER / administrative | YES | Could incorrectly serialize P3/P4 behind an obsolete gate | Chat 1 / P2 owner | Evidence seal added; #5 closed completed in this cycle. No P2 redesign. |
| P4 -> P2 | P4 evidence enters `p2-build`; P2 aggregate rejects it | MATERIAL BLOCKER | YES | Evidence truth / exact-head integration gate | Chat 3 + CI/evidence integration | Phase-scope execution and evidence roots/artifacts; keep P2 aggregate fail-closed; exact-head Foundation/P1/P2/P4 all PASS. |
| P4 | Live `commit()` allows retroactive total-order insertion before compaction, while checkpoint suffix rejects it | MATERIAL BLOCKER | YES | Compaction changes legal mutation semantics; replay divergence risk | Chat 3 | Freeze monotonic live frontier; historical reconstruction is separate branch/rebuild mode; test before/after compaction. |
| P4 | Live commit requires baseline + entire `world.events`; no checkpoint+bounded-tail mutation path | MATERIAL BLOCKER | YES | Long-running world cannot truly discard prefix; eventual event-limit / working-set failure | Chat 3 | Commit from verified checkpoint + bounded tail; recompact tail periodically; prove equivalence to full reconstruction. |
| P4 | Arbitrary runtime JS reducer `Map` can change canonical state without a bound semantic reducer contract | MATERIAL BLOCKER | YES | Same event bytes can produce different persistent state/digest | Chat 3 | Bind reducer-family semantic ID/version to world/checkpoint/archive/domain contract; canonical replay fails on mismatch; conformance-test families. |
| P4 | `causes` wording could be read as authoritative dependency semantics | IMPORTANT NON-BLOCKER | YES | Consumer ambiguity / future duplicate scheduler | Chat 3 | Freeze v1 as provenance-only; no hidden admission/order scheduler. |
| P4 | `operationKey` can be misread as idempotency key | IMPORTANT NON-BLOCKER | YES | Incorrect client dedup semantics | Chat 3 | Define as semantic operation discriminator / EventId component; exact EventId retry is idempotency. |
| P4 | Preconditions need replay semantic freeze | IMPORTANT NON-BLOCKER | YES | Replay could be incorrectly re-adjudicated later | Chat 3 | Keep `preconditionStateDigest` admission-time only; replay accepted events without revalidation; add regression. |
| P4 | Checkpoint commitment after prefix discard is under-explained | IMPORTANT NON-BLOCKER | YES | Archive/lineage interpretation ambiguity | Chat 3 | State that validated checkpoint is canonical integrity commitment/snapshot for discarded prefix result/frontier/root; no signing framework required. |
| P3 | Prototype is rooted in historical P2 staging ancestor, not current certified main | IMPORTANT NON-BLOCKER | YES | Cannot call schema-0 prototype canonical/current-main certified | Chat 2 | Create/rebase `feature/p3-universe-skeleton` from `main@0d802f2...`; port/re-adjudicate prototype, then schema v1/corpus/cross-runtime. |
| P3 | System physical identity/address both use normalized absolute site; Sector remains computational partition | REJECTED concern / positive finding | YES | Prevents sector partition from renaming/rerolling systems | Chat 2 | Preserve design; add explicit positive/negative cross-sector metamorphic boundary tests before freeze. |
| P3 | Large-scale density field uses global fixed-octave interpolation but broader partition-artifact analysis is deferred | IMPORTANT NON-BLOCKER | YES | Potential spatial distribution artifacts | Chat 2 | Run spatial autocorrelation and boundary-artifact analysis before schema-v1 statistical freeze. |
| P3 | Unit/range/rounding semantics are not yet normative field-by-field | IMPORTANT NON-BLOCKER | YES | Future schema ambiguity / cross-runtime interpretation | Chat 2 | Freeze field units, ranges and rounding in schema v1. |
| P3 <-> P5 | P3 schema 0 emits radius/composition while P5 independently derives radius/composition | MATERIAL BLOCKER for freezing either conflicting schema; non-blocker for current research | YES | Duplicate canonical truth for planet bulk properties | Chat 2 + Chat 4, integration board adjudication | P3 keeps authoritative mass + coarse bulk prior; P5 owns detailed composition + canonical physical radius. Demote/remove P3 schema-0 radius before P3 v1 unless ownership is explicitly re-adjudicated. |
| P3 <-> P5 | Both phases expose an `equilibrium temperature` concept with different albedo semantics | MATERIAL BLOCKER for schema freeze | YES | Same semantic name could represent competing facts | Chat 2 + Chat 4 | P3 exposes insolation; if retaining Teq, name/define it as reference proxy with frozen reference albedo. P5 owns albedo-dependent planetary energy/climate. |
| P5 | Research model uses floating-point `Number`/`Math.*` throughout | IMPORTANT NON-BLOCKER now; promotion blocker for D3 | YES | Cross-runtime canonical determinism not demonstrated | Chat 4 | Continue research; before D3 promotion use deterministic quantized/fixed treatment or prove acceptable canonical numeric contract. |
| P5 | Rocky/ice/gas mass-radius proxies lack normative applicability domains and out-of-domain semantics | IMPORTANT NON-BLOCKER | YES | Scientific extrapolation can become misleading/canonical | Chat 4 | Define validity envelopes, classification domains and failure/fallback semantics before promotion. |
| P5 | Volatile, escape, greenhouse and geodynamic proxies are simplified | FOLLOW-UP / research debt | YES | Fidelity limitation | Chat 4 | Preserve honest Evidence Class/Fidelity labels; calibrate where promotion requires it. Do not punish useful labelled approximations. |
| P5 | Hydrosphere proxy lacks high-pressure/supercritical water regimes | IMPORTANT NON-BLOCKER | YES | Incorrect physical-state classification for extreme planets | Chat 4 | Add phase-regime treatment/explicit unsupported-domain handling before physical contract promotion. |
| P5 terrain | Terrain address is opaque string; neighboring/spherical topology and seams are not defined | IMPORTANT NON-BLOCKER now; promotion blocker | YES | Independent patches can disagree at seams/face edges; topology undefined | Chat 4 | Define spherical surface-address topology and add neighboring seam, face/corner equivalence, parent-child, refinement-order and REFINE/PROJECT/RECONCILE tests. |
| P4 -> P5 | P5 research document correctly defers canonical time/order/replay to P4 | REJECTED concern / positive finding | YES | No duplicate temporal authority currently | Chat 4 | Preserve boundary; later P5 transition semantics consume P4 event/time context. |

## P4 semantic decisions

### Live history model

Freeze the following model for P4 v1:

- canonical live commits advance a monotonic total-order frontier;
- a live commit at or before the current frontier is rejected;
- importing/rebuilding a historical complete event set is a separate reconstruction mode that may sort total history;
- retroactive mutation of an already-live lineage requires explicit branch/rebuild semantics, not an implicit `commit()` resort;
- compaction must not change this legality rule.

### Checkpoint-backed world

A long-running canonical world must be operable as:

`verified checkpoint + bounded ordered tail`

without the discarded prefix. The checkpoint commits to the discarded prefix's resulting state, state digest, order frontier and event/root commitment. Continued commit/replay uses that checkpoint plus tail; re-compaction advances the checkpoint and resets the bounded tail.

### Reducer authority

Event type/version alone is insufficient if the callback implementing that reducer can be swapped at runtime. Canonical reducer families need an explicit semantic contract identity/version bound to the persistent world/checkpoint/archive or equivalent domain semantic contract. Canonical replay rejects a registry that does not satisfy that binding.

No general plugin framework is required.

### Causes, operation key and preconditions

- `causes`: provenance only in P4 v1;
- `operationKey`: semantic operation discriminator and EventId input, not standalone idempotency key;
- exact EventId retry: idempotency mechanism;
- `preconditionStateDigest`: admission-time predicate only; no replay-time re-adjudication.

## P3 promotion decision

P3 is **READY FOR CANONICALIZATION**, not merge-ready.

The prototype has several strong properties worth preserving:

- P2 Universe/Entity identity is reused rather than reinvented;
- System Address and Entity stable key use the same normalized absolute site coordinate;
- Sector is marked as computational partition;
- global density sampling is bounded and does not require sibling/predecessor enumeration;
- direct-query dependency depth/derivation budgets are explicit;
- query-order and Node Worker digest agreement are already tested;
- scientific claims are explicitly prototype/approximation-scoped.

Next owner action is not a redesign. Chat 2 should root `feature/p3-universe-skeleton` in certified `main@0d802f2af87e7db4ba9553f11cc9914c93a3cebc`, port the good prototype, then finish schema v1, domain-version manifest binding, explicit unit/range/rounding tables, cross-sector metamorphic tests, larger spatial artifact/statistical tests, Golden P3 corpus, useful independent oracle coverage, exact-head cross-runtime evidence and adversarial review.

## P3 -> P5 authority decision

The current prototype/research overlap is resolved as follows for parallel work:

### P3 owns

planet identity, system/star relations, orbit/architecture, astronomical host facts, incident flux/insolation, formation/population mass, and a coarse bulk/formation prior.

### P5 owns

detailed composition/material fractions, physical mass-radius realization (with P3 mass as a hard input), density/gravity, interior/geodynamics, atmosphere, hydrosphere, albedo-dependent planetary energy/climate and terrain.

Therefore P3 schema-0 `radiusMilliEarth` should not be frozen into schema v1 as a competing canonical physical radius under the recommended architecture. P3 schema-0 `compositionClass` should become an explicitly named prior that P5 refines under a versioned compatibility mapping.

See `docs/integration/P3_P5_PLANETARY_INPUT_SNAPSHOT.md`.

## P5 research review

P5 should continue at full research speed. The causal pipeline is directionally strong and the scientific honesty matrix correctly separates mechanism evidence from implementation fidelity.

Do not freeze P5 yet. The most important research-to-canonical gaps are:

- deterministic treatment of floating-point canonical outputs;
- explicit mass-radius applicability domains and out-of-domain behavior;
- high-pressure/supercritical volatile/water regimes;
- stronger gas/ice giant physical parameterization;
- uncertainty-aware geodynamic treatment;
- spherical terrain topology;
- neighboring seam continuity;
- parent->child refinement stability;
- refinement-order independence;
- executable REFINE / PROJECT / RECONCILE invariants.

Current repeatability alone is insufficient terrain evidence because `surfaceAddress` is opaque and adjacent patches are not yet semantically related.

## Cross-phase status

- **P2 -> P3:** healthy architecture; P3 must now canonicalize from certified main and complete freeze evidence.
- **P2 -> P4:** P2 semantics healthy; P4 has a CI evidence contamination defect plus independent P4 semantic blockers.
- **P3 <-> P4:** no direct contradiction found; P4 remains domain-neutral and can reference P3 Entity Identities once P3 snapshot is canonical. Executable integration waits for stable heads.
- **P3 -> P5:** material duplicate-truth risk found and adjudicated before freeze; snapshot v0 defines the recommended ownership split.
- **P4 -> P5:** conceptual ownership is healthy: P4 owns time/replay/lineage, P5 owns planetary transitions. No P5 private canonical history is present.

## Actions by owner

### Chat 1 — P2 owner

- Treat P2 as CLOSED/FROZEN.
- Issue #5 is now administratively sealed and closed.
- Do not reopen P2 because of the P4 artifact contamination.
- Only re-enter P2 for a reproduced protocol defect.

### Chat 2 — P3 owner

- Create/rebase `feature/p3-universe-skeleton` from certified `main@0d802f2af87e7db4ba9553f11cc9914c93a3cebc`.
- Preserve normalized absolute System site in both Address and stable Entity key.
- Add explicit positive/negative cross-sector metamorphic tests.
- Run larger density/partition artifact validation.
- Freeze field units/ranges/rounding, schema v1 and domain versions.
- Adopt the P3 -> P5 snapshot: keep P3 mass and coarse bulk prior; do not freeze a competing P3 physical radius unless ownership is explicitly re-adjudicated.
- Then build Golden P3 corpus, independent oracle where useful, cross-runtime/exact-head/statistical evidence.

### Chat 3 — P4 owner

- Fix phase evidence isolation without weakening P2 aggregate.
- Enforce monotonic live frontier; separate historical reconstruction from live commit.
- Implement verified checkpoint + bounded-tail continued mutation and repeated re-compaction.
- Bind canonical reducer semantic contract/version; reject mismatched registry.
- Freeze `causes`, `operationKey`, precondition and checkpoint-commitment semantics described above.
- Rerun exact-head Foundation/P1/P2/P4 and close all material regressions before declaring integration-ready.

### Chat 4 — P5 owner

- Continue research; do not pretend P5 is integrated/frozen.
- Adapt research inputs toward the P3 -> P5 snapshot rather than rerolling P3-owned facts.
- Treat P3 mass as authoritative input; use P3 composition as prior; P5 owns detailed composition/radius.
- Strengthen terrain with topology/seam/refinement/PROJECT-RECONCILE properties.
- Keep floating-point and simplified scientific proxies research-only until deterministic/scientific promotion criteria are met.
- Preserve P4 temporal ownership for all future canonical planetary evolution.

## Integration recommendations

| Track | Recommendation | Reason |
| --- | --- | --- |
| P2 | MERGE READY / CLOSED | Already merged, exact-main certified and administratively sealed; remain frozen. |
| P3 | READY FOR CANONICALIZATION | Strong prototype, no core redesign needed; must re-root on certified main and freeze schema/evidence. |
| P4 | CONTINUE WITH MATERIAL FIXES | Evidence isolation, live-frontier/compaction, checkpoint-tail mutation and reducer-authority blockers. |
| P5 | CONTINUE | Healthy research architecture; promotion gaps are expected and explicitly non-canonical. |

P4 is **BLOCKED BY MATERIAL DEFECT** from an `INTEGRATION READY` label until its four material items are fixed and exact-head Foundation/P1/P2/P4 are all green.

## Parallelism recommendation

Continue P3 canonicalization, P4 remediation and P5 research in parallel.

Do **not** create a durable combined P3/P4/P5 feature branch. An ephemeral `integration/p3-p4` validation branch becomes valuable after:

1. P3 has a stable current-main canonicalization head; and
2. P4 closes the material replay/compaction/reducer/evidence blockers.

P5 research does not need to wait for either phase as long as it stays behind the P3/P5 input snapshot and does not create a private temporal authority.

The governing rule remains: **one owner for each canonical fact or protocol; many parallel consumers and researchers behind explicit contracts.**
