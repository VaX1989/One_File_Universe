# OFU-CBV-1 and Canonical Address v1

**Status:** P2 normative freeze candidate  
**Scope:** deterministic authority layer only

## Canonical value domain

OFU-CBV-1 admits only `null`, booleans, unsigned integers in `[0, 2^64-1]`, negative signed integers in `[-2^63, -1]`, byte strings, frozen-profile canonical text, dense canonical arrays, and string-keyed canonical maps. JavaScript `Number` input is admitted only when it is a safe integer and is interpreted as the corresponding mathematical integer. Floating point, `undefined`, functions, symbols, accessors, arbitrary object prototypes and cyclic graphs are outside the domain.

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

## Unicode stability profile

Canonical text uses `ofu-unicode-15.1.0-v1`.

The admitted repertoire is the Unicode 15.1.0 assigned scalar repertoire represented by the 707 sorted ranges generated from Unicode 15.1 `UnicodeData.txt` where General Category is not `Cn`, excluding the surrogate code-point interval. The normative range encoding is the concatenation of each range start and end as unsigned 32-bit big-endian integers. Its SHA-256 is:

`d92c96676b97eae626d3f0bd9419ec0a7dcc8c22373c1455f21015d737b47412`

Live text input is checked against this frozen repertoire before NFC normalization and checked again after normalization. Malformed UTF-16 is rejected. Wire text uses strict UTF-8, must already be NFC, and must be within the same frozen repertoire. Therefore a future host Unicode release cannot silently admit newly assigned code points into OFU-CBV-1.

The implementation intentionally delegates NFC transformation to the host normalization primitive, but P2 certification executes the official Unicode 15.1 `NormalizationTest.txt` against Node, Python and every declared browser target. The official test data is a build/test input only and is not embedded into the release HTML.

## Canonical arrays and maps

A JavaScript canonical array is a normal `Array` whose length is within the collection bound and whose elements `0..length-1` are all own data descriptors. Holes, accessors, subclasses, symbol properties, extra named properties and other hidden own state are rejected. Encoding reads descriptors rather than indexed property access and does not invoke a user iterator. Array prototype pollution and ambient replacement of `Array.prototype[Symbol.iterator]` do not define canonical bytes.

A canonical map has `Object.prototype` or `null` prototype, enumerable own string-key data descriptors only, and no symbols or accessors. Keys are normalized under the frozen Unicode profile. Two source keys that normalize to the same canonical key are rejected. Entries are ordered lexicographically by complete canonical encoded key bytes. Keys and values consume the same traversal budget.

Arbitrary Proxy detection cannot itself be guaranteed side-effect-free in ECMAScript. Proxy-backed authoritative live values are therefore outside the supported P2 live-value boundary. Hostile or imported data must cross the canonical-byte/portable-format boundary and be consumed by the strict parser.

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

The top-level maximum byte string encodes to exactly 1,048,576 bytes. Composite encoding is charged against the same total-byte budget, so the encoder cannot produce a canonical value that the decoder rejects solely because of the global input limit. Root is depth 0; depth 32 is admitted and depth 33 is rejected. Root, map keys and map values all count as nodes.

## Canonical Address v1

Addresses begin with ASCII `OFUA`, version `0x01`, then a minimal-ULEB segment count from 1 through 64.

| Segment | Tag | Payload |
| --- | ---: | --- |
| namespace | `0x01` | minimal ULEB length + canonical UTF-8 text |
| u64 | `0x02` | exactly 8-byte unsigned big-endian |
| i64 | `0x03` | exactly 8-byte two's-complement big-endian |
| bytes | `0x04` | minimal ULEB length + raw bytes |

| Address bound | Value |
| --- | ---: |
| Segments | 64 |
| Namespace UTF-8 bytes | 1,024 |
| Bytes-segment payload | 4,096 bytes |
| Complete address | 65,536 bytes |

Constructor and parser share these limits and the frozen Unicode profile. They reject unsupported versions, unknown tags, non-minimal lengths, invalid/non-NFC text and trailing bytes. Derivation accepts only bytes that successfully parse and rebuild as Canonical Address v1.

## Semantic Generator Manifest v1

