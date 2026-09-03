# P6 Biosphere & Evolution v1 — Canonical Contract Candidate

This document describes the smallest promotion candidate for canonical P6. It is **not canonical until merged into `main` after P5 Environment v2 is present on `main` and exact-main certification passes**.

## Frozen candidate identifiers

- P6 contract: `ofu-p6-biosphere-v1`
- P6 model: `p6-biosphere-evolution-1`
- P6 schema: `1`
- P5 environment dependency: `ofu-p5-p6-environment-v2`, version `2`, model `p5-environment-2`, authority `P5_CANONICAL`
- Biological identity policy: `p6-biological-identity-model-a-v1`
- Numeric contract: `p6-fixed-integer-1`
- Semantic LOD profile: `p6-semantic-lod-1`
- Biological transition contract: `ofu.p6.biological-transition@1.0.0`

## Authority boundary

P6 consumes the exact P5 Environment v2 projection. It does not synthesize atmosphere, pressure, climate, water, radiation, geology or geochemical energy. Unknown future P5 contract versions or authorities are rejected.

The P5 epistemic states `UNKNOWN` and `UNSUPPORTED` remain distinguishable and are never converted to neutral/default values.

The real current P5 Environment v2 path lacks enough promoted environmental truth for canonical biological genesis. Therefore current real planets legitimately evaluate to:

- `INSUFFICIENT_ENVIRONMENT`
- `canGenerateBiosphere = false`

This is a valid canonical result.

A separate `ofu-p6-normative-environment-vector-v1` / `P6_CONFORMANCE_ONLY` input exists solely to test the supported mathematical path. It is not a P5 authority and must never be represented as a naturally generated canonical planet.

## Eligibility states

P6 v1 distinguishes:

- `INSUFFICIENT_ENVIRONMENT`: upstream truth is incomplete for a biological decision;
- `UNSUPPORTED_ENVIRONMENT`: an upstream environment or future use is outside supported P6 v1 semantics;
- `NO_BIOSPHERE`: sufficient inputs exist but the canonical P6 decision does not establish a biosphere;
- `BIOSPHERE_SUPPORTED`: a supported conformance input establishes the bounded P6 path.

Unknown is not dead and unsupported is not supported.

## Identity

Canonical semantic Entity IDs use P2 Entity Identity and the canonical Universe Identity. Stable keys contain semantic scope and identity-policy version, never the P6 generator version or Semantic Manifest hash.

Canonical v1 promotes biosphere, lineage and species identity. Individual identity is deferred. MICRO individuals are ephemeral refinements.

See ADR-020.

## P2 derivation and P6 Semantic Manifest

The P6 Semantic Generator Manifest binds OFU-CBV-1, Canonical Address v1, Unicode 15.1 profile, numeric contract v1, P3 astronomy, P4 temporal protocol, P5 physical contract, P5 Environment v2, P6 generator/law profiles, identity policy, evidence policy, semantic LOD and reducer version.

All canonical P6 derivation streams use the actual P2 hash of this manifest, canonical P2 addresses and a caller-supplied canonical Universe Identity. There is no global RNG and no private biological seed tree.

## Numeric contract

Persistent/normative P6 values use integers only:

- suitability / transfer fractions: unsigned ppm, `0..1,000,000`;
- energy and productivity budgets: u64 abstract model units;
- multiplication by ppm: exact integer product followed by floor division by `1,000,000`;
- overflow: rejection;
- invalid range: rejection;
- unsupported numeric input: represented by epistemic state, never a sentinel number.

Population counts are not canonicalized in v1.

## Energy hierarchy

The promoted causal hierarchy is:

`usable source energy -> primary productivity ceiling -> sustainable biomass ceiling -> trophic energy ceilings`.

Energy sources are explicit: `PHOTOTROPHIC`, `CHEMOTROPHIC`, `MIXED`, `UNKNOWN`.

Chemotrophy is unavailable on the real P5 v2 path because `geochemicalEnergyAvailability` is `UNSUPPORTED`. P6 never manufactures chemical energy.

Trophic transfers cannot increase energy. Exact efficiencies are model values and remain scientifically labelled rather than presented as extraterrestrial measurements.

## Scientific governance

Promoted subsystems retain evidence/fidelity metadata:

- contract consumption: FORMAL / exact;
- eligibility: HYPOTHETICAL / conservative fail-closed;
- integer energy accounting: FORMAL / bounded model;
- trophic energy conservation: ESTABLISHED constraint; exact efficiency values approximate/stylized;
- niche descriptors: HYPOTHETICAL / STYLIZED;
- semantic LOD invariants: FORMAL.

P6 v1 does not claim empirical prediction of alien morphology, genetics or ecosystem composition.

## Semantic LOD

`MACRO -> MESO -> MICRO` is refinement, not truth replacement.

Refinement must preserve planet/biosphere identity, viable medium, energy source and ceiling, lineage relation and trophic commitments. Contradictory MICRO refinement is rejected. Dematerialization/rematerialization is safe because semantic identity is P2-addressable and micro individuals are not persistent.

## P4 biological reducer

P6 owns biological payload validation and deterministic transition semantics only. P4 owns time, ordering, event identity, replay, checkpoints, compaction, lineage and archive mechanics.

Canonical v1 event families are deliberately minimal:

- `p6.biosphere.genesis@1`
- `p6.speciation@1`
- `p6.extinction@1`

No mutation/speciation clock, population scheduler or private event log is promoted.

Required ownership flags are all false: private clock, ordering, event identity, replay, checkpoints, compaction and lineage ownership.

## Persistence

P6 mutable history is carried by P4 archives using the exact P6 transition descriptor and a baseline that records P6 model version, P6 manifest hash, P5 Environment contract and biological identity policy.

Legacy P1–P5 saves remain valid and do not acquire invented biological state. New P6 archives fail closed against transition-law mismatch.

## Rendering projection

P6 may expose presentation-only state. Rendering must show `INSUFFICIENT_ENVIRONMENT` as biology unknown/not established and may not invent a biome.