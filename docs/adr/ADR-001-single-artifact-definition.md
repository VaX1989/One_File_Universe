# ADR-001 — Single Artifact Definition

**Status:** Accepted

## Decision
A Strict OFU release consists of exactly one canonical HTML application artifact. It MUST NOT require application-owned external runtime files, network services, CDNs, runtime package installation or a companion server.

The browser/runtime platform is an explicit environmental dependency and MUST NOT be misrepresented as "no runtime dependency".

Development sources remain modular; the HTML is a deterministic build product.

## Consequences
- Embedded JS/CSS/WASM/shaders/data are permitted.
- Optional exported saves are user data, not runtime dependencies.
- Source/build dependencies are permitted if pinned/auditable and not required externally at runtime.
- Large release artifacts may be distributed separately from ordinary Git blobs while the repository remains the source of truth.