The Semantic Generator Manifest is a strict semantic schema. It contains exactly these top-level fields:

- `semanticManifestVersion` = `1`;
- `canonicalProtocolVersion` = `"ofu-cbv-1"`;
- `canonicalAddressVersion` = `1`;
- `unicodeProfileVersion` = `"ofu-unicode-15.1.0-v1"`;
- `numericContractVersion` = `1`;
- non-empty canonical text `generatorSuite`;
- positive u64 `generatorSuiteVersion`;
- `subsystems`: canonical map of positive u64 semantic versions;
- `domains`: canonical map of positive u64 semantic versions;
- `dependencies`: canonical map of non-empty canonical text dependency versions;
- non-empty canonical text `lawProfile`;
- `genesis`: canonical map containing semantic initial-condition configuration.

Unknown or missing top-level fields fail closed. Canonical manifest bytes are `OFU-CBV-1(manifest)`. The Semantic Manifest Hash is SHA-256 of those bytes.

Browser, OS, CPU, renderer, benchmark data, CI metadata, build timestamps, component hashes, source commit/SHA and implementation-specific bytes are deliberately excluded. They belong to implementation/conformance evidence, not semantic universe identity.

## Universe Identity

Descriptor:

`OFU-CBV-1({ canonicalProtocolVersion, masterSeed, semanticManifestHash })`

Digest:

`SHA-256(UTF8("OFU-UNIVERSE-v1\0") || descriptor)`

The seed and Semantic Manifest hash are exactly 32 bytes. This establishes deterministic stable identity based on SHA-256 collision resistance; it is not a secrecy claim.

## Canonical Entity Identity — universe-scoped

P2 chooses universe-scoped Entity Identity so cross-universe aliasing is prevented by construction.

Descriptor:

`OFU-CBV-1({ universeIdentity, namespace, stableKey })`

Digest:

`SHA-256(UTF8("OFU-ENTITY-v1\0") || descriptor)`

`universeIdentity` is exactly 32 bytes and `namespace` is non-empty canonical text. The stable key is a canonical OFU-CBV-1 value defined by the owning domain.

Changing Universe Identity, namespace or stable key changes Entity Identity. Current location, containment path, ownership, `QueryContext` and `ModelRegime` do not implicitly participate and therefore do not rename an entity unless a domain explicitly places such information inside its stable key.

## Addressed derivation

The API accepts exactly:

- `masterSeed`: exactly 32 bytes;
- `semanticManifestHash`: exactly 32 bytes;
- `domain`: non-empty canonical text;
- `addressBytes`: validated Canonical Address v1 bytes;
- `property`: non-empty canonical text;
- `counter`: u64.

Unknown, missing, wrongly typed or out-of-range arguments fail closed.

Message:

`OFU-CBV-1(["OFU-DERIVE-v1", semanticManifestHash, domain, addressBytes, property, counter])`

Output:

`HMAC-SHA-256(masterSeed, message)`

Every variable-length component is canonically framed inside OFU-CBV-1. Domain/property/address/manifest/counter separation is regression-tested. P2 does not assume every user seed is secret or high entropy.

## Deterministic numeric contract v1

P2 intentionally freezes only three primitives:

- checked i64 addition;
- fixed multiplication of two i64 values using an exact integer intermediate, positive u64 scale, nearest rounding with ties-to-even, and checked i64 output;
- exact u64 integer square root returning `floor(sqrt(n))`.

Fixed multiplication compares `2 * abs(remainder)` with `scale`, so odd scales cannot create false ties. Canonical floating point and transcendental functions remain outside P2 and require explicit later protocol evolution if needed.

## Canonicality invariants

For every admitted value `v`, `decode(encode(v)) = normalized(v)`. For every accepted canonical byte sequence `b`, `encode(decode(b)) = b`. Alternate aliases fail closed.

## Multiscale interlock

`UniverseIdentity`, universe-scoped `CanonicalEntityIdentity`, `QueryContext` and `ModelRegime` remain distinct. Typed addresses can represent local/regime coordinates suitable for later `REFINE`, `PROJECT` and `RECONCILE` work without making mutable location permanent identity. P2 implements no production astronomy, climate, biology, civilization or gameplay.
