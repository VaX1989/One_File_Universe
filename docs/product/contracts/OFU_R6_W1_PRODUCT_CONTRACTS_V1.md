# OFU R6/W1 Product Contracts v1

Status: additive contract freeze for `PROD-W1-CONTRACTS`.

## Scope

This contract family is the shared boundary between Scientific Fingerprint/provenance work and Atlas/saved-observation work. It adds references only. It does not change P2 identity, P4 temporal authority, scientific status, selection ownership, camera ownership, renderer composition, or persistence semantics.

The normative runtime contract is `src/product/contracts/w1-observation-contracts.js`.

## Authority harvest

The current scientific state exposes canonical identity/astronomy, model-derived physical/environmental state, explicit UNKNOWN domains, deterministic scientific hashes, and a separate `PRESENTATION_ONLY` representation profile. W1 preserves those labels; it does not infer stronger authority from a digest.

The current P4 temporal contract already owns lineage, event ordering, checkpoints and state digests. A W1 snapshot bookmark therefore stores a `P4_STATE_REF`; it never serializes a second mutable world snapshot.

The current selection seam is `ofu-wave-iv-selection-1`. Camera and scale-return information is presentation authority. W1 therefore stores canonical selection identity separately from an optional `PRESENTATION_ONLY` return reference and never stores renderer, scene-provider, DOM, mesh, camera-object, or host object identity.

## Contract family

- `ofu-r6-w1-canonical-entity-ref-1`: universe identity string + canonical entity digest + normalized named canonical key.
- `ofu-r6-w1-p4-state-ref-1`: exact P4 universe/lineage/state-digest reference plus optional checkpoint and frontier.
- `ofu-r6-w1-scientific-fingerprint-1`: compact scientific hashes, source-model provenance and per-domain authority labels.
- `ofu-r6-w1-scientific-fingerprint-ref-1`: compact link from Atlas to an already materialized fingerprint context.
- `ofu-r6-w1-return-ref-1`: optional selection/scale return hint, permanently labeled `PRESENTATION_ONLY` in v1.
- `ofu-r6-w1-saved-observation-1`: `PLACE`, `OBSERVATION`, or `SNAPSHOT` bookmark tying the references together. `SNAPSHOT` requires a P4 state reference.

All v1 readers reject unsupported contracts, schema versions, unknown fields, malformed digests, non-canonical serialization and invalid authority values. UNKNOWN fingerprints cannot assert scientific hashes.

## Deliberately unresolved

W1 v1 intentionally does not freeze: fingerprint scoring or UI layout; provenance graph topology; evidence citation UX; renderer/scene-provider identity; camera pose serialization; DOM or host-engine objects; screenshot/image payloads; Atlas collection/index/search format; labels beyond a single optional bookmark label; P1/P4 archive embedding; or new scientific claims. Those belong to successor lanes and require a versioned additive change if they cross this boundary.

`ANALYSIS_ONLY` is available as an envelope authority label for successor analysis products. It is explicitly non-canonical and cannot override an upstream scientific authority classification.

## Compatibility rule

Version 1 is exact and fail-closed. Producers may construct v1 records from richer runtime objects, but only the fields defined by the contract may cross the boundary. Future schema versions are additive successors; v1 readers reject them until explicitly upgraded rather than guessing compatibility.
