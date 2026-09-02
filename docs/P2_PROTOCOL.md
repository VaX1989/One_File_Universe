# OFU-CBV-1 and Canonical Address v1

**Status:** P2 normative protocol candidate  
**Scope:** deterministic authority layer only

## Canonical value domain

OFU-CBV-1 admits only `null`, booleans, unsigned integers in `[0, 2^64-1]`, negative signed integers in `[-2^63, -1]`, byte strings, Unicode text, arrays, and string-keyed plain maps. JavaScript `Number` input is admitted only when it is a safe integer and is interpreted as the corresponding mathematical integer. Floating point, `undefined`, functions, symbols, accessors, arbitrary prototypes and cyclic graphs are outside the domain.

| Type | Tag |
| --- | ---: |
| null | `0x00` |
| false | `0x01` |
| true | `0x02` |
| negative signed integer | `0x10` |
| unsigned integer | `0x11` |
| byte string | `0x20` |
| text | `0x21` |
| array | `0x30` |
| map | `0x31` |

Lengths and integer payloads use minimal unsigned LEB128 restricted to u64. A ten-byte representation is valid only when its tenth byte contributes at most bit 63. Overlong, overflowing, truncated and non-minimal encodings are rejected. Negative integers use the odd ZigZag image `(-x * 2) - 1`; non-negative integers use `UINT`, so every admitted integer has exactly one representation.

Text is NFC-normalized before UTF-8 encoding. Lone UTF-16 surrogates are rejected. Decode uses fatal UTF-8 and rejects text that is not already NFC. Map source keys that NFC-normalize to the same key are rejected. Entries are sorted lexicographically by complete canonical encoded key bytes and must be strictly increasing when decoded. Map keys and values consume the same traversal budget.

## Resource bounds

| Bound | Value |
| --- | ---: |
| Complete encoded value | 1,048,576 bytes |
| Byte-string payload | 1,048,572 bytes |
| UTF-8 text payload | 262,144 bytes |
| Array items | 65,536 |
| Map pairs | 65,536 |
| Traversal nodes | 100,000 |
| Nesting depth | 32 |

The top-level maximum byte string encodes to exactly 1,048,576 bytes. Composite encoding is charged against the same total-byte budget, so the encoder cannot produce a canonical value that the decoder rejects solely because of the global input limit. Root is depth 0; depth 32 is admitted and depth 33 is rejected. Root, keys and values all count as nodes.

## Canonical Address v1

Addresses begin with ASCII `OFUA`, version `0x01`, then a minimal-ULEB segment count from 1 through 64.

| Segment | Tag | Payload |
| --- | ---: | --- |
| namespace | `0x01` | minimal ULEB length + NFC UTF-8 |
| u64 | `0x02` | exactly 8-byte unsigned big-endian |
| i64 | `0x03` | exactly 8-byte two's-complement big-endian |
| bytes | `0x04` | minimal ULEB length + raw bytes |

| Address bound | Value |
| --- | ---: |
| Segments | 64 |
| Namespace UTF-8 bytes | 1,024 |
| Bytes-segment payload | 4,096 bytes |
| Complete address | 65,536 bytes |

The 4,096-byte byte-segment bound provides room for future typed local coordinates/opaque identifiers while remaining bounded; the independent 65,536-byte total-address cap prevents aggregate amplification. Parser and constructor share the same limits and reject unsupported versions, unknown tags, non-minimal lengths, invalid/non-NFC text and trailing bytes.

## Semantic Generator Manifest

Canonical manifest bytes are `OFU-CBV-1(manifest)`. The Semantic Manifest Hash is SHA-256 of those bytes. Semantic manifest content includes the canonical protocol/address/numeric contract versions, generator suite, genesis/law configuration and semantic subsystem versions. Browser/runtime metadata, benchmark observations, rendering capability, implementation bytes and build timestamps are excluded.

## Universe Identity

Descriptor:

`OFU-CBV-1({ canonicalProtocolVersion, masterSeed, semanticManifestHash })`

Digest:

`SHA-256(UTF8("OFU-UNIVERSE-v1\0") || descriptor)`

The seed and Semantic Manifest hash are exactly 32 bytes. This establishes deterministic stable identity based on SHA-256 collision resistance; it is not a secrecy or unpredictability claim.

## Canonical Entity Identity

Descriptor:

`OFU-CBV-1({ namespace, stableKey })`

Digest:

`SHA-256(UTF8("OFU-ENTITY-v1\0") || descriptor)`

Current location, containment path, ownership, `QueryContext` and `ModelRegime` are not implicitly permanent identity. Future domains may define identity-bearing stable keys explicitly, but mutable observation context is never silently promoted into identity.

## Addressed derivation

Message:

`OFU-CBV-1(["OFU-DERIVE-v1", semanticManifestHash, domain, addressBytes, property, counter])`

Output:

`HMAC-SHA-256(masterSeed, message)`

Seed and manifest hash are exactly 32 bytes. `addressBytes` is an opaque byte-string derivation component capped at 65,536 bytes; Canonical Address v1 is the normative query-address constructor. Every variable-length field is canonically framed inside OFU-CBV-1, avoiding concatenation ambiguity. Domain/property/address/manifest/counter separation is regression-tested. HMAC provides standard keyed deterministic derivation; P2 does not assume every user seed is secret or high entropy.

## Deterministic numeric primitives

P2 includes checked i64 addition; fixed-point multiplication with positive integer scale and exact round-half-to-even using `2*abs(remainder)` versus `scale` (so odd scales cannot create false ties); and exact non-negative integer square root returning `floor(sqrt(n))`. Canonical floating point is excluded.

## Canonicality invariants

For every admitted value `v`, `decode(encode(v)) = normalized(v)`. For every accepted canonical byte sequence `b`, `encode(decode(b)) = b`. Alternate aliases fail closed.

## Multiscale interlock

`UniverseIdentity`, `CanonicalEntityIdentity`, `QueryContext` and `ModelRegime` remain distinct. Typed addresses can represent local/regime coordinates suitable for later `REFINE`, `PROJECT` and `RECONCILE` work without making those coordinates permanent identity. P2 implements no production astronomy, climate, biology, civilization or gameplay.
