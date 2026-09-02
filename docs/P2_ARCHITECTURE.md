# P2 Deterministic Kernel Architecture

P2 defines a compact D3 authority layer and no production cosmology. The primary browser implementation is `src/kernel/p2-canonical.js`; `tools/p2_oracle.py` is an independently written standard-library oracle.

Authority consists of OFU Canonical Binary v1, typed canonical addresses, Canonical Entity Identity, Semantic Generator Manifest hashing, Universe Identity, HMAC-SHA-256 addressed derivation and deterministic integer/fixed-point primitives. Rendering, P1 micro-universe facts and implementation manifests remain outside P2 semantic identity.

The architecture preserves ADR-015: entity identity is not Query Context, Model Regime, mutable location, containment or ownership. Genesis/law configuration is semantic manifest content. Different conforming implementations may realize the same semantic universe.
