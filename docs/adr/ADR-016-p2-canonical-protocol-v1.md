# ADR-016 — P2 Canonical Protocol v1

**Status:** Accepted for P2 conformance review  
**Date:** 2026-09-02

## Decision

P2 adopts OFU-CBV-1 as the bounded canonical value encoding, Canonical Address v1 as the typed query-address format, HMAC-SHA-256 with OFU-CBV framing as deterministic derivation, and Semantic/Implementation/Conformance manifests as separate concepts. Universe Identity binds the 32-byte master seed and Semantic Generator Manifest hash. Canonical floating point is excluded.

## Rationale

A purpose-built TLV was selected over deterministic CBOR because the P2 admitted domain is intentionally small and can be completely audited, bounded and independently reimplemented without an external runtime/build dependency. HMAC-SHA-256 gives a standard PRF construction with explicit framing and random access. Semantic manifest separation permits different implementation bytes to realize the same universe.

## Compatibility

These are version-1 byte contracts. A change that alters admitted values, canonical bytes, address bytes, Universe Identity or derivation output requires explicit version/ADR treatment and Golden Universe Corpus evolution. P1 bytes are prototype evidence and are not silently reinterpreted as P2 bytes.
