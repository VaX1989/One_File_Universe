# IND-SEC-B — Post-G0A hostile-input threat model

Status: SECURITY REGRESSION PACKET — NO SEMANTIC AUTHORITY TRANSFER  
Prompt: `IND-SEC-B`  
Gate dependency: `G0A_MINIMUM_NORMATIVE_SLICE = PASS`

## 1. Security boundary used by this lane

This lane converts the accepted attack inventory into executable rejection witnesses. It does **not** enlarge the normative slice.

The gating security surface is exactly the G0A minimum already accepted by governance and conformance:

- P2 CBV1 value/byte domain and parser bounds;
- frozen Unicode 15.1 profile and NFC wire canonicality;
- Canonical Address v1;
- Semantic Generator Manifest v1;
- Universe/Entity identity;
- HMAC-SHA-256 derivation arguments and domain separation;
- checked P2 numeric operations;
- P4 canonical time/EventId/total order;
- P4 lineage and live-frontier admission;
- exact P4 transition binding.

Checkpoint/compaction/archive trust, generic provider/query, scheduler/runtime policy, persistence durability and renderer/product state are not promoted by these tests.

## 2. Gating threat classes

The machine-readable corpus at `security/iw0/ind-sec-b/hostile-input-corpus-v1.json` assigns a stable regression fingerprint to every gating attack case. The test runner requires every declared fingerprint to execute exactly as a rejection witness.

Covered classes:

1. malformed tags, versions and structural fields;
2. overlong/non-minimal/overflowing integer encodings;
3. byte, text, collection, traversal and nesting exhaustion;
4. Unicode malformed scalar/UTF-8 and non-NFC wire aliases;
5. Canonical Address version/tag/count/length/trailing-byte attacks;
6. plain-object/accessor/prototype-style input hazards;
7. Manifest unknown-version/unknown-field attacks;
8. identity and derivation length/range failures;
9. checked numeric overflow;
10. P4 time, target/cause-count and duplicate-ID attacks;
11. historical event-count exhaustion;
12. cross-universe/cross-lineage authority escalation;
13. live retroactive-history and false-precondition admission;
14. transition schema/SemVer/compatibility/duplicate-family attacks.

Positive maximum-bound witnesses are retained where practical so security hardening cannot silently shrink already-valid inputs.

## 3. Deterministic fuzz policy

Four fixed seeds are used. CBV mutation and Canonical Address mutation apply bit-flip, truncation, appended-byte and inserted overlong-varint material. A mutated byte stream may either reject or, if accepted, must round-trip byte-identically through the authoritative canonical encoder.

P4 frontier fuzz constructs same-time event pairs, orders them by the authoritative total order, proves increasing admission, and then proves retroactive re-admission rejection. Exact retry remains a duplicate no-op.

Fuzzing is bounded and deterministic. It is regression/falsification evidence, not a claim of exhaustive security proof.

## 4. Authority and trust invariants

The corpus preserves these distinctions:

- canonical integrity is not archive authenticity;
- a valid digest is not provenance or freshness attestation;
- P4 `causes` are provenance/reference links, not independent authority proof;
- historical replay and live admission are distinct operations;
- provider-declared budgets are not a host resource sandbox;
- cancellation/stale-result semantics must be explicitly designed before they can become a public provider/query contract.

## 5. Explicit non-gating residual debt

The corpus records, but does not normatively freeze, the following current risks:

- `SEC-B-DEBT-P2-UNHEX-SIZE` — exported implementation helper `P2.unhex` has no explicit size cap; it is not in the G0A normative slice or candidate headless public seam.
- `SEC-B-DEBT-P4-SCHEDULE-COUNT` — `P4.schedule` has no explicit collection-count bound; scheduler/runtime policy is not G0A normative authority.
- `SEC-B-DEBT-P4-ARCHIVE-AUTHENTICITY` — checkpoint/archive integrity does not authenticate origin or freshness; these surfaces remain `DRAFT_ONLY`.
- `SEC-B-DEBT-PX-COOPERATIVE-BUDGET` — provider metering only constrains declared `consume()` accounting and is not CPU/memory isolation.
- `SEC-B-DEBT-PX-CANCEL-STALE` — generic provider/query cancellation and stale-generation rejection are not frozen yet.
- `SEC-B-DEBT-P1-OPTIONAL-EXPECTED-IDENTITY` — P1 portable-save import permits callers to omit expected seed/manifest binding; separate legacy trust-boundary debt.
- `SEC-B-DEBT-P4-CAUSES-PROVENANCE` — cause identifiers remain unverified provenance references by design.

None of these residuals is treated as a G0A regression, and none is silently standardized by this lane.

## 6. Failure handling

A failing explicit corpus case reports its stable `SEC-B-*` fingerprint. Repairs must move forward through the canonical semantic owner if fixing the failure would touch P2/P4 or another shared authority surface. This lane must not weaken a rejection witness, broaden a public API, or edit canonical semantics to make security tests pass.
