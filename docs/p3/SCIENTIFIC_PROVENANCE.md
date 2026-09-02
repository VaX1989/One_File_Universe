# P3 Scientific Assumptions and Provenance

**Status:** pre-freeze research/model note. P3 is a constrained generative astronomy skeleton, not a precision astrophysical simulator.

Exact parameter values in schema version `0` are provisional and must be re-reviewed before P3 freeze.

## Evidence map

| Model family | Evidence Class | Model Fidelity | P3 use | Important limitation |
| --- | --- | --- | --- | --- |
| Large-scale density field | HYPOTHETICAL | STYLIZED | correlated sparse galaxy occupancy | not an N-body/cosmological density solution |
| Galaxy mass/morphology/environment | EMPIRICALLY_CONSTRAINED | APPROXIMATE | correlated mass, morphology, age/metallicity proxies | not calibrated to reproduce an exact survey selection function |
| Stellar initial mass | EMPIRICALLY_CONSTRAINED | APPROXIMATE | Kroupa-shaped piecewise number fractions | bucketed/integer approximation, not exact inverse-CDF sampling |
| Stellar multiplicity | EMPIRICALLY_CONSTRAINED | STYLIZED | multiplicity incidence rises with primary mass | no full period/mass-ratio/eccentricity joint PDF |
| Stellar evolution proxies | ESTABLISHED | STYLIZED | mass + age -> coarse state and stellar proxies | no MIST/PARSEC track interpolation |
| Exoplanet occurrence | EMPIRICALLY_CONSTRAINED | STYLIZED | bounded planet counts correlated with host mass/metallicity/multiplicity | heterogeneous detection biases make one universal occurrence law unjustified |
| Planet mass/radius classes | EMPIRICALLY_CONSTRAINED | APPROXIMATE | rocky/volatile/ice/gas coarse classes and radius table | intentionally coarse; not an EOS/interior model |
| Moon occurrence | HYPOTHETICAL | STYLIZED | bounded coarse satellite counts | exomoon occurrence remains weakly constrained observationally |

## Galaxy population and morphology

GAMA DR4 provides low-redshift galaxy stellar-mass and morphology-resolved mass functions, while DEVILS/GAMA analyses support a strong dependence of morphology on stellar mass and a secondary environmental relationship. P3 therefore makes morphology depend on mass and environment rather than sampling a cosmetic class independently. The prototype does **not** claim that its generated percentages equal survey frequencies.

References:

- GAMA DR4 morphology/stellar-mass functions: https://academic.oup.com/mnras/article/513/1/439/6540978
- DEVILS morphology-density analysis: https://academic.oup.com/mnras/article/542/3/2128/8237468
- GAMA stellar-mass budget by galaxy type: https://academic.oup.com/mnras/article/457/2/1308/965191

## Stellar initial mass function

Kroupa's segmented IMF is the primary shape reference. The prototype integrates a Kroupa-like form into fixed number-fraction bins from 0.08 to 120 solar masses, then samples within each bin. This is deliberately approximate.

References:

- Kroupa (2001): https://academic.oup.com/mnras/article/322/2/231/962260
- Maschberger (2013): https://academic.oup.com/mnras/article/429/2/1725/1048250

## Stellar multiplicity

Moe & Di Stefano synthesize binary statistics across primary mass, mass ratio, period, and eccentricity. P3 keeps only the robust qualitative mass dependence in schema version `0`; detailed orbital distributions are deferred.

Reference: https://arxiv.org/abs/1606.05347

## Exoplanet occurrence

The NASA Exoplanet Archive is used as a current landscape/provenance source, not copied into the artifact. Occurrence studies remain selection- and host-dependent. Recent work on Kepler FGK stars found no statistically significant age trend over the studied range, while CARMENES work on very low-mass M dwarfs reinforces host-mass dependence for small/short-period planets. P3 therefore avoids imposing a strong canonical planet-occurrence-vs-age law.

References:

- NASA Exoplanet Archive: https://exoplanetarchive.ipac.caltech.edu/
- Sayeed et al. (2025): https://arxiv.org/abs/2501.13809
- Kaminski et al. (2025): https://arxiv.org/abs/2504.03364

## Planet mass-radius relation

Otegi et al. report distinct but overlapping rocky and volatile-rich populations and empirical mass-radius relations. P3 uses that split only as motivation for coarse composition classes and a bounded integer radius table; it does not claim a detailed interior solution.

Reference: https://doi.org/10.1051/0004-6361/201936482

## Moons

HEK VI constrained Galilean-analog occurrence around a specific warm-planet Kepler sample but did not establish a universal satellite occurrence law. P3 therefore classifies moon occurrence as HYPOTHETICAL/STYLIZED.

Reference: https://arxiv.org/abs/1707.08563

## Freeze requirement

Before P3 schema version 1, every empirical parameter retained as normative must be traceable to a source or explicitly labelled as a generative approximation. Distribution tests must test the implemented model's declared ranges, not retroactively present those ranges as observed universal truth.
