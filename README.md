# One File Universe

**One file. One universe. Verifiable by construction.**

One File Universe (OFU) is an experiment in software architecture, procedural generation and deterministic simulation whose canonical release artifact is a single self-contained HTML file. The repository remains modular and evidence-gated; the one-file artifact is a deterministic build product.

## Current status

- **P0 — Constitution & Foundation:** complete.
- **P1 — Constitutional Prototype:** complete.
- **P2 — Deterministic Kernel:** freeze/closure candidate on PR #6. Closure requires exact-head Foundation, P1 and P2 conformance, the declared cross-runtime matrix, reproducible build, review closure, merge and post-merge certification.
- **P3 — Universe Skeleton:** not started during P2 closure.

P2 freezes OFU-CBV-1, `ofu-unicode-15.1.0-v1`, Canonical Address v1, a strict Semantic Generator Manifest, Universe Identity, universe-scoped Entity Identity, HMAC-SHA-256 addressed derivation and a deliberately small deterministic numeric contract. The normative contract is [docs/P2_PROTOCOL.md](docs/P2_PROTOCOL.md).

## Core model

```text
SemanticManifestHash = SHA-256(OFU-CBV-1(SemanticGeneratorManifestV1))

UniverseIdentity
= SHA-256(domain || OFU-CBV-1({
    canonicalProtocolVersion,
    masterSeed,
    semanticManifestHash
  }))

EntityIdentity
= SHA-256(domain || OFU-CBV-1({
    universeIdentity,
    namespace,
    stableKey
  }))

Canonical derivation
= HMAC-SHA-256(masterSeed,
    OFU-CBV-1([
      derivationVersion,
      semanticManifestHash,
      domain,
      canonicalAddressV1Bytes,
      property,
      counter
    ]))
```

The semantic universe may look hierarchical, but it is designed as a sparse-addressed multiscale reality graph rather than a fully materialized tree. Mutable location, containment, ownership and query/model context do not silently become permanent Entity Identity.

## Runtime profiles

**Strict Direct-Open** is the portability baseline: one local HTML, no required runtime network, no required application-owned external resources and no canonical dependence on origin-bound browser storage. **Enhanced** execution may opportunistically use additional capabilities, but it must not change canonical world meaning.

## Core rules

- modular source → deterministic single-artifact build;
- seed and semantic generator lineage are separate concepts;
- addressed, domain-separated derivation replaces global sequential RNG semantics;
- canonical, derived and presentation state are distinct;
- canonical numeric behavior is explicitly reproducible;
- hardware acceleration cannot silently define universe truth;
- late materialization must satisfy committed facts;
- portable saves are authoritative while browser storage is optional convenience/cache;
- extraordinary claims require reproducible evidence;
- irreversible semantic decisions are ADR-governed.

## Key documents

- [Project Constitution](docs/CONSTITUTION.md)
- [Foundational Architecture](docs/ARCHITECTURE.md)
- [Determinism Contract](docs/DETERMINISM.md)
- [P2 Protocol](docs/P2_PROTOCOL.md)
- [P2 Architecture](docs/P2_ARCHITECTURE.md)
- [P2 Security & Conformance](docs/P2_SECURITY_CONFORMANCE.md)
- [Record & Certification Specification](docs/RECORD_SPEC.md)
- [Conformance Model](docs/CONFORMANCE.md)
- [Development Roadmap](docs/ROADMAP.md)
- [Architecture Decision Records](docs/adr/README.md)

## Validation

```bash
npm test
```

GitHub Actions additionally certifies direct-open browser execution, official Unicode 15.1 normalization conformance, independent Python agreement, worker/order independence, reproducible builds and the exact source SHA.

## Repository policy

`main` remains a coherent evidence-backed baseline. Substantial phases proceed through feature branches and review. Generated giant release artifacts are build products; the repository is the source of truth.

## License

No project license has been selected yet. Until a license is explicitly added, do not assume permission beyond applicable copyright law.
