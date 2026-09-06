# V1X-12 governed intervention evidence

Lane: `PROMPT 12 / V1X-12`
Branch: `parallel/v1x-12-persistence-gameplay-intervention-2026-09-06`
Frozen base: `760c0c70bccb6afd7c7b07600c0f5be3f80e7b19` / tree `3324e6354b5ff1b90156d1693e6051595b6f1219`
Contract set: `OFU-V1X-CONTRACT-SET-2026-09-06.1`

## Production delta

V1X-12 adds a machine-owned facade over existing frozen/shared authorities rather than creating a second persistence or temporal authority.

- `v1x12.temporal.session-bridge` binds exactly to `ofu-p4-temporal-v1`, `ofu-v1-session-runtime-1`, `OFU-V1-SESSION`, `ofu-wave-iv-scale-runtime-3`, and `ofu-wave-iv-selection-1`.
- `v1x12.actions.intent-adapter` exposes a bounded catalog of `MEASURE`, `SAMPLE`, `EXPERIMENT`, `ECOLOGY_INTERVENTION`, and `BIOLOGICAL_SEEDING` only.
- Every intent binds selected canonical target identity/key, semantic scale, `v1.interaction.player-agency@1.0.0`, `v1.persistence.session@1.0.0`, authority class, and false canonical-mutation flags into a deterministic PX digest.
- Admission rechecks current target, scale, provider identity/version/authority and delegates domain capability admission to the existing `v1Session.validateAction` path.
- Commit delegates the only state mutation to `v1Session.submit`, which uses the existing P4 `v1.intervention.record@1` transition/reducer.
- Portable save/load/revisit delegates to the existing V1 session archive validation/replay path. Consequence visibility is a projection from replayed P4 player-overlay state, never from an invented UI state.

No P4 core, canonical P0-P6 model, shared registry, shared persistence module, global bootstrap, renderer, or central composer is changed.

## Journey oracle

Registered conformance test:

`node tests/v1x-12-persistence-gameplay-intervention/governed-action-journey.mjs`

The oracle is designed to exercise:

1. a biosphere-context `ECOLOGY_INTERVENTION` admitted at Human scale;
2. exact intent/admission/provider/authority binding and P4 event/state-digest advance;
3. replay-visible intervention consequence with canonical mutation explicitly false;
4. 70 additional governed measurements so the existing P4-backed session crosses its compaction threshold;
5. checkpoint presence plus bounded retained event tail;
6. portable session export, navigation away, import/replay, restored canonical selection and Human scale;
7. byte-identical re-export and equal replayed P4 state digest;
8. negative rejection of unsupported action type, extra fact-like parameters, stale scale-bound intent, tampered intent digest, tampered portable bytes, and an unsupported semantic-scale action.

## Evidence state

Checkpoint `a3f76135244669d609b748c8ecb7259931ab955f` introduced the production adapters and additive component descriptor.

Checkpoint `6abd04a7216739a522248dedc2c41eb171501f94` added the LANE_TARGETED journey oracle and conformance descriptor.

Hosted GitHub Actions run `34032191408` executed against exact checkpoint-2 SHA and passed `V1X Lane Ownership`, including exact source verification and the definitive common-base/ownership oracle. This run does **not** execute the new LANE_TARGETED semantic journey and is therefore not used to claim `CI_CERTIFIED`.

Local staging validation performed before repository writes:

- `node --check` on `session-bridge.js`: PASS
- `node --check` on `intent-adapter.js`: PASS
- `node --check` on `governed-action-journey.mjs`: PASS
- JSON parse/shape preparation for component and conformance descriptors: PASS before upload; canonical repository validators remain the integration oracle.

The execution environment available to this lane could not materialize a full repository checkout because direct container DNS/network access to GitHub was unavailable. Therefore the semantic journey is `REGISTERED_NOT_EXECUTED` here; no fabricated PASS result is recorded.

## Authority and fidelity

New action/consequence state is `MODEL_DERIVED_SIMULATION`, matching the pre-existing player-agency provider and P4-backed player overlay. The portable persistence provider remains `DERIVED`. The adapter introduces no `CANONICAL_PROVEN` claim, no new scientific model, and no presentation-to-evidence promotion. Every returned intervention/consequence witness carries `canonicalMutation=false` and `canonicalP6Mutation=false`. Physical-device status remains `NOT_VERIFIED`.

## Resource statement

No new streaming/cache/resource authority is introduced. Portable bytes remain subject to the existing V1 session `MAX_BYTES = 1 MiB`; intent and parameter copies use stricter PX data budgets. The journey oracle explicitly checks the save remains below the existing bound and that post-compaction tail size is bounded. These are structural/boundedness assertions, not `MEASURED_RUNTIME_EVIDENCE`; no runtime-performance claim is made.

## Certification boundary

Current lane claim: `IMPLEMENTED_UNCERTIFIED`.

Promotion to `CI_CERTIFIED` requires the registered LANE_TARGETED journey to execute successfully against the exact final lane HEAD. A passing ownership workflow alone is insufficient, and no founder acceptance is implied.
