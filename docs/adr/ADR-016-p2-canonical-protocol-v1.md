# ADR-016 — P2 Canonical Protocol v1

**Status:** Accepted for P2 closure candidate  
**Date:** 2026-09-02

## Decision

P2 adopts OFU-CBV-1, Canonical Address v1, HMAC-SHA-256 addressed derivation, Semantic Generator Manifest hashing, Universe Identity and Canonical Entity Identity as specified in `docs/P2_PROTOCOL.md`. Canonical floating point is excluded.

The final candidate freezes a 1,048,576-byte complete canonical-value limit, a 1,048,572-byte byte-string payload limit, a global 100,000-node traversal budget shared by map keys and values, strict minimal ULEB64, and explicit address limits of 1–64 segments, 1,024-byte namespace text, 4,096-byte byte segments and 65,536 total address bytes.

## Review corrections before freeze

1. SINT decoding accepts only the odd negative image and the integer encoder/decoder share u64/i64 domains.
2. Map keys no longer receive a fresh traversal state; keys and values consume one global node/byte budget.
3. The prior JavaScript 255-byte address segment and wider Python behavior are replaced by one documented 4,096-byte segment bound plus a total-address bound in both implementations.
4. Node differential dispatch consumes explicit oracle address cases and fails on unknown kinds.
5. Encode and decode now share one complete-byte domain; composites cannot bypass the decoder's 1 MiB input bound.
6. Fixed-point half-to-even no longer uses truncated `scale/2`; it compares twice the absolute remainder against the scale, including odd scales correctly.

These are pre-freeze corrections. The reference Semantic Manifest Hash, Universe Identity and generated Kernel Digest remain unchanged. The Golden Universe Corpus digest changes intentionally because its normative coverage and limit declarations are expanded.

## Rationale

A compact purpose-built TLV keeps the P2 semantic domain completely auditable and independently implementable without an external serialization dependency. Standard HMAC-SHA-256 supplies keyed deterministic derivation with unambiguous canonical framing. Semantic/implementation/conformance separation permits different implementation bytes to realize the same semantic universe.

## Compatibility

These are version-1 byte contracts. After P2 closure, any change to admitted values, canonical bytes, address bytes, identity inputs or derivation output requires explicit version/ADR and Golden Corpus evolution. P1 prototype bytes are not silently reinterpreted as P2 bytes.
