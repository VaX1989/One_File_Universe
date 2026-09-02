# P2 Deterministic Kernel Architecture

P2 defines a compact D3 deterministic authority layer and no production cosmology. `src/kernel/p2-canonical.js` is the browser implementation, `src/kernel/p2-address-parser.js` is its address decoder, and `tools/p2_oracle.py` is an independently written Python-standard-library oracle. The normative byte contract is `docs/P2_PROTOCOL.md`.

Authority consists of OFU-CBV-1, Canonical Address v1, Canonical Entity Identity, Semantic Generator Manifest hashing, Universe Identity, HMAC-SHA-256 addressed derivation and deterministic integer/fixed-point primitives. Rendering, P1 micro-universe facts, implementation/conformance metadata and performance observations remain outside semantic identity.

Canonical encode/decode share total-byte and traversal models. Map keys consume the same budget as values. Invalid UTF-8, non-NFC decoded text, non-minimal/overflowing ULEB, map aliases, trailing bytes, unsupported tags, cycles and limit violations fail closed.

SHA-256 is tested against known answers and Node's implementation across padding/long-message boundaries. HMAC is tested against an RFC 4231 vector and Node across zero-length, block-boundary and long-key/message cases. This establishes implementation agreement and deterministic behavior, not secrecy for arbitrary seeds.

P2 preserves the multiscale interlock: `CanonicalEntityIdentity` is not `QueryContext`, `ModelRegime`, mutable location, containment or ownership. Typed addresses can carry future local/regime coordinates without making those coordinates permanent identity. P2 stops before production `REFINE`, `PROJECT`, `RECONCILE`, astronomy, climate, biology, civilization or gameplay.
