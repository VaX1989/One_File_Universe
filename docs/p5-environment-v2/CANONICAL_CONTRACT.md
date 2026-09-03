# Advanced P5 Environment v2 — Canonical Contract

Status on this branch: **CANONICAL PROMOTION CANDIDATE**. Canonical/frozen status is acquired only after merge and exact-main certification.

## Compatibility and authority

Environment v2 is additive. It does not redefine `ofu-p5-planet-physical-v1`, `p5-planet-physical-1`, `p5-cube-sphere-topology-1` or `ofu-p5-p6-environment-v1`. The successor is:

- contract: `ofu-p5-p6-environment-v2`
- schema: `2`
- model: `p5-environment-2`
- atmosphere-state contract: `ofu-p5-atmosphere-state-v2`
- authority: `P5_CANONICAL`

The v2 boundary carries explicit authority/provenance and the epistemic vocabulary `KNOWN`, `DERIVED`, `HYPOTHETICAL_MODEL_VALUE`, `UNKNOWN`, `UNSUPPORTED`.

## Dedicated Semantic Generator Manifest

Environment v2 uses a P2-validated manifest, not the frozen P5 v1 physical manifest. It binds OFU-CBV-1, Canonical Address v1, Unicode `ofu-unicode-15.1.0-v1`, P2 numeric contract v1, P3 `p3-astronomy-1`, P4 `ofu-p4-temporal-v1`, P5 physical `p5-planet-physical-1`, terrain `p5-cube-sphere-topology-1`, atmosphere/radiative law profiles, evidence policy and explicit genesis/transition policies.

Manifest hash:

`f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`

Generator semantic changes require a new P2 manifest/derivation lineage.

## Atmosphere / volatile state

Stored canonical quantities use absolute teragrams (`1 Tg = 10^9 kg`) as non-negative `u64 BigInt`, reference `ABSOLUTE_MASS_NO_DENOMINATOR`. Conservation is exact:

`totalVolatileMassTg = atmosphericRetainedMassTg + condensedSurfaceMassTg + subsurfaceInteriorMassTg + lostMassTg`.

Bookkeeping evidence/fidelity: `ESTABLISHED / FORMAL`.

### Genesis policy

Environment v2 deliberately promotes **`NO_CANONICAL_GENESIS`**. The research volatile prior is not promoted because terrestrial volatile delivery, magma-ocean partition/degassing, impacts, recycling and escape are history/model dependent; available literature does not justify a universal generated atmospheric inventory for arbitrary canonical 1–8 Mearth terrestrial planets.

The unpromoted prior remains `HYPOTHETICAL / STYLIZED`. Canonical genesis atmosphere mass and derived pressure therefore remain `UNKNOWN`, not fabricated zero and not a random draw.

Scientific governance references: Morbidelli et al. 2012, *Building Terrestrial Planets*; Elkins-Tanton 2012, *Magma Oceans in the Inner Solar System*; Tian 2015, *Atmospheric Escape from Solar System Terrestrial Planets and Exoplanets*.

## Global surface column pressure

Semantic: `GLOBAL_SURFACE_COLUMN_PRESSURE`.

`p = M_atm * g / (4*pi*R^2)`

- `M_atm`: retained atmosphere mass, exact Tg→kg conversion;
- `g`: frozen P5 v1 surface gravity;
- `R`: frozen P5 v1 mean radius;
- deterministic area constant: `pi = 355/113` under this approximate spherical law profile;
- output: integer pascals, nearest ties-to-even exact rational evaluation.

Evidence/fidelity: `ESTABLISHED / APPROXIMATE`. This is global mean column weight, not local/weather pressure. Zero atmosphere produces exactly zero pressure; at fixed planet state increasing atmosphere mass cannot reduce pressure. Negative/out-of-domain/u64 values reject.

## Corrected Tier-0 radiative equilibrium

P3 `baselineInsolationPpm` is Earth-normalized stellar flux: `1_000_000 ppm = 1 S_earth`. Environment v2 freezes:

- IAU 2015 Resolution B3 nominal solar irradiance: `1361 W m^-2`;
- NIST/CODATA 2022 Stefan–Boltzmann constant displayed value: `5.670374419...e-8 W m^-2 K^-4`, frozen for this profile as exact rational `5670374419 / 10^17`.

From absorbed stellar power = emitted thermal power under uniform redistribution, unit longwave emissivity, no greenhouse/internal/background heat:

`pi R^2 S(1-A) = 4 pi R^2 sigma T_eff^4`

therefore

`T_eff = [S(1-A)/(4 sigma)]^(1/4)`.

Evidence/fidelity: `ESTABLISHED / APPROXIMATE` in the declared domain.

Canonical numeric path is integer/rational only: insolation ppm, Bond-albedo ppm (`0..1_000_000`), output millikelvin, exact integer fourth-root midpoint comparison, nearest ties-to-even. No persistent JavaScript floating-point authority exists.

Earth anchor: `S=1_000_000`, `A=300_000` → **`254_578 mK` (254.578 K)**. This corrects the research normalization that returned about 278 K for the same case.

Actual Bond albedo is not generated in v2 and remains `UNKNOWN`. The projection may expose the full physical albedo domain `0..1` as a deterministic mathematical envelope; it is not a prior, probability distribution or likely range.

**Effective radiative temperature is not mean surface temperature.** `surfaceTemperature` and `greenhouseResponse` remain `UNSUPPORTED`.

## P4 / XUV / transitions

P4 remains sole owner of canonical time, event identity/order, replay, checkpointing, compaction and lineage. Environment v2 has `privateClock=false` and promotes no endogenous atmospheric-loss transition. Stellar XUV history, integrated escape and upper-atmosphere evolution remain `UNSUPPORTED`; an energy-limited formula is not promoted as a universal history law.

## Explicitly unsupported

Mean surface temperature; greenhouse climate; regional transport/weather; water-phase/high-pressure EOS; physical ocean area; physical terrain elevation; canonical XUV evolution; endogenous escape history; geology/plate tectonics; geochemical energy/nutrients; gas-giant environment semantics.

## Golden corpus and independent oracle

Golden corpus: `golden-p5-environment-v2-corpus-v1`.

Corpus digest definition: SHA-256 of the OFU-CBV-1 encoding of the Golden corpus with the self-referential `corpusDigest` member omitted.

Frozen digest:

`ac33ba776976d1381a841426fb7e0fbb0276877e98565261bfdec2bca598d7a4`

Frozen shipped cross-runtime Environment v2 output digest:

`f6ecaea013a78f5f7a16acf2a0f2fa33f7f7ec816474df33be9f8b0fa41de0a2`

The independent Python oracle evaluates pressure and the physical Tier-0 equation with Python integers/high-precision `Decimal`, and independently verifies exact rational fourth-root rounding against Earth-like, zero/full-reflection, low/high forcing and P3 maximum-forcing vectors.

## Source registry

- IAU 2015 Resolution B3 — nominal solar irradiance.
- NIST 2022 CODATA fundamental constants — Stefan–Boltzmann constant.
- NASA CERES/GISS Earth energy-budget material — absorbed/emitted global energy-balance framing.
- NASA albedo material — physical albedo domain `0..1`.
- Morbidelli et al. 2012; Elkins-Tanton 2012; Tian 2015 — volatile-history/escape governance and limitations.

Scientific retrieval/adjudication date: 2026-09-03.
