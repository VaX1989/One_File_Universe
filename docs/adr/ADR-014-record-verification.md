# ADR-014 — Multidimensional Record and Verification Protocol

**Status:** Accepted

## Decision
OFU MUST NOT equate technical merit with raw artifact bytes or theoretical seed count.

Certification reports a multidimensional Record Vector and separates raw bytes from Certified Functional Payload (CFP).

Components counted toward CFP must be reachable, purpose-mapped, hashed, feature-mapped and covered by appropriate verification. Artificial padding and deliberate duplication are excluded.

Internal component verification and external whole-artifact/reproducible-build verification are distinct.

## Consequences
Public claims use the project claim taxonomy and must map to evidence. Third-party record recognition is never implied unless actually granted.