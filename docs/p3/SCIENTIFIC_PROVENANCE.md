# P3 Scientific Assumptions and Provenance v1

**Status:** normative provenance for P3 schema `1` / model `p3-astronomy-1`. P3 is a constrained generative astronomy skeleton, not a precision astrophysical simulator.

The sources below motivate model shape and evidence classification. They are not copied datasets and they do not make the implemented distributions observationally exact. Exact integer constants belong to the versioned generator law profile and are tested as declared model invariants.

## Evidence map

| Model family | Evidence Class | Model Fidelity | P3 v1 use | Important limitation |
| --- | --- | --- | --- | --- |
| Large-scale density field | HYPOTHETICAL | STYLIZED | correlated sparse galaxy occupancy | not an N-body/cosmological density solution |
| Galaxy mass/morphology/environment | EMPIRICALLY_CONSTRAINED | APPROXIMATE | correlated mass, morphology, age/metallicity proxies | not calibrated to an exact survey selection function |
| Stellar initial mass | EMPIRICALLY_CONSTRAINED | APPROXIMATE | Kroupa-shaped piecewise number fractions | bucketed integer approximation, not exact inverse-CDF sampling |
| Stellar multiplicity | EMPIRICALLY_CONSTRAINED | STYLIZED | multiplicity incidence rises with primary mass | no full period/mass-ratio/eccentricity joint PDF |
| Stellar evolution proxies | ESTABLISHED | STYLIZED | baseline mass + age -> coarse state and stellar proxies | no MIST/PARSEC track interpolation |
| Exoplanet occurrence | EMPIRICALLY_CONSTRAINED | STYLIZED | bounded planet counts correlated with host mass/metallicity/multiplicity | heterogeneous detection biases make one universal occurrence law unjustified |
| Planet bulk prior | EMPIRICALLY_CONSTRAINED | APPROXIMATE | `TERRESTRIAL|VOLATILE_RICH|ICE_GIANT|GAS_GIANT` coarse formation prior | P3 does not freeze detailed composition or physical radius |
| Moon occurrence | HYPOTHETICAL | STYLIZED | bounded coarse satellite counts | exomoon occurrence remains weakly constrained observationally |

## Galaxy population and morphology

GAMA DR4 provides low-redshift galaxy stellar-mass and morphology-resolved mass functions, while DEVILS/GAMA analyses support strong morphology dependence on stellar mass and environmental relationships. P3 therefore couples morphology to mass and environment rather than drawing a cosmetic class independently. P3 does **not** claim its generated percentages reproduce survey frequencies.

References:

- GAMA DR4 morphology/stellar-mass functions: https://academic.oup.com/mnras/article/513/1/439/6540978
- DEVILS morphology-density analysis: https://academic.oup.com/mnras/article/542/3/2128/8237468
- GAMA stellar-mass budget by galaxy type: https://academic.oup.com/mnras/article/457/2/1308/965191

## Stellar initial mass function

Kroupa's segmented IMF is the primary shape reference. P3 integrates a Kroupa-like form into fixed number-fraction bins from 0.08 to 120 solar masses, then samples deterministically within each bin. This is deliberately approximate and uses integer/fixed-point authority.

References:

- Kroupa (2001): https://academic.oup.com/mnras/article/322/2/231/962260
- Maschberger (2013): https://academic.oup.com/mnras/article/429/2/1725/1048250

## Stellar multiplicity

Moe & Di Stefano synthesize binary statistics across primary mass, mass ratio, period and eccentricity. P3 v1 retains only the robust qualitative dependence of multiplicity incidence on primary mass; detailed joint orbital distributions remain outside the P3 skeleton.

Reference: https://arxiv.org/abs/1606.05347

## Exoplanet occurrence

The NASA Exoplanet Archive is a landscape/provenance source, not embedded canonical data. Occurrence studies remain selection- and host-dependent. Work on Kepler FGK stars reported no statistically significant age trend over the studied range, while very-low-mass-host surveys reinforce host-mass dependence for small/short-period planets. P3 therefore avoids imposing a strong canonical planet-occurrence-versus-age law.

References:

- NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/
- Sayeed et al. (2025): https://arxiv.org/abs/2501.13809
- Kaminski et al. (2025): https://arxiv.org/abs/2504.03364

## Planet bulk prior and P5 ownership

Otegi et al. provide evidence for distinct but overlapping rocky and volatile-rich populations and empirical mass-radius relationships. P3 uses that literature only to motivate a **coarse bulk formation prior**. Canonical P3 v1 intentionally does **not** retain the schema-0 `radiusMilliEarth` output and does not claim a detailed composition/interior solution. P5 owns composition-aware physical radius under a versioned refinement contract.

Reference: https://doi.org/10.1051/0004-6361/201936482

## Insolation and climate boundary

P3 v1 retains baseline incident-flux/insolation as an astronomical constraint derived from baseline stellar luminosity and orbit. It does not freeze an equilibrium-temperature or climate state. Albedo, atmosphere, greenhouse physics, hydrosphere and climate belong downstream to P5 or later domain semantics.

## Moons

HEK VI constrained Galilean-analog occurrence around a specific warm-planet Kepler sample but did not establish a universal satellite occurrence law. P3 therefore classifies moon occurrence as HYPOTHETICAL/STYLIZED and does not freeze a canonical physical moon radius.

Reference: https://arxiv.org/abs/1707.08563

## Spatial model

The multi-octave density field is a deterministic generative device, not a claim to reconstruct the cosmological matter field. P3 conformance tests its intended positive local autocorrelation and interpolation-boundary continuity. Galaxy-cell, Region, Sector and System-site scales are versioned model choices; Sector is explicitly a computational partition, while System identity is normalized to absolute site coordinates.

## Scientific freeze rule

Every P3 v1 empirical claim is either source-motivated and classified above or explicitly labelled as a generative approximation. Statistical conformance tests validate the **declared implemented model**, not universal astronomical truth. Any future calibration that changes canonical outcomes requires a new versioned generator/model lineage rather than silently mutating `p3-astronomy-1`.
