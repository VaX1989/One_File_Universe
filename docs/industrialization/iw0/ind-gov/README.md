# IND-GOV-A — Minimum Implementation-Independent Specification Slice

**Authority:** INDUSTRIALIZATION_SPEC_CANDIDATE_ONLY  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`  
**Control head at activation:** `fa88f7cec101a52d07916a0fdd3927c482a6f188`  
**Frozen R6 base:** `61f43071ad389d14b0df0d5fbd2c54ba5d829a0e`  
**Machine index:** `docs/industrialization/iw0/ind-gov/NORMATIVE_PROTOCOL_INDEX.json`

This lane harvests existing proven invariants. It does not change P2/P4 semantics, promote science, define a public SDK, or transfer authority from the frozen source/contracts/tests.

## Decision

The minimum slice ready to be specified independently of JavaScript consists of:

1. **OFU-CBV-1** admitted value domain, tags, minimal-uLEB encoding, canonical map ordering, bounds and canonicality equations.
2. **Unicode 15.1 frozen profile** `ofu-unicode-15.1.0-v1`, including the 707-range commitment and fail-closed UTF-8/NFC/repertoire rules.
3. **Canonical Address v1** wire format, typed segments, bounds and rejection rules.
4. **Semantic Generator Manifest v1** exact schema and semantic-only hashing boundary.
5. **Universe Identity and universe-scoped Entity Identity** domain-separated commitments.
6. **Addressed HMAC-SHA-256 derivation** with explicit domain/property/address/manifest/counter separation.
7. **Deterministic numeric v1**: checked i64 add, exact fixed multiply with ties-to-even, and exact u64 integer square root.
8. **P4 canonical time and event ordering**.
9. **P4 lineage and monotonic live frontier semantics**, keeping historical reconstruction distinct from live admission.
10. **Exact P4 transition-contract binding**.
Checkpoint/compaction and archive integrity are **not** part of this G0A minimum. They are retained as `DRAFT_ONLY` current-authority material because structural integrity and replay self-consistency do not authenticate historical origin/freshness or establish full semantic trust in imported state.

A future second implementation can implement the ten minimum semantics without copying the current JavaScript object model, callbacks, runtime method names, cache policy, renderer vocabulary or storage backends.

## Explicit non-freezes

The following are not mature enough to freeze:

| Surface | Classification | Why it is not normative now |
| --- | --- | --- |
| PX authority/provenance envelope schema | DRAFT_ONLY | Authority separation is valuable, but the exact JSON/JS record and evidence vocabulary are not proven across independent consumers. |
| Query/provider API and registry | REQUIRES_MORE_CONSUMERS | Current request/envelope/bind/invoke shapes are implementation-facing JS APIs. |
| Runtime budgets and adaptive scheduler | KEEP_PRIVATE_FOR_NOW | Queue/cache/materialization ceilings and HOT/WARM/COLD policy are runtime/resource policy. |
| P4 checkpoint/compaction public trust claim | DRAFT_ONLY | Current checks establish integrity/self-consistency, not authenticated historical provenance/freshness or full semantic trust. |
| P4 archive public trust/import-export claim | DRAFT_ONLY | Canonical integrity does not authenticate origin/freshness; archive import/export is excluded from the G0A public minimum. |
| Generic persistence/provider interface | REQUIRES_MORE_CONSUMERS | P4 temporal authority is not a host-neutral persistence ABI. |
| P1 portable-save JSON | KEEP_PRIVATE_FOR_NOW | Legacy `ofu-canonical-v1`/JSON model predates P2/P4 semantics and must not become the future standard accidentally. |
| REFINE/PROJECT/RECONCILE payload schemas | REQUIRES_MORE_PRODUCT_EVIDENCE | The operations are architectural; current spatial/matter/observable payloads are one implementation. |
| PX claim/extension namespace allocation | REQUIRES_MORE_CONSUMERS | Current prefix ownership and binding lifecycle are registry mechanisms, not a proven public protocol. |
| Scientific evidence-class vocabulary | DRAFT_ONLY | Preserve non-promotion boundaries, but do not freeze current product/governance labels as wire semantics. |

## Rejection model

Cross-language conformance should require agreement on **accept versus reject** for the normative slice, while current JavaScript exception strings remain informative.

The implementation-independent rejection classes are:

- domain/type rejection;
- range/overflow rejection;
- non-minimal/alias rejection;
- truncated/trailing-data rejection;
- text-profile rejection;
- unknown version/tag/field rejection;
- resource-limit rejection;
- identity/lineage mismatch;
- order/frontier violation;
- transition mismatch;
- integrity/precondition failure.

Numeric error codes are deliberately not assigned here. That would invent ABI semantics not yet proven by the repository.

## Compatibility and versioning

The currently proven compatibility model is intentionally conservative:

- `ofu-cbv-1`: exact version, fail closed;
- `ofu-unicode-15.1.0-v1`: exact profile, fail closed;
- Canonical Address v1: unknown version rejects;
- Semantic Manifest v1: exact schema, unknown/missing fields reject;
- `ofu-p4-temporal-v1`: exact temporal protocol;
- P4 transition compatibility: `exact` only;
- checkpoint schema 2 and archive schema 2: exact schema plus transition/integrity checks.

No capability negotiation, version ranges, downgrade protocol, migration negotiation or extension negotiation is invented by this lane.

## Change-control and deprecation principles

The harvest supports four governance rules without creating a new protocol:

1. no silent semantic reinterpretation under an existing frozen identifier;
2. canonical-output-changing P2 evolution requires explicit protocol/profile/manifest evolution;
3. persisted P4 interpretation remains bound to its exact transition descriptor;
4. presentation/runtime-only changes must not manufacture new canonical identity.

Public deprecation windows, registry lifecycle and generic migration ABI remain future work.

## Adjudication items

### ADJ-001 — Legacy save naming/model

`src/persistence/save.js` uses `generatorManifestHash`, `ofu-canonical-v1`, safe-number event data and sequential JSON events, while frozen P2/P4 use `semanticManifestHash`, OFU-CBV-1 and the P4 temporal/archive model.

**Disposition:** preserve as legacy compatibility evidence; do not standardize it.

### ADJ-002 — P4 archive versus generic persistence API

P4 archive v2 semantics are internally frozen, but that does not prove the current JS API/container should become a universal persistence interface.

**Disposition:** retain checkpoint/archive integrity invariants as `DRAFT_ONLY` current-authority evidence; exclude them from the G0A minimum public/normative slice until later trust/authentication/provenance evidence exists.

### ADJ-003 — PX authority vocabulary

The PX contracts correctly prevent presentation/measurement from silently acquiring canonical authority, but their exact labels and record shapes are not yet an implementation-independent wire protocol.

**Disposition:** preserve the authority boundary; keep schema/vocabulary draft-only.

### ADJ-004 — Cross-scale payload shape

`REFINE`, `PROJECT`, and `RECONCILE` are accepted architectural operations, but the current implementation binds them to specific spatial, material and observable structures.

**Disposition:** do not freeze those payloads until multiple domains and an external consumer expose the common minimum.

## Source-to-spec evidence

The machine index records exact blob SHAs for the source evidence. The core chain is:

- P2: `docs/P2_PROTOCOL.md` + `src/kernel/p2-*.js` + `tests/vectors/golden-universe-corpus-v1.json` + `tests/p2/run-p2-tests.mjs` + independent `tools/p2_oracle.py`.
- P4: `docs/P4_TEMPORAL_CONTRACT.md` + `src/temporal/p4-temporal.js` + temporal semantic-closure/checkpoint/archive tests + P2/P4 integration tests.
- Non-freeze evidence: PX contracts/registry/cross-scale, current runtime contracts and the legacy portable-save implementation.

## Gate result

**IND-GOV-A repair disposition: READY_FOR_CONTROL_CONVERGENCE.**

The lane now identifies exactly what a second implementation may reproduce from behavior/bytes and exactly what must remain unfrozen. This does **not** pass G0A by itself. G0A still requires the declared sibling evidence from `IND-CONF-A` and `IND-BRIDGE-A`, followed by `GATE-G0A-AUDIT`.
