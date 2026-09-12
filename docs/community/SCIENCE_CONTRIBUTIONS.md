# Scientific and Model Contributions

OFU welcomes scientists, engineers, students, domain experts, and careful modelers. Scientific-looking output is not automatically scientific authority.

## Model card requirement

A contribution that introduces or materially changes a scientific/model mechanism should provide, in machine-readable or reviewable form as appropriate:

- model name/version;
- authority and fidelity class;
- equations/mechanism and references;
- inputs/outputs and units;
- valid domain and boundary conditions;
- invariants or conserved quantities where applicable;
- calibration or empirical constraints where applicable;
- uncertainty/error treatment;
- known approximations and omitted physics/biology/social mechanisms;
- forbidden claims or precision that the model must not imply;
- deterministic behavior and numerical assumptions;
- validation/oracle evidence;
- dataset provenance and licensing.

## Authority discipline

A research fixture, plausible equation, literature citation, or attractive visualization does not automatically promote output to canonical truth. Promotion must use the authority process defined by the architecture/Constitution.

`UNKNOWN`, `UNSUPPORTED`, and unresolved states are preferable to fabricated precision.

## Literature and evidence

Prefer primary literature, standards, authoritative datasets, validated reference implementations, and independent numerical oracles where appropriate. Cite exact versions and domains rather than relying on vague “scientifically accurate” claims.

## Data licensing

A dataset that can be downloaded is not necessarily redistributable inside OFU. Single-file embedding requires explicit compatible rights and provenance under `THIRD_PARTY_POLICY.md`.

## Reproducibility

Scientific tests should declare units, tolerances, environment assumptions, seeds/fixtures, and expected failure boundaries. Do not tune tolerances solely to make a failing implementation pass without scientific or numerical justification.
