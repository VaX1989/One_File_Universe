# One File Universe Integration Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Cycle:** 2026-09-02 / cycle 1  
**Baseline:** `main@0d802f2af87e7db4ba9553f11cc9914c93a3cebc`  
**Status:** integration control document; it does not transfer feature ownership.

## State vocabulary

- **FROZEN** — irreversible upstream contract. Downstream phases consume it; changes require a reproduced protocol defect and explicit re-certification.
- **STABLE_SNAPSHOT** — cross-phase interface snapshot stable enough for parallel consumers, but not a phase freeze. Compatible additive clarification is allowed; incompatible change requires coordinated versioning.
- **PROPOSED** — implementation exists or is being designed, but unresolved semantic or conformance work prevents downstream reliance as frozen authority.
- **RESEARCH** — exploratory model or interface. It may inform later contracts but is not canonical authority.

A working implementation does not become frozen merely because another branch already consumes it.

## Contract registry

| Contract | Owner | Consumers | State | Current integration decision |
| --- | --- | --- | --- | --- |
| OFU-CBV-1 canonical bytes | P2 | all phases | FROZEN | P2 is closed and remains upstream authority. |
| Unicode profile `ofu-unicode-15.1.0-v1` | P2 | all phases | FROZEN | No downstream phase may silently substitute normalization/repertoire semantics. |
| Universe Identity | P2 | P3+ | FROZEN | Universe-scoped canonical authority. |
| Canonical Entity Identity | P2 | P3+ | FROZEN | Universe-scoped entity identity; domain phases define stable keys, not a second identity system. |
| Canonical Address v1 | P2 | P3+ | FROZEN | Domain addresses must use P2 canonical addressing. |
| Addressed derivation / Semantic Generator Manifest / numeric authority | P2 | P3+ | FROZEN | Generator/domain versions must be bound through the P2 semantic lineage contract. |
| Phase-owned conformance evidence | Integration Board + phase CI owner | all phases | STABLE_SNAPSHOT | Evidence roots and artifacts are phase-owned; foreign evidence inside a phase set fails closed. See `docs/integration/PHASE_EVIDENCE_ARCHITECTURE.md`. |
| P3 Astronomy Facts schema | P3 | P4, P5, later domains | PROPOSED | Prototype schema `0` is strong but non-normative; promote from current certified `main`, then freeze schema v1/corpus. |
| P3 normalized physical system-site identity | P3, under P2 identity | P4, P5 | STABLE_SNAPSHOT | Physical System stable key and canonical Address both use normalized absolute site coordinates; Sector remains a computational partition. |
| P3 -> P5 Planetary Input Snapshot v0 | P3 facts / P5 physical realization / Integration boundary | P5 | STABLE_SNAPSHOT | Ownership split is frozen for current parallel work; field schemas remain pre-freeze. See `docs/integration/P3_P5_PLANETARY_INPUT_SNAPSHOT.md`. |
| P4 Temporal Contract | P4 | P5, P6, P7+ | PROPOSED | Candidate has material replay/compaction/reducer-authority blockers. Do not treat it as integration-ready yet. |
| P5 Planet Physical Contract | P5 | P6 | RESEARCH | Causal architecture is useful; deterministic D3 numerics, physical validity domains and terrain topology are not frozen. |
| P4 -> P5 temporal ownership | P4 time/replay + P5 transition semantics | P5, P6 | STABLE_SNAPSHOT | P4 owns canonical time/order/replay/checkpoint/lineage; P5 owns planetary transition functions, never a private canonical clock/history. |

## Canonical authority map: astronomy to planetology

The purpose of this table is to prevent duplicate truths while P3 and P5 continue in parallel.

| Persistent concept | Authoritative owner | Boundary rule |
| --- | --- | --- |
| Planet identity | P3 using P2 Entity Identity | P5 consumes `planetId`; P5 never re-identifies the planet. |
| Host system / star relations | P3 | P5 consumes relations and host facts. |
| Orbit slot and orbital geometry | P3 | P5 consumes semi-major axis/eccentricity/orbit centre; no reroll. |
| Planet formation/population mass | P3 | P5 consumes the committed mass exactly as a physical-model input. |
| P3 coarse composition category | P3 as **formation/bulk prior**, not final material realization | Schema v1 must name/define this as a prior. P5 may refine it but may not contradict it silently. |
| Detailed composition fractions/material state | P5 | Derived from P3 inputs/prior under a versioned P5 model. |
| Mean physical radius | P5 for the future canonical physical contract | P3 schema-0 radius is a coarse prototype output and must be demoted/removed from P3 schema v1, or explicitly defined as a non-canonical prior. If P3 instead chooses to freeze it, P5 must consume it as a constraint and may not replace it. |
| Astronomical incident flux / insolation | P3 | P5 consumes it; do not independently recompute a competing canonical value. |
| Reference equilibrium-temperature proxy | P3 only if explicitly defined with a frozen reference-albedo convention | P5 owns actual albedo-dependent planetary energy/climate state. Avoid using the same field name for both meanings. |
| Interior/geodynamics | P5 | P3 does not assign it. |
| Atmosphere / hydrosphere / climate | P5 | P3 does not assign them. |
| Terrain macro constraints / terrain realization | P5 | Local meshes/samples remain derived unless a later contract promotes specific macro facts. |
| Canonical time/order/replay/checkpoint/lineage | P4 | P5 transition semantics consume P4 temporal authority. |

## Current exact heads under review

| Track | Ref | Head | Integration status |
| --- | --- | --- | --- |
| P2 / main | `main` | `0d802f2af87e7db4ba9553f11cc9914c93a3cebc` | FROZEN / certified |
| P3 prototype | `prototype/p3-universe-skeleton-pre-freeze` | `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a` | READY FOR CANONICALIZATION, not merge-ready |
| P4 candidate | `feature/p4-temporal-kernel` | `14537ef25083787cc13b8c93a250995e8dacdc28` | CONTINUE WITH MATERIAL FIXES |
| P5 research | `research/p5-planetology` | `efe2b8ce29267deb26f3f34d18433c96947c467e` | CONTINUE research |

These hashes are observations for this cycle, not permanent pins for the feature owners. Every later integration cycle must rebaseline live state first.
