# Baseline vs Mutable Authority Matrix

**Owner:** Independent Architecture, Contract & Integration Board  
**Status:** STABLE_SNAPSHOT for cross-phase design; owning phase specifications remain authoritative.  
**Reviewed P3 prototype:** `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a`  
**Reviewed P4 head:** `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0`  
**Reviewed P5 research:** `efe2b8ce29267deb26f3f34d18433c96947c467e`

## State classes

- **GENESIS / PROCEDURAL BASELINE** — deterministically regenerated from the frozen upstream seed/manifest and the owning domain generator version. It describes the initial/reference world supplied to temporal simulation.
- **MUTABLE CANONICAL STATE** — persistent state that may change only through P4 canonical history interpreted by a versioned owning-domain transition contract.
- **DERIVED STATE** — recomputable from canonical baseline/current state; it is not independent persistent authority unless a future contract explicitly promotes it.
- **PRESENTATION** — renderer/UI/query representation; never canonical authority.

The architectural equation is:

```text
P3 procedural baseline
+ P4 canonical history
+ versioned domain transition semantics
= current persistent world state
```

A baseline field name must not imply that its value is eternally current when later phases may evolve the physical quantity.

## Cross-phase authority table

| Concept | P3 baseline meaning | Future mutable authority | Derived/presentation rule | Required schema guidance before P3 v1 |
| --- | --- | --- | --- | --- |
| System / star / planet identity | GENESIS identity under frozen P2 Entity Identity | Identity normally remains stable; mutation changes properties/relations, not identity | Display names/labels are presentation | Keep identity independent of mutable containment/state. |
| System formation/reference age | GENESIS/reference age used to realize the initial stellar population | If canonical time advances stellar evolution, current stellar age/state is P4 + stellar transition semantics | Display age formatting is presentation | Avoid ambiguous bare `ageMyr` if it denotes the baseline epoch. Prefer explicit `baselineAgeMyr`, `ageAtGenesisMyr`, or an equally normative reference-epoch definition. |
| Stellar mass | GENESIS/reference stellar mass at the P3 epoch | Future mass loss/accretion belongs to P4 + stellar evolution semantics | Gravity/luminosity calculations may derive from current mass/model | Name/reference epoch explicitly if future evolution can change current mass. |
| Stellar evolutionary class | P3 class at the baseline/reference epoch | Current class is mutable canonical state once stellar evolution is implemented | Spectral/rendering labels derive from current state | Treat prototype class as baseline state, not an immutable identity fact. |
| Stellar temperature | P3 value at baseline/reference epoch | Current temperature evolves under stellar transition semantics | Color/rendering derived | Make reference epoch explicit. |
| Stellar luminosity | P3 baseline/reference luminosity | Current luminosity evolves under stellar transition semantics | Incident-energy calculations derive from the appropriate current luminosity and orbit once evolution exists | Do not define the prototype value as eternally current. |
| Orbit geometry | P3 genesis/reference orbital architecture and elements | Tides, scattering, migration or perturbations require P4 + orbital transition semantics | Ephemeris/render positions are derived from canonical orbital state/time | Prefer `baseline*`/`initial*` semantics or state explicitly that P3 is the reference epoch. |
| Astronomical insolation | P3 reference incident-energy input derived from baseline luminosity/orbit | Current insolation becomes derived from current stellar/orbital state rather than independently mutated unless a later contract says otherwise | Climate consumes current derived incident energy | Name P3 value as reference/baseline insolation if evolution is in scope. Avoid competing P5 recomputation authority. |
| Planet mass | P3 formation/population mass at the baseline epoch | Atmospheric escape, impacts, accretion etc. may make current physical mass mutable under P4 + P5 transitions | Gravity/density derive from current mass/radius | Replace ambiguous `massMilliEarth` semantics with explicit baseline/formation/reference-epoch meaning before freeze if later evolution is admitted. P5 must consume the committed baseline value, never reroll it. |
| Coarse bulk/composition prior | P3 formation prior | The prior itself remains provenance/baseline; current detailed composition is P5-owned mutable/static physical realization depending on model scope | Classification labels may derive from detailed composition | Rename prototype `compositionClass` to an explicit prior such as `bulkPriorClass`. |
| Physical radius | P3 schema-0 prototype diagnostic only under selected split | P5 owns physical radius and any future radius evolution | Gravity/density/render scale derive from P5 radius | Remove/demote P3 `radiusMilliEarth` before schema v1 unless ownership is explicitly re-adjudicated. |
| Detailed composition/material fractions | Not owned by P3 | P5 owns initial physical realization and any later canonical evolution | Bulk class may derive from fractions | Version refinement mapping from P3 prior. |
| Atmosphere | Not owned by P3 | P5 + P4 history | Spectra/visual haze are derived/presentation | No P3 authority. |
| Hydrosphere | Not owned by P3 | P5 + P4 history | Surface rendering derived | No P3 authority. |
| Climate | Not owned by P3 | P5 + P4 history/transition semantics | Weather visualization derived | P5 must consume P4 time; no private clock. |
| Terrain macro state | Not owned by P3 | P5 owns any promoted persistent macro constraints; tectonic/erosional evolution uses P4 | Meshes/tiles/samples are normally derived | Separate persistent macro constraints from renderer/LOD detail. |
| Terrain fine realization | Not P3 | Normally derived from P5 macro state + address/model version; only promoted facts may be mutable | Renderer caches never authority | Refinement/cache data must not become truth. |

## Critical semantic distinction: baseline epoch

P3 currently generates a coherent snapshot containing `system.facts.ageMyr`, stellar `ageMyr`, `evolutionaryClass`, `temperatureK`, `luminosityMilliSolar`, planet orbital facts, `insolationPpm`, and `massMilliEarth`. Those values are coherent for one generated reference world, but their names do not yet distinguish baseline/reference values from future current values.

P3 schema v1 must define one explicit interpretation:

1. **Universe-Genesis baseline:** P3 facts are state at canonical P4 `T0`; or
2. **Reference-epoch baseline:** P3 facts are state at a declared astronomical reference epoch that maps deterministically into P4 time semantics.

The preferred minimum-complexity integration direction is that P3 schema v1 represents the canonical procedural state at P4 `T0`. Later evolution produces current state through P4 events and versioned domain transition semantics. If the P3 owner needs a different reference epoch, it must be explicit and deterministic before schema freeze.

## Mutation rules

1. P4 never rerolls a P3 baseline fact; it records canonical changes relative to that baseline.
2. P5 never rerolls P3-owned baseline mass/orbit/identity/environment inputs.
3. A current value that differs from baseline must have one owning transition contract and one replay path.
4. Derived current quantities should be recomputed from current canonical inputs rather than independently persisted unless persistence is justified and versioned.
5. Renderer/LOD/cache state cannot mutate canonical scientific facts.
6. Schema migrations that change baseline meaning require explicit versioning; field renaming alone must not silently reinterpret historical archives.

## Owner actions

### P3 / Chat 2

Before schema v1 freeze, adjudicate field-by-field baseline/reference semantics, especially `ageMyr`, stellar state/luminosity, orbit, `insolationPpm`, and planet `massMilliEarth`. Preserve the prototype generator unless a semantic rename/reference-epoch clarification requires a schema change.

### P4 / Chat 3

The temporal contract should accept a domain baseline descriptor whose semantic/domain version identifies how that baseline is interpreted. P4 owns history and time, not stellar/planetary transition physics.

### P5 / Chat 4

Treat P3 values as baseline constraints. Future changing mass/radius/composition/atmosphere/climate use P4 history plus P5 transition semantics; do not create a parallel current-state truth outside replay.
