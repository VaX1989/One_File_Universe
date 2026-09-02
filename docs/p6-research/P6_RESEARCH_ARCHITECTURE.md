# P6 Biosphere & Evolution Research Architecture

> **Status: RESEARCH / NON-CANONICAL**
>
> This document describes a promotion-oriented P6 research architecture. It does not supersede P2 identity/derivation, P3 astronomy, P4 temporal semantics, or P5 planetary/environmental ownership.

## 1. Authority boundary

The causal chain is:

```text
P2 identity / canonical address / addressed derivation
+ P3 immutable astronomy baseline
+ P4 accepted canonical history/time
+ P5 versioned planetary/environmental state
=> P6 biological state and late materialization
```

P6 never rerolls a P5-owned environmental fact. P6 does not own a canonical clock, event ordering, checkpoint/archive format, or a second identity system.

The current consumer boundary is the P5 research export `environmentalContractV02()` with contract version `p6-environment-research-v0.2`. P6 consumes it only through `adaptP5EnvironmentV02()` and fails closed on unknown contract versions or authority labels.

## 2. Current P5 consumer contract

Consumed fields:

- canonical 32-byte `planetId`;
- baseline insolation;
- mean/min/max/seasonal temperature diagnostics;
- surface/column-equivalent pressure;
- heavy-gas retention and XUV escape proxies;
- surface/deep water-regime labels;
- geological activity/regime proxies;
- ocean fraction and relief scale;
- XUV fraction proxy.

The adapter immediately quantizes floating research diagnostics before they enter P6 logic. This reduces accidental sensitivity but is **not** a claim of canonical deterministic numerics.

### Missing upstream fields

Two important inputs are currently optional or absent in P5 v0.2 and therefore promotion blockers rather than P6 inventions:

1. **Environmental epoch/state reference.** P6 can carry an optional `environmentalEpochRef`, but P4/P5 must define the eventual authoritative binding.
2. **Stable environmental spatial reference.** P6 can carry an optional `spatialRef`, but it does not create a competing planetary grid. P5 must expose a versioned topology/cell/patch identity suitable for ecology.

Atmospheric composition constraints and a more explicit productivity-driving chemistry/nutrient envelope are also desirable future P5→P6 inputs. P6 v0.1 deliberately does not fabricate them.

## 3. Deterministic identity and derivation

`createP2BiosphereBindings()` requires the canonical P2 API, master seed, Semantic Manifest hash and Universe Identity. Research addresses are P2 Canonical Addresses under the `p6` namespace.

Conceptual identities:

| Entity | P2 namespace | Persistence expectation |
| --- | --- | --- |
| Biosphere | `p6.biosphere` | persistent candidate when biology becomes canonical |
| Lineage | `p6.lineage` | persistent candidate for major committed lineages |
| Species | `p6.species` | persistent only when semantically/history relevant |
| Materialized individual | `p6.individual.materialized` | normally derived; persist only if observation/history/gameplay makes it consequential |

Stable identity is distinct from persistence. A deterministic materialized organism can have a reproducible P2 identity without requiring global storage.

No global mutable RNG exists. Draws use P2 addressed derivation, so unrelated queries cannot advance or perturb a shared random stream.

## 4. Productivity / energy-budget architecture

`productivityBudget()` computes a bounded research proxy from separable environmental constraints:

- incident stellar forcing;
- temperature envelope;
- surface-water regime;
- pressure/column environment;
- radiation/XUV stress;
- seasonality.

The current formula is deliberately conservative in its claims. Units are dimensionless research units, **not watts, biomass, net primary productivity, or carbon flux**.

The model enforces the causal invariant:

```text
primary-productivity ceiling <= available biological-energy proxy
```

and controlled-pair tests assert that reducing incident energy cannot increase the modeled productivity or sustainable-biomass ceiling.

Evidence declaration: `EMPIRICALLY_CONSTRAINED / STYLIZED`.

## 5. Niche architecture

A niche is represented as a constrained functional/environmental space, not as a randomly selected biome name.

Macro commitments derive viable media from environmental state:

- `AQUATIC` only when surface water/ocean constraints permit it;
- `SURFACE` only where a surface/atmospheric context exists;
- `ATMOSPHERIC` for no-solid-surface environments where this research abstraction is admitted;
- `SUBSURFACE` as a fallback research category when surface options are not defensible.

Thermal regime, productivity class, lineage richness and niche richness become macro commitments that constrain later refinement.

## 6. Trophic architecture

The trophic model uses a primary producer ceiling and lossy transfers to consumer levels. Transfer efficiencies are bounded stylized research parameters derived by P2-addressed draws.

Executable invariant:

```text
higher-consumer energy <= primary-consumer energy <= primary-producer energy <= primary productivity
```

A detrital loop is budgeted as a fraction of primary productivity and does not create new energy.

Evidence declaration:

- direction of energy loss: `ESTABLISHED / APPROXIMATE`;
- exact efficiencies and topology: `HYPOTHETICAL / STYLIZED`.

## 7. Lineage, heredity and morphology

The heritable representation is intentionally compact and generative rather than molecular. A lineage commits fields such as:

- locomotion medium and functional locomotion mode;
- broad metabolic/productivity band;
- reproduction strategy abstraction;
- sensory priority;
- thermal tolerance envelope;
- trophic role and energy share.

Species refinement inherits lineage commitments and may add bounded body scale, armor/support investment and refined tolerance. Individual morphology is generated only on request and cannot change the committed medium, thermal regime, lineage/species ancestry or energy ceiling.

The grammar is functional rather than taxonomic. It does not assume vertebrate, arthropod, plant or other Earth body plans.

