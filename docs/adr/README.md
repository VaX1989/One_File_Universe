# Architecture Decision Records

ADRs capture decisions with durable semantic consequences. `Accepted` means the semantic contract is frozen enough for dependent work; it does not freeze every implementation detail.

| ADR | Decision | Status |
|---|---|---|
| [001](ADR-001-single-artifact-definition.md) | Single artifact definition | Accepted |
| [002](ADR-002-runtime-profiles.md) | Strict and Enhanced runtime profiles | Accepted |
| [003](ADR-003-authority-boundary.md) | Canonical / derived / presentation boundary | Accepted |
| [004](ADR-004-universe-identity.md) | Universe Identity | Accepted |
| [005](ADR-005-canonical-addressing.md) | Canonical sparse addressing | Accepted |
| [006](ADR-006-addressed-derivation.md) | Addressed PRF and domain separation | Accepted |
| [007](ADR-007-deterministic-numerics.md) | Deterministic numeric contract | Accepted principle; implementation experimental |
| [008](ADR-008-generator-manifest-lineage.md) | Generator Manifest and lineage | Accepted |
| [009](ADR-009-semantic-simulation-lod.md) | Semantic simulation LOD | Accepted |
| [010](ADR-010-late-materialization.md) | Constraint-safe late materialization | Accepted |
| [011](ADR-011-events-checkpoints-compaction.md) | Events, checkpoints and compaction | Accepted |
| [012](ADR-012-portable-persistence.md) | Portable persistence is authoritative | Accepted |
| [013](ADR-013-rendering-capabilities.md) | Portable baseline + optional acceleration | Accepted principle; backend details experimental |
| [014](ADR-014-record-verification.md) | Multidimensional record and verification protocol | Accepted |
| [015](ADR-015-multiscale-identity-query-and-genesis.md) | Multiscale identity, query context and genesis configuration | Accepted |
| [016](ADR-016-p2-canonical-protocol-v1.md) | P2 canonical value/address/identity/derivation protocol v1 | Accepted for P2 conformance review |
| [017](ADR-017-p4-temporal-event-replay.md) | P4 canonical time, event ordering and replay | Proposed for P4 ratification |
| [018](ADR-018-p4-live-frontier-bounded-history.md) | P4 monotonic live frontier, bounded history and transition authority | Proposed for P4 semantic closure |
| [019](ADR-019-environment-v2-scientific-authority.md) | Environment v2 scientific authority and unknown-first genesis | Accepted |

## ADR policy

- Superseded decisions are never silently rewritten out of history.
- A breaking semantic change creates a new ADR or explicitly supersedes an old one.
- Languages, compressors, allocators, exact PRFs and global numeric formats are not frozen merely for architectural neatness; they require P1/P2 evidence.
- ADR-015 constrains P2 identity/address/query semantics without authorizing production multiscale simulation.
- ADR filenames and headings use a unique three-digit identifier. `tests/governance/adr-hygiene.mjs` enforces identifier uniqueness, index coverage, heading alignment, explicit status and valid index links.
