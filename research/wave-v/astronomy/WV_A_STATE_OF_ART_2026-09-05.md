# WV-A Astronomy / Cosmic Structure — State of the Art

**Date:** 2026-09-05  
**Lane:** WV-A only  
**Mode:** `RESEARCH_ONLY` because `WAVE_V_PARALLEL_BASE_SHA` / `WAVE_V_PARALLEL_BASE_TREE` are not yet published.  
**Canonical effect:** NONE. P3 v1 remains untouched.

## Executive scientific result

A defensible P3 successor should not be a larger bag of independent random draws. The minimum scientifically useful successor is a causal, versioned provider stack in which a galaxy's mass, structure, star-formation history, metallicity history and environment constrain its local stellar populations; local stellar populations constrain the birth context of stellar systems; and that birth context exposes uncertain, explicitly non-authoritative protoplanetary boundary priors downstream.

The research architecture therefore separates:

1. **intrinsic generative population** — the latent universe model;
2. **observational forward model / selection function** — what a survey would detect;
3. **dynamical authority** — stellar/planetary time evolution, which is not created merely by sampling a present-day population.

This separation is required because survey catalogues are selected samples, not direct samples of an unbiased intrinsic population.

## 1. Galaxy population, morphology, structure and environment

### Established / empirical basis

GAMA DR4 provides a high-completeness low-redshift spectroscopic sample and a total plus morphology-resolved galaxy stellar mass function (GSMF). For the total z<0.1 GSMF, the research prototype uses the published double-Schechter *shape* parameters:

- `log10(M*) = 10.745`
- `log10(phi1*) = -2.437`
- `log10(phi2*) = -3.201`
- `alpha1 = -0.466`
- `alpha2 = -1.530`

The normalisation is deliberately not used as an absolute cosmological number-density claim in the prototype. GAMA reports that 90% of the stellar mass in its reconstructed low-redshift GSMF lies between about `10^9.6` and `10^11.6 Msun`; the independent oracle recovers 90.7156% for the adopted published shape over the prototype's integration range.

Morphology must not be assigned independently of mass. GAMA/DEVILS results show strong stellar-mass dependence and an additional, nontrivial dependence on local density. Newer GAMA work in 2025 explicitly measures environment-dependent GSMFs, and a 2026 GAMA model jointly treats stellar mass, sSFR, colour, half-light radius, Sérsic index and environment. The safe generative interpretation is therefore conditional and multivariate, not a cosmetic morphology label.

### Research decision

- Use a **GSMF-calibrated stellar-mass latent**.
- Condition structural mixture / morphology on stellar mass first and environment second.
- Preserve substantial scatter; never infer morphology from environment alone.
- Model local stellar structure as a mixture of disk, bulge/spheroid and stellar-halo components with bounded analytic profiles.
- Treat the environment field itself as a generative approximation until a cosmological population model is calibrated. Do not call it a physical density solution.

### Provenance

- Driver et al. 2022, GAMA DR4 and low-z GSMFs, MNRAS 513, 439: https://doi.org/10.1093/mnras/stac472
- Sbaffoni et al. 2025, environment-dependent GAMA GSMFs, A&A 696 A89: https://doi.org/10.1051/0004-6361/202453570
- Davies et al. 2025/2026, DEVILS morphology-density evolution, MNRAS 542, 2128: https://doi.org/10.1093/mnras/staf1468
- Baldry et al. 2026, multilayered GAMA characterisation, MNRAS 549: https://doi.org/10.1093/mnras/stag983
- Lange et al. 2015, GAMA mass-size relations, MNRAS 447, 2603: https://doi.org/10.1093/mnras/stu2467

## 2. Stellar populations, ages, metallicities and spatial structure

### Established / empirical basis

Modern Galactic archaeology shows that age, metallicity, position and kinematics are coupled and have large intrinsic scatter. APOGEE-based work with 178,825 red giants finds spatially varying age-metallicity structure and age-dependent radial metallicity gradients; older populations show flattening consistent with radial migration. This is direct evidence against assigning one age and one metallicity to an entire galaxy and then applying small independent jitter.

For external galaxies, SPS inference depends on star-formation history, metallicity, IMF, dust and other nuisance assumptions. Therefore the provider should expose **population distributions and uncertainty**, not claim a uniquely inferred history from a morphology class.

### Research decision

- Galaxy profile commits only broad population hyperparameters.
- Local position queries resolve component weights and local age/metallicity priors.
- Spatial gradients are normalized to structural scale rather than treating Milky Way numeric gradients as universal laws.
- Mutable chemical/stellar evolution is not frozen as timeless truth; future canonical current-state evolution must remain compatible with P4 transition/replay semantics.

