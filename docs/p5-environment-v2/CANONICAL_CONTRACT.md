# Advanced P5 Environment v2 — Canonical Contract

Status on this branch: **CANONICAL PROMOTION CANDIDATE**. This document has canonical force only after merge to `main` and exact-main certification.

## Frozen compatibility boundary

Environment v2 is additive. It does not alter the meaning or bytes of:

- `ofu-p5-planet-physical-v1`
- `p5-planet-physical-1`
- `p5-cube-sphere-topology-1`
- `ofu-p5-p6-environment-v1`

The successor contract is `ofu-p5-p6-environment-v2`, model `p5-environment-2`, schema version `2`. The v1 projection remains available and preserves its explicit `UNSUPPORTED`/`null` environmental fields.

## Semantic Generator Manifest

Environment v2 owns a dedicated P2-validated Semantic Generator Manifest rather than reusing the P5 v1 physical manifest. It binds:

- `ofu-cbv-1`
- Canonical Address v1
- `ofu-unicode-15.1.0-v1`
- P2 numeric contract v1
- generator suite `p5-environment` version 2
- P3 `p3-astronomy-1`
- P4 `ofu-p4-temporal-v1`
- P5 physical `p5-planet-physical-1`
- terrain `p5-cube-sphere-topology-1`
- atmosphere conservation profile `p5-atmosphere-conservation-tg-v1`
- Tier-0 radiative profile `p5-radiative-equilibrium-s1361-sigma-codata2022-v1`
- evidence policy `p5-evidence-policy-1`
- genesis policy `no-canonical-volatile-genesis-v1`
- transition policy `no-endogenous-atmosphere-loss-v1`

Frozen candidate manifest hash: `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`.

Changing generator semantics requires a new manifest/derivation stream under P2 rules.

## Epistemic vocabulary

Every v2 boundary field carries explicit authority/provenance and one of the following states (directly or as the state from which it is derived):

- `KNOWN`
- `DERIVED`
- `HYPOTHETICAL_MODEL_VALUE`
- `UNKNOWN`
- `UNSUPPORTED`

`UNKNOWN` means the quantity is meaningful but no canonical value exists. `UNSUPPORTED` means the current contract does not model the quantity. A research value cannot be submitted as canonical state merely by wrapping it in the v2 contract.

## Volatile / atmosphere state

### Representation

Canonical stored atmosphere quantities use **absolute mass in teragrams** (`1 Tg = 10^9 kg`) represented as non-negative `u64 BigInt` values.

There is no mutable denominator. `ABSOLUTE_MASS_NO_DENOMINATOR` therefore avoids the ambiguity of “ppb of current planet mass”. A guard additionally rejects a total volatile inventory larger than the immutable P3 baseline planetary mass implied by `baselineMassMilliEarth`.

The state identity is:

`totalVolatileMassTg = atmosphericRetainedMassTg + condensedSurfaceMassTg + subsurfaceInteriorMassTg + lostMassTg`.

This bookkeeping relation is `ESTABLISHED / FORMAL`.

### Genesis decision

Environment v2 deliberately chooses **Path B — `NO_CANONICAL_GENESIS`**.

The research prior (broad total volatile fraction plus broad atmospheric partition) is not promoted. Terrestrial volatile inventories depend on accretion/delivery, magma-ocean partition and degassing, impacts, recycling and atmospheric escape. Reviews of terrestrial planet formation and magma-ocean evolution describe substantial history dependence and diversity, while atmospheric escape can materially reshape low-mass-planet volatile contents. These sources support the existence and importance of the processes, not a universal narrow prior for arbitrary 1–8 Mearth terrestrial worlds.

Evidence disposition for the unpromoted prior: `HYPOTHETICAL / STYLIZED`.

Primary/review sources used for this adjudication:

- Morbidelli et al. (2012), *Building Terrestrial Planets*, Annual Review of Earth and Planetary Sciences 40:251–275, DOI 10.1146/annurev-earth-042711-105319.
- Elkins-Tanton (2012), *Magma Oceans in the Inner Solar System*, Annual Review of Earth and Planetary Sciences 40:113–139, DOI 10.1146/annurev-earth-042711-105503.
- Tian (2015), *Atmospheric Escape from Solar System Terrestrial Planets and Exoplanets*, Annual Review of Earth and Planetary Sciences 43:459–476, DOI 10.1146/annurev-earth-060313-054834.

## Global surface column pressure

Canonical semantic name: `GLOBAL_SURFACE_COLUMN_PRESSURE`.

The v2 relation is

`p = M_atm * g / (4*pi*R^2)`

where:

- `M_atm` is retained atmospheric mass in kg, converted exactly from stored Tg;
- `g` is frozen P5 v1 `surfaceGravityMicroMs2`;
- `R` is frozen P5 v1 `meanRadiusM`;
- the spherical area approximation uses frozen rational `pi = 355/113`;
- output is integer pascals rounded nearest, ties-to-even.

The relation is `ESTABLISHED / APPROXIMATE`: established column-weight mechanics applied to a spherical/global-mean P5 representation. It is not local weather pressure and creates no independent radius/gravity authority.

Numeric contract:

