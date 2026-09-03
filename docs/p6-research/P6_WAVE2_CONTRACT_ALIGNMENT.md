# P6 Wave 2 — Canonical P5 Alignment Research

Status: **RESEARCH / NON-CANONICAL**

## Purpose

Wave 2 removes the primary Wave-1 integration weakness: the P6 research implementation now consumes the actual frozen P5 runtime pipeline rather than treating `p6-environment-research-v0.2` as canonical evidence.

Executable primary path:

`P3 planetaryInputSnapshot -> P5 adapt/realize -> P5 terrain topology -> P5 p6EnvironmentalProjection -> P6 adapter -> P6 canonical-minimum decision`

Canonical upstream requirements:

- `ofu-p5-planet-physical-v1`
- `p5-planet-physical-1`
- `p5-cube-sphere-topology-1`
- `ofu-p5-p6-environment-v1`, version `1n`

P5 v1 projection is intentionally partial. P6 preserves `null` and `UNSUPPORTED` exactly. It does not inject Earth pressure, Earth temperature, liquid oceans, Earth tectonics, radiation assumptions, or chemistry.

## Execution modes

### CANONICAL_UPSTREAM_MINIMUM

Consumes only the real P5 v1 projection. A supported terrestrial P5 planet currently resolves to `INSUFFICIENT_ENVIRONMENT`, not a generated biosphere. The mode may expose only physical constraints directly supported by P5, including radius, gravity, density and terrain-topology identity.

Energy-source state is explicit. Phototrophic, chemotrophic and mixed productivity are unsupported from canonical P5 v1 alone because temperature/medium/radiation/chemistry are not promoted.

### RESEARCH_ENVIRONMENT_EXTENSION

Rich ecology research requires a separately versioned `P5_RESEARCH_DRAFT` extension. Composition is explicit, planet identity must match the canonical projection, and canonical P5 facts remain authoritative. The historical `p6-environment-research-v0.2` shape is therefore retained only as research-extension input, never as the canonical P5 boundary.

## Identity/model-version decision — Model A (research decision)

Wave 2 selects **Model A: biological identity survives model evolution** for research.

A biosphere, lineage or species Entity ID represents a semantic entity in the canonical Universe identity space. Generator/model revisions bind derivation semantics and provenance through the P6 Semantic Generator Manifest, but do not automatically mint a new semantic Entity ID.

Research stable keys therefore bind semantic identity policy and parent/ordinal identity, not `P6_MODEL_VERSION`. Tests require:

1. identical semantic stable key + identical canonical Universe Identity -> identical Entity ID across P6 generator-manifest revisions;
2. changed P6 Semantic Manifest -> changed addressed derivation stream;
3. model/version remains explicit in generated-state provenance.

This is not a canonical P6 freeze. A future promotion mission may revise the policy only through an explicit migration/governance decision.

## P6 Semantic Generator Manifest

Wave 2 defines `P6_SEMANTIC_MANIFEST` and hashes it through canonical P2 `semanticManifestHash()`.

It binds:

- OFU-CBV-1;
- Canonical Address v1;
- Unicode 15.1 profile;
- numeric contract v1 dependency;
- P6 biosphere/ecology/evolution/LOD subsystem versions;
- P2/P3/P4 dependencies;
- frozen P5 physical and P5->P6 environment contract dependencies;
- research law profile;
- research identity/evidence policy.

The P6 manifest hash governs P6 addressed derivation. The canonical Universe Identity remains the upstream canonical Universe Identity; P6 does not create a competing universe identity.

## Semantic LOD

`MACRO -> MESO -> MICRO` remains research architecture. Refinement must preserve:

- canonical planet identity;
- viable environmental medium;
- thermal commitment when the research environment supplies one;
- trophic role;
- lineage identity/parentage;
- energy ceilings.

Contradictory refinement fails instead of silently mutating macro commitments. Query and refinement ordering are tested independently.

## Energy/productivity architecture

Research causality is split by source:

- `PHOTOTROPHIC`: research extension dependent;
- `CHEMOTROPHIC`: unsupported unless a research chemistry extension explicitly supplies a chemical-energy proxy;
- `MIXED`: research-only composition when both are supplied;
- `UNKNOWN`: explicit epistemic state.

The causal hierarchy remains:

`usable energy -> primary productivity ceiling -> sustainable biomass ceiling -> trophic ceilings`

All quantities are research proxies, not extraterrestrial biological predictions.

## P4 biological history

`p4BiologicalReducerResearch()` is a versioned non-canonical reducer prototype for event families such as speciation, extinction, migration/range shift, population change, ecosystem regime change, adaptation, collapse and recovery.

It explicitly owns none of:

- clock/time;
- event identity;
- accepted ordering;
- event log;
- replay;
- checkpoints;
- compaction;
- lineage/archive authority.

Those remain P4-owned if P6 events are ever promoted.

## Numeric promotion candidates

Wave 2 identifies candidate persistent representations without freezing them:

- suitability: u32 ppm;
- transfer efficiency: u32 ppm;
- productivity/energy budget: u64 research units;
- environmental suitability: u32 ppm;
- population summary: u64 or log10-milli candidate, still calibration-dependent.

Future promotion must specify exact fixed-point conversion, ties-to-even rules where division occurs, overflow rejection and explicit unsupported state.

## Worker/scheduling determinism

`tests/p6-research/worker-order-v2.mjs` compares equivalent addressed biological queries under sequential, shuffled, worker-thread and different batching schedules. Normalized lineage/species identity and commitments must match.

## Promotion gaps still material

Wave 2 reduces but does not eliminate these blockers:

- canonical P5 still lacks temperature, pressure, volatile/medium, radiation/escape, ocean and geological-activity truth required for rich viability;
- chemotrophic energy requires promoted chemistry/geochemistry or an explicit research extension;
- biological calibration remains research-only;
- deterministic fixed numeric promotion semantics are candidates, not frozen contracts;
- browser cross-runtime evidence is research evidence, not a P6 promotion seal;
- no canonical P4 biological transition/reducer contract exists yet.

P6 remains research and must not be promoted by this branch.