### Provenance

- Anders et al. 2023, APOGEE spectroscopic ages and spatial trends, A&A 678 A158: https://doi.org/10.1051/0004-6361/202346666
- Conroy 2013, Modeling the Panchromatic SEDs of Galaxies, ARA&A 51: https://doi.org/10.1146/annurev-astro-082812-141017

## 3. Initial mass function and population synthesis

### Established / contested basis

A Kroupa-like segmented IMF remains a defensible baseline for a procedural population model, but strict universality is not settled. Reviews find broad evidence for a common Milky-Way-like IMF in many local populations while also documenting evidence for bottom-heavy IMFs in the inner regions of some massive early-type galaxies. Modern theory likewise permits environmental variation in some regimes but does not provide one observationally settled universal environment-to-IMF mapping.

### Research decision

- Default successor baseline: Kroupa-like two-segment number IMF (`alpha=1.3` from 0.08–0.5 Msun; `alpha=2.3` from 0.5–120 Msun, continuity enforced).
- **Do not enable environment-driven IMF variation canonically** in this research candidate.
- Future variable-IMF work must be a separately versioned law profile with observational falsification tests and strong fidelity labels.

### Provenance

- Kroupa 2001, MNRAS 322, 231: https://doi.org/10.1046/j.1365-8711.2001.04022.x
- Bastian, Covey & Meyer 2010, ARA&A 48, 339: https://doi.org/10.1146/annurev-astro-082708-101642
- Smith 2020, IMF variation in massive early-type galaxies, ARA&A 58: https://doi.org/10.1146/annurev-astro-032620-020217
- Hennebelle & Grudić 2024, physical origin of the IMF, ARA&A 62: https://doi.org/10.1146/annurev-astro-052622-031748

## 4. Binary and multiple-star populations

### Established / empirical basis

Multiplicity is strongly dependent on primary mass, and the period, mass-ratio and eccentricity distributions are coupled. Moe & Di Stefano combine multiple observing techniques, correct selection effects and fit joint distributions `f(M1,q,P,e)`. Their synthesis reports that the mean frequency of stellar companions with `q>0.1` and `log P(days)<8` rises from about `0.50 ± 0.04` per solar-type primary to `2.1 ± 0.3` per O-type primary.

### Research decision

- Multiplicity cannot be a single global probability.
- Research r0 uses primary-mass-dependent component-count thresholds and bounded, coupled companion properties.
- r0 is **not** a transcription of the full Moe & Di Stefano PDF and is labelled approximate.
- A promotion candidate should replace r0 thresholds with a tabulated/analytic joint distribution oracle derived from the published corrected distributions.

### Provenance

- Moe & Di Stefano 2017, MNRAS 464, 2302: https://doi.org/10.1093/mnras/stw2456

## 5. Stellar evolution approximation

### Established basis

For sparse procedural generation, an analytic or table-interpolated stellar evolution model is preferable to solving 1D stellar structure at lookup time. Hurley, Pols & Tout's SSE formulae provide rapid mass- and metallicity-dependent evolution and report typical agreement within about 5% of the detailed models used for their calibration. Modern MIST/PARSEC grids cover much broader detailed physics and are better references for validation envelopes and interpolation.

### Research decision

- r0 **does not claim stellar-evolution dynamical authority**.
- Candidate implementation path:
  1. implement an SSE-compatible fast baseline or precomputed track interpolation;
  2. validate luminosity/radius/temperature/lifetime/remnant regions against MIST/PARSEC fixtures;
  3. preserve versioned law/profile identity;
  4. feed mutable current-state transitions through P4 semantics rather than silently mutating P3 baseline facts.

### Provenance

- Hurley, Pols & Tout 2000, MNRAS 315, 543: https://doi.org/10.1046/j.1365-8711.2000.03426.x
- Choi et al. 2016, MIST I, ApJ 823, 102: https://doi.org/10.3847/0004-637X/823/2/102
- Bressan et al. 2012, PARSEC, MNRAS 427, 127: https://doi.org/10.1111/j.1365-2966.2012.21948.x

## 6. Protoplanetary/system boundary conditions

### Established / uncertain basis

Young-disk ALMA surveys establish large scatter and a positive disk-dust-mass versus stellar-mass relation. Pascucci et al. report power-law slopes about 1.3–1.9 depending on dust-temperature assumptions. Lupus observations also find a positive relation, while gas-mass estimates depend strongly on chemical/conversion assumptions. The 2026 Annual Review by Bai emphasizes that protoplanetary disks contain coupled non-ideal MHD, radiation, instabilities and winds; bulk disks appear weakly turbulent and magnetically driven winds may dominate angular-momentum transport, while early stages, inner regions, long-term evolution and environmental effects remain poorly constrained.

