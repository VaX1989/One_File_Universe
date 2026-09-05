# WV-A Astronomy Successor Research Architecture

Status: `RESEARCH_ONLY`; non-canonical.

## Dependency DAG

```text
addressed cosmic environment latent
  -> galaxy population latent (GSMF scope/calibration)
  -> galaxy structural mixture + SFH/metallicity hyperparameters
  -> local stellar population (component weights, age, metallicity)
  -> stellar birth draw (IMF)
  -> multiple-system architecture
  -> stellar-evolution adapter boundary [NOT authoritative in r0]
  -> protoplanetary birth boundary prior
  -> downstream P5 successor input boundary [future only]

intrinsic population
  -> observational forward model
      -> distance/redshift/extinction/photometry
      -> measurement error
      -> survey-specific selection function
      -> observable comparison/oracle
```

No node requires global enumeration. Each entity is independently resolvable from a stable addressed key plus explicitly passed parent context. Research r0 has a declared dependency depth of 4 for `SYSTEM_BIRTH` and a fixed maximum of 31 hash-derived draws in that path.

## Candidate version and schema

```text
modelVersion  = wv-a-astronomy-depth-r0
schemaVersion = 0
canonical     = false
mode          = RESEARCH_ONLY
```

Future production lineage MUST use a new explicit version and semantic manifest. It MUST NOT reuse `p3-astronomy-1` or its namespaces as though outcomes were unchanged.

### GalaxyProfileCandidate

- `log10StellarMass`
- `morphology`
- `sizeKpc`
- `meanAgeGyr`
- `meanMetallicityDex`
- `sfhTauGyr`
- `environmentQ`
- uncertainty/fidelity envelope

### LocalStellarPopulationCandidate

- disk/bulge/halo mixture weights
- local age prior
- local metallicity prior
- normalized radial/vertical coordinates
- uncertainty/fidelity envelope

### SystemBirthBoundaryCandidate

- `primaryMassSolar`
- multiplicity architecture
- birth metallicity context
- stellar-population age context
- protoplanetary dust-reservoir prior
- environmental perturbation proxy
- explicit authority=`FORMATION_BOUNDARY_PRIOR_ONLY`

## Distribution choices in r0

- Galaxy stellar mass: GAMA DR4 total low-z double-Schechter *shape* over logM 7.0..12.5.
- Morphology: conditional mass/environment mixture with intentionally broad scatter; research approximation, not survey-fit posterior.
- IMF: Kroupa-like two-segment number IMF, continuity enforced at 0.5 Msun.
- Multiplicity: primary-mass-dependent thresholds; intentionally lower fidelity than the full Moe & Di Stefano joint distribution.
- Disk dust prior: median scaling proportional to `Mstar^1.5` with 0.70 dex scatter; only a young-disk empirical boundary proxy.

## Required invariants

1. Same key + same explicit inputs -> same output.
2. Query order cannot change any output.
3. Worker partition/order cannot change any output.
4. No global mutable RNG or enumeration state.
5. Bounded lookup dependency depth.
6. Intrinsic population is distinct from survey selection.
7. Every empirical parameter has provenance and a fidelity label.
8. No r0 output is canonical astronomical truth.
9. P3 v1 facts are never overwritten or silently reinterpreted.

## Verification performed on isolated local copy

```text
status                         PASS
queries                        600
worker partitions              2
repeat determinism             PASS
query-order independence       PASS
worker-order independence      PASS
IMF sample N                   20000
M < 0.5 Msun                   15083
0.5 <= M < 8 Msun              4782
M >= 8 Msun                    135
fitted disk log-log slope      1.4797640628664062
max dependency depth           4
max declared derive count      31
64-query corpus digest         8a923fb0bde07c7d5b5f461731840d5c668af75883000fbb9dc4be4bfe3446f0
```

Independent Python oracle:

```text
Kroupa number fraction M<0.5       0.7606678656365657
GAMA-shape stellar-mass fraction
logM in [9.6,11.6]                 0.908181493869172
```

## Sparse discovery / performance

A non-certifying Node v22.16.0 Linux x64 local benchmark over 20,000 `SYSTEM_BIRTH` lookups measured ~1,118.6 lookups/s on the available environment. This is only an engineering signal. It is not a repository certification because the repository targets Node 24.20.x and cross-runtime/browser evidence is absent.

## Remaining scientific gaps before a convergent candidate

- calibrate or replace the cosmic environment latent;
- fit morphology/structure conditionals against explicit survey products rather than heuristic thresholds;
- implement a joint multiplicity model over primary mass, period, mass ratio, eccentricity and hierarchy;
- implement a versioned rapid stellar-evolution authority and validate against SSE/MIST/PARSEC envelopes;
- model disk age/region/external-radiation effects rather than a single dust-mass proxy;
- build survey forward models with release-specific selection functions;
- replace research SHA-256 entropy shim with exact P2 address derivation after Wave V ownership allows it.
