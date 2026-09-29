# IND-CONF-A — Wave-0 language-independent conformance corpus

**Prompt:** `IND-CONF-A`  
**Epoch:** `OFU-POST-M0-DUAL-TRACK-WAVE0-2026-09-18-61F43071`  
**Semantic surface:** `CONFORMANCE_CORPUS`  
**Authority:** additive conformance evidence only; no production, renderer, scientific, persistence, runtime or release authority.

## Frozen scope

This packet freezes the smallest implementation-independent corpus that can be consumed without reading JavaScript source:

- OFU-CBV-1 positive canonical bytes and byte round-trips;
- malformed/non-canonical byte rejection expectations;
- Canonical Address v1 exact bytes, parsing, limits and rejection expectations;
- Semantic Generator Manifest hash, Universe Identity and universe-scoped Entity Identity vectors;
- addressed derivation exact outputs and domain/property/counter separation;
- P2 integer, Unicode/NFC, collection, depth/node/byte and schema boundary rejection patterns;
- a deliberately narrow P4 slice: lineage ID, Event IDs, total order, self-contained live-frontier admission scenarios and core transition-contract digest as exact implementation-independent expectations;
- P4 live-frontier admission is frozen through explicit language-neutral scenarios covering initial/strict advance, same-time higher EventId admission, exact-frontier duplicate/no-op, same-time lower EventId rejection and older-event rejection.
- P4 replay permutation, deduplication, checkpoint-suffix equivalence, archive round-trip, checkpoint authority, archive ordering/duplication and precondition behavior remain behavioral expectations; checkpoint/archive evidence remains current-authority regression only.

It intentionally does **not** freeze JavaScript object mechanics as a public cross-language API, implementation exception strings, renderer/product behavior, scientific truth, full P4 persistence/state representation, provider/runtime semantics, or a C/native ABI.

## Corpus files

`conformance/iw0/p2-vectors.json` and `conformance/iw0/p4-vectors.json` are the frozen vector payloads. `conformance/iw0/manifest.json` binds their exact byte length and SHA-256 and records the source blobs from the active epoch. `conformance/iw0/CORPUS.sha256` repeats the overall digest for simple tooling.

The overall digest is:

```text
SHA256(concat(UTF8(path), 0x00, file_bytes, 0x00) for files in lexical path order)
```

The manifest is excluded from its own corpus digest to avoid recursive identity. Changing any vector byte changes the digest.

## Rejection taxonomy

Vectors use `ofu-ind-conf-rejection-class-v1`. A rejection class is a language-independent expectation attached to an input, not a claim that the current JavaScript API exposes structured error codes. Current JS and Python authority runners prove fail-closed behavior for the vector. Future implementations must map their own error surfaces to the corpus class without depending on current exception wording.

Exact exception messages are explicitly non-normative.

## Independence model

Three distinct evidence types are kept separate:

1. **Frozen corpus facts** — committed inputs, expected bytes/digests, expected rejection classes and behavioral invariants.
2. **JS authority differential** — `tools/industrialization/ind-conf/run-js-authority.mjs` executes the current P2/P4 implementation against the frozen corpus and narrow P4 behavioral invariants.
3. **Independent Python oracle** — `tools/industrialization/ind-conf/run-python-oracle.py` consumes the same files through the pre-existing independent P2 oracle, independently recomputes P4 lineage/Event/order/transition digests, and applies a minimal independent frontier-admission state machine using only the language-neutral order key `(seconds, micros, EventId bytes)`. It does not import or execute the JavaScript P4 implementation.

Agreement of the JS runner with itself is therefore not represented as cross-language proof. The machine-readable split is recorded in `G0A_CONFORMANCE_SCOPE_CLASSIFICATION.json`: P2 plus narrow P4 lineage/Event/order/transition/live-frontier-admission evidence is eligible as independent G0A conformance evidence, while checkpoint/archive behavior is explicitly `CURRENT_AUTHORITY_REGRESSION_ONLY`. The Python oracle implements only the minimal order-key/frontier admission model needed for G0A; it is not a checkpoint/archive or full temporal-state reducer.

## Direct commands

No `package.json` or workflow changes are required or permitted by this lane.

```bash
node tools/industrialization/ind-conf/run-js-authority.mjs
python3 tools/industrialization/ind-conf/run-python-oracle.py
node tests/industrialization/ind-conf/conformance-corpus-tests.mjs
npm run test:p2
npm run test:p4
```

The combined industrialization test invokes both corpus runners directly and checks that both agree on the exact corpus digest.

## Provenance boundary

The manifest records exact source blobs from the active Wave-0 control head. Those references establish what was harvested; they do not transfer technical authority to this corpus. If later `IND-GOV-A` adjudication determines that a candidate semantic is not mature enough to freeze, the control plane must supersede the affected vector set rather than silently reinterpret an existing digest.

## Wave-0 repair classification

Independent audit failure `G0A-LIVE-FRONTIER-INDEPENDENT-EVIDENCE-GAP` requires a versioned corpus revision. P4 vectors are revised to `ofu-ind-conf-p4-corpus-v2`; the previous corpus digest `2b13e4c47c254e418543410806ec5aaed7650b60e2e653c75b602b9c0735b65b` is superseded by `d92b43afb8a7deeaed4b0c3ee13b73bad344b196132c35433b66360c0b0772fc`. Fresh exact-subject execution is required before this repair can be converged. Checkpoint/archive behavior remains `CURRENT_AUTHORITY_REGRESSION_ONLY`.