### Research decision

The astronomy lane may expose only **formation boundary priors**, not a completed planet-formation model:

- host mass, birth metallicity and local stellar-density context;
- a broad young-disk dust-reservoir prior with explicit scatter;
- an environment-perturbation class that is hypothesis-level only;
- no planet rerolling;
- no assertion that observed 1–3 Myr disk masses are literal primordial initial masses.

Detailed composition, disk chemistry, planet formation and planetary geophysics remain downstream authority.

### Provenance

- Pascucci et al. 2016, ApJ 831, 125: https://doi.org/10.3847/0004-637X/831/2/125
- Ansdell et al. 2016, ApJ 828, 46: https://doi.org/10.3847/0004-637X/828/1/46
- Bai 2026, ARA&A 64, 261: https://doi.org/10.1146/annurev-astro-043024-115835
- Andrews 2020, ARA&A 58, 483: https://doi.org/10.1146/annurev-astro-031220-010302

## 7. Observational uncertainty and selection effects

### Established basis

A generated intrinsic population must not directly reproduce raw catalogue histograms as though they were unbiased truth. Gaia EDR3 selection functions vary non-trivially with sky position, apparent magnitude and, for some subsets, colour; crowding and scanning law matter. GAMA similarly constructs explicit selection boundaries before estimating mass functions.

### Research decision

- Core providers generate **intrinsic facts only**.
- Survey comparison is a separate forward adapter: distance/redshift + extinction + photometry + measurement error + detection/quality selection.
- Statistical calibration tests compare forward-modelled observables to survey products.
- Selection effects never alter intrinsic addressed identity.

### Provenance

- Everall & Boubert 2022, Gaia EDR3 selection functions, MNRAS 509, 6205: https://doi.org/10.1093/mnras/stab3262
- Boubert & Everall 2022, selection-function toolbox, MNRAS 510, 4626: https://doi.org/10.1093/mnras/stab3665

## Scientific assumption ledger

| Item | r0 treatment | Classification | Promotion condition |
|---|---|---|---|
| Cosmic/large-scale environment field | Smooth address-derived latent field | GENERATIVE_APPROXIMATION / STYLIZED | Replace/calibrate against explicit cosmological/statistical target; retain sparse lookup |
| Low-z galaxy stellar mass | GAMA DR4 double-Schechter shape | EMPIRICAL_CALIBRATION / APPROXIMATE | Forward-selection validation + redshift scope declared |
| Morphology | Conditional on mass + environment with scatter | EMPIRICAL_CALIBRATION / APPROXIMATE | Fit conditional distributions to survey data; uncertainty intervals |
| Structural size/components | Analytic disk/bulge/halo mixture | EMPIRICAL_CALIBRATION / APPROXIMATE | Morphology-resolved mass-size oracle and component calibration |
| Age/metallicity | Galaxy + local-position distributions | EMPIRICAL_CALIBRATION / APPROXIMATE | SPS/archaeology validation and explicit galaxy-class scope |
| IMF | Fixed Kroupa-like baseline | EMPIRICALLY_CONSTRAINED / APPROXIMATE | Cross-check integrated number/mass fractions; no silent environment variation |
| Multiplicity | Mass-dependent approximate thresholds | EMPIRICALLY_CONSTRAINED / APPROXIMATE | Implement/validate joint `M1,q,P,e` target |
| Stellar evolution | No dynamical authority in r0 | ESTABLISHED MODEL FAMILY / NOT IMPLEMENTED | SSE/track implementation + MIST/PARSEC envelope + P4 transition contract |
| Young disk dust prior | `M*^1.5`, broad 0.70 dex scatter | EMPIRICAL_CALIBRATION / LOW FIDELITY | Region/age/selection-aware calibration; no primordial interpretation |
| Environmental disk perturbation | Coarse proxy | PLAUSIBLE_HYPOTHESIS / LOW FIDELITY | Explicit external irradiation/encounter model or remove |
| Survey selection | Required external adapter | EMPIRICALLY_CONSTRAINED | Forward-model validation per survey release |

## State-of-art conclusion

The scientifically valuable frontier is **not** more random detail. It is a versioned causal population model with explicit scope, observational forward modelling, uncertainty, and sparse hierarchical refinement. r0 implements only the portions that can be cleanly isolated and falsified now; the largest blockers to scientific promotion are the uncalibrated cosmic environment field, approximate conditional morphology/structure model, incomplete joint multiplicity model, absent authoritative stellar evolution implementation, and low-fidelity protoplanetary boundary calibration.
