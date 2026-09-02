# Canonical Address v1

A canonical address begins with ASCII `OFUA`, version byte `01`, minimal-ULEB segment count, then typed segments. Segment tags are: `01` namespace text, `02` u64 big-endian, `03` i64 two's-complement big-endian, `04` bounded bytes.

Integer segments are checked; modulo wrapping is forbidden. P2 does not define one global meter coordinate system. Namespaces may identify semantic/local coordinate regimes. Addresses are query/navigation identifiers and MUST NOT automatically be treated as permanent Canonical Entity Identity.

`CanonicalEntityIdentity = SHA-256("OFU-ENTITY-v1\\0" || OFU-CBV-1({namespace, stableKey}))`. A domain owns the semantics of `stableKey`; mutable location, ownership and containment are excluded unless that domain explicitly defines them as identity.