| Field | Storage | Unit | Range | Rounding / rejection |
| --- | --- | --- | --- | --- |
| atmosphere masses | `u64 BigInt` | Tg | `0..2^64-1`, additionally `total <= baseline planet mass` | exact stored integer; negative/overflow reject |
| global column pressure | `u64 BigInt` | Pa | `0..2^64-1` | exact rational evaluation, nearest ties-to-even; overflow reject |

Causal invariants include zero atmosphere → exactly zero pressure and non-decreasing pressure with atmospheric mass at fixed planet state.

## Tier-0 radiative equilibrium

### P3 forcing semantics

P3 computes `insolationPpm` from stellar luminosity and orbital semimajor axis as a dimensionless Earth-normalized stellar flux. Therefore `baselineInsolationPpm = 1_000_000` means one nominal Earth solar irradiance, not `1 W/m^2` and not already-absorbed flux.

Environment v2 freezes the IAU nominal solar irradiance `S0 = 1361 W m^-2` (IAU 2015 Resolution B3). It freezes the 2022 CODATA Stefan–Boltzmann constant shown by NIST, `sigma = 5.670374419...e-8 W m^-2 K^-4`, as the exact displayed decimal rational `5670374419 / 10^17` for this model profile.

### Physical law

For global radiative equilibrium with unit longwave emissivity, no greenhouse, no internal heat and uniform redistribution:

`pi R^2 S (1-A) = 4 pi R^2 sigma T_eff^4`

thus

`T_eff = [ S (1-A) / (4 sigma) ]^(1/4)`.

This is a **radiative effective temperature**, not a mean surface temperature. NASA Earth-energy-budget material provides the physical absorbed-vs-emitted framing and shows why atmospheric greenhouse physics is separate from this Tier-0 balance.

Evidence: `ESTABLISHED / APPROXIMATE` for the law under the declared assumptions.

### Deterministic numeric path

- `baselineInsolationPpm`: P3 `u64 BigInt`, domain `0..1_000_000_000_000`.
- Bond albedo argument: integer ppm, `0..1_000_000`.
- output: integer millikelvin (`u64 BigInt`).
- all persistent/canonical arithmetic is integer/rational.
- the fourth root is obtained with an integer floor search and exact midpoint comparison against `(q + 1/2)^4`; ties round to even.
- negative inputs, albedo above 1, P3-domain overflow and output overflow reject.

Earth-normalized scientific anchor:

- normalized insolation = `1_000_000 ppm`;
- Bond albedo = `300_000 ppm`;
- canonical `T_eff = 254_578 mK` (`254.578 K`).

This corrects the research normalization that incorrectly produced about 278 K at Earth-like albedo.

### Albedo epistemics

Environment v2 does **not** invent a Bond albedo prior. The actual canonical Bond albedo is `UNKNOWN`. The contract exposes the deterministic law and a full physical-domain envelope over albedo `0..1`; this envelope is not a probability distribution and is not an assertion about likely albedo.

NASA educational material defines albedo on the physical `0..1` interval. Formula evidence and albedo epistemic status are recorded separately.

### Explicit non-claims

- `surfaceTemperature`: `UNSUPPORTED`
- `greenhouseResponse`: `UNSUPPORTED`
- regional climate/weather/transport: `UNSUPPORTED`

## P4 temporal authority

P4 remains sole owner of canonical time, event identity, ordering, replay, checkpoints, compaction, lineage and archives. Environment v2 promotes no endogenous atmospheric-loss generator and no private P5 clock. Integrated atmospheric loss remains `UNSUPPORTED` until a future version has sufficient stellar/upper-atmosphere state and a P4-bound transition law.

## XUV / escape

Canonical XUV evolution and atmospheric escape history remain `UNSUPPORTED`. Energy-limited escape may be useful as a diagnostic in future research but is not a universal transition law. Tian (2015) emphasizes the importance of detailed upper-atmosphere physics/chemistry and the continuing uncertainty in how escape shapes terrestrial atmospheres.

## Explicitly unsupported in v2

- mean surface temperature
- greenhouse climate
- regional atmospheric transport / weather
- water-phase model / high-pressure EOS
- actual ocean area fraction
- physical terrain elevation
- XUV evolutionary history
- endogenous atmospheric escape history
- geology / plate tectonics
- geochemical energy / nutrient indices
- gas-giant environment semantics

## Golden and independent verification

Golden corpus: `golden-p5-environment-v2-corpus-v1`.

Frozen candidate corpus digest: `7dfcbd70f307ef92307cf0a286344b57c1b40ea7854974a52ff6173b63824cc2`.

The Python oracle independently evaluates pressure and Tier-0 temperature using Python integers plus high-precision `Decimal`, and separately checks the exact rational fourth-root implementation. It includes Earth-like, zero forcing, full reflection, low forcing, high forcing and P3 maximum-insolation vectors.

## Scientific source registry

- IAU 2015 Resolution B3, recommended nominal conversion constants; nominal total solar irradiance `1361 W m^-2`.
- NIST 2022 CODATA fundamental constants table; Stefan–Boltzmann constant `5.670 374 419...e-8 W m^-2 K^-4`.
- NASA CERES / NASA GISS Earth energy-budget materials; global incoming/absorbed/outgoing radiative balance.
- NASA albedo educational material; physical albedo domain `0..1`.
- Morbidelli et al. 2012; Elkins-Tanton 2012; Tian 2015 for volatile-history and escape-governance limitations.

Retrieval/adjudication date: 2026-09-03.
