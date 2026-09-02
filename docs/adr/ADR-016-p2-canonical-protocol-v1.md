# ADR-016 — P2 Canonical Protocol v1

**Status:** Accepted for P2 freeze candidate  
**Date:** 2026-09-02

## Decision

P2 adopts OFU-CBV-1, frozen Unicode profile `ofu-unicode-15.1.0-v1`, Canonical Address v1, HMAC-SHA-256 addressed derivation, strict Semantic Generator Manifest v1 hashing, Universe Identity and universe-scoped Canonical Entity Identity as specified in `docs/P2_PROTOCOL.md`. Canonical floating point is excluded.

The final candidate freezes a 1,048,576-byte complete canonical-value limit, a 1,048,572-byte byte-string payload limit, a global 100,000-node traversal budget shared by map keys and values, strict minimal ULEB64, and explicit address limits of 1–64 segments, 1,024-byte namespace text, 4,096-byte byte segments and 65,536 total address bytes.

## Pre-freeze corrections

1. SINT decoding accepts only the odd negative image and integer encode/decode share u64/i64 domains.
2. Map keys and values consume one shared traversal state.
3. Address constructor, parser and oracle share the 4,096-byte byte-segment and 65,536-byte total-address bounds.
4. Oracle case dispatch consumes every declared case kind and fails on unknown kinds.
5. Encode and decode share one complete-byte domain.
6. Fixed-point half-to-even compares twice the absolute remainder against the scale, including odd scales correctly, and now checks i64 output range.
7. Unicode admission is frozen to 707 Unicode 15.1 assigned scalar ranges; official Unicode 15.1 normalization data certifies host NFC behavior.
8. Canonical arrays are dense own numeric data descriptors and no longer execute user/ambient array iterators or array element accessors.
9. Semantic Generator Manifest v1 is a strict semantic-only schema; unknown runtime/build fields fail closed.
10. Canonical Entity Identity binds Universe Identity, preventing accidental aliases between universes by construction.
11. Derivation accepts an exact argument set, validates sizes/types/u64 counter and requires Canonical Address v1 bytes.
12. P1's historical runtime object is named `P1_PROTOTYPE_MANIFEST`, avoiding collision with the P2 Semantic Generator Manifest.

## Rationale

These decisions close irreversible identity, canonical-byte, Unicode-stability and API-framing risks while keeping P2 deliberately small. A purpose-built TLV remains independently implementable without an external serialization dependency. Standard HMAC-SHA-256 supplies deterministic keyed derivation with unambiguous canonical framing. Semantic/implementation/conformance separation permits different implementation bytes to realize the same semantic universe.

Universe-scoped entity identity is preferred over a universe-local raw identifier because OFU gains no present architectural advantage from allowing standalone cross-universe aliases, while binding the universe prevents future save/event/reference callers from accidentally omitting scope.

## Compatibility

These are version-1 byte contracts. After P2 closure, any change to admitted values, frozen Unicode repertoire, canonical bytes, address bytes, identity inputs, strict manifest semantics or derivation output requires explicit version/ADR and Golden Corpus evolution. P1 prototype bytes are not silently reinterpreted as P2 bytes.