Evidence declaration: `HYPOTHETICAL / STYLIZED` for morphology and `HYPOTHETICAL / METAPHORICAL` for the current heritable-code abstraction.

## 8. Semantic LOD

### MACRO

Persistent/commitment candidates:

- biosphere identity;
- environmental source/version;
- viable media;
- thermal regime;
- productivity class;
- lineage/niche counts;
- maximum trophic depth;
- major evolutionary pressure state.

### MESO

Generated on demand:

- selected lineages;
- species/taxa;
- trophic role;
- inherited functional traits;
- species energy ceilings.

### MICRO

Generated on demand:

- individual identity;
- local morphology realization;
- bounded individual energy demand;
- presentational organism detail.

`assertRefinementInvariant()` is executable and verifies that meso/micro materialization cannot violate committed medium, thermal or energy facts.

## 9. Evolution/history abstraction

P6 v0.1 computes only **pressure/state diagnostics**, not canonical evolutionary history. Geological activity, seasonality and resource harshness contribute to a bounded turnover pressure.

Future accepted history must use:

```text
prior biological state
+ P4 canonical accepted event/time
+ versioned P6 biological transition semantics
= new biological state
```

Draft event families:

- `p6.speciation@1`;
- `p6.extinction@1`;
- `p6.population.range-shift@1`;
- `p6.population.change@1`;
- `p6.ecosystem.regime-change@1`;
- `p6.adaptation.commit@1`;
- `p6.biosphere.collapse@1`;
- `p6.biosphere.recovery@1`.

`p4BiologicalTransitionDraft()` explicitly declares `privateClock: false` and `privateEventLog: false`. P4 remains the sole temporal/replay/checkpoint/archive authority.

## 10. Persistence policy

Research persistence candidates:

- major lineage commitments;
- accepted speciation/extinction events;
- major ecosystem regime shifts;
- population summaries that matter to accepted history;
- user-observed or interacted entities;
- historically consequential individuals, if later product/gameplay semantics require them.

Normally derived:

- unobserved individual organisms;
- presentation geometry;
- cosmetic detail;
- local ephemeral population noise;
- rendering caches.

History-sensitive facts must eventually bind to P4 accepted events and cannot be recomputed from mutable present-day environmental inputs.

## 11. Determinism properties under test

The research suite covers:

- identical environment + identity => identical biosphere;
- identical P2 address => identical IDs/traits;
- query-order independence for lineage refinement;
- unrelated-entity query independence;
- repeated individual materialization exact repeat;
- late refinement cannot alter macro commitments;
- no global mutable RNG state;
- rendering projection is presentation-only.

Worker-scheduling independence is not yet independently executed because v0.1 is a synchronous pure research module. This becomes a promotion test when worker execution exists.

## 12. Metamorphic / causal properties under test

Executed controlled-pair relations:

- lower stellar forcing => non-increasing productivity proxy;
- lower stellar forcing => non-increasing sustainable-biomass proxy;
- loss of surface liquid-water support => non-increasing water suitability;
- dry/no-ocean environment => no committed aquatic medium;
- increasing modeled persistent disturbance => non-decreasing turnover-pressure proxy;
- trophic transfer cannot increase available energy;
- contradictory refinement is rejected.

The suite intentionally does not impose monotonic claims on ecological relationships where the research model does not justify them.

## 13. Working-set strategy

The model supports random-access generation by planet/lineage/species/individual address. The benchmark queries 2,000 conceptual biospheres while meso/micro refining only 24 active planets.

This demonstrates the intended architecture:

```text
large conceptual biodiversity
!=
large simultaneously materialized working set
```

The benchmark records elapsed time, heap delta, visited lineages and materialized species/individual counts. It is Node research evidence, not browser certification.

## 14. Rendering handoff

`renderingProjection()` exposes only semantic presentation inputs:

- productivity class;
- viable media;
- niche count;
- trophic depth;
- lineage identities;
- species distribution hints.

Rendering may visualize these facts but camera state, traversal order, culling, LOD selection and caches must never mutate biological truth.

## 15. Promotion gaps

### MATERIAL BLOCKERS

- P5 environmental input contract is not promotion-stable/canonical.
- P5 does not yet expose a stable versioned spatial ecological address in the consumed v0.2 boundary.
- P4-compatible biological reducer/event schemas are only a draft, not a certified transition contract.
- canonical numeric semantics for P6 productivity/trait calculations are not yet defined or cross-runtime certified.
- Golden P6 conformance vectors and independent runtime oracle do not yet exist.
- browser/cross-runtime working-set evidence does not yet exist.

### IMPORTANT NON-BLOCKERS

- productivity calibration remains intentionally stylized;
- nutrient/chemical energy inputs are absent from the current P5 contract;
- atmospheric composition constraints are not yet consumed;
- evolutionary diversification/speciation calibration is not implemented;
- individual draws currently target deterministic reproducibility rather than calibrated organismal distributions.

### FOLLOW-UP

- add P5 spatial contract adapter when P5 topology stabilizes;
- add environmental epoch binding tied explicitly to P4/P5 state references;
- separate phototrophic and chemosynthetic energy families once upstream chemistry/energy inputs exist;
- define canonical fixed/quantized numeric path for promoted outputs;
- create Golden vectors and an independent implementation/oracle;
- run browser and worker scheduling conformance;
- test P4 reducer integration against accepted event ordering/checkpoint/replay semantics.

## 16. Promotion rule

Passing this research suite does **not** make P6 canonical. Promotion must start from then-current canonical `main` and selectively promote proven P6 components after the P5 input boundary is stable and all promotion blockers are closed or explicitly scoped/versioned.
