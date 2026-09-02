# P3 Canonical Adversarial Review

**Review scope:** P3 schema `1`, model `p3-astronomy-1`, generator suite `p3-universe-skeleton` v1.  
**Disposition:** no known material design blocker after the remediations below; final closure still requires exact-head frozen-corpus CI completion.

## Material findings adjudicated

### 1. Historical prototype root was no longer the integration baseline

**Finding:** the pre-freeze prototype descended from the P2-era candidate rather than current certified `main`.  
**Remediation:** created `feature/p3-universe-skeleton` from certified main, transplanted only P3-owned prototype work, then non-force merged the later Cycle-2 integration main when main advanced during implementation. No P2 protocol weakening or history rewrite was used.

### 2. Schema-0 planet radius competed with P5 physical authority

**Finding:** prototype `radiusMilliEarth` and the old mass-radius prose would create duplicate canonical physical truth.  
**Remediation:** P3 schema v1 omits canonical planet and moon physical radius. `compositionClass` is projected as the explicitly coarse `bulkPriorClass`; P5 owns composition-aware physical radius. `equilibriumTempK` is also excluded from P3 v1 authority. The versioned P3 -> P5 adapter exposes only P3-owned baseline astronomical/formation constraints.

### 3. Genesis facts were ambiguously named as eternally-current facts

**Finding:** age, state, luminosity, orbit, mass and insolation names could be read as immutable present state despite P4 temporal evolution.  
**Remediation:** mutable/evolvable P3 facts are explicitly baseline-prefixed where necessary and bound to `P4_T0`. Current world state is defined as baseline plus P4 history plus versioned transition semantics.

### 4. Sector partition could accidentally become physical System identity

**Finding:** using Sector path identity would make identical physical sites sensitive to computational partitioning.  
**Remediation:** System canonical Address/identity remains normalized by `sector * 512 + localSite`; Sector remains computational only. Conformance checks actual resolver Addresses at `-1/0/511/512`, and an independent Python oracle verifies Euclidean split/round-trip behavior across `-4097..4097` plus explicit negative/positive boundary vectors.

### 5. Spatial density could exhibit partition artifacts

**Finding:** a schema-0 per-sector random occupancy jitter could create artificial density discontinuity.  
**Remediation:** retained the prototype fix that removes independent Sector jitter. P3 conformance verifies positive local density-field autocorrelation and bounded jumps at interpolation boundaries.

### 6. Planet/Moon canonical coverage was optional

**Finding:** an initially promoted test could pass without exercising a present planet or moon.  
**Remediation:** canonical conformance now performs a bounded deterministic search and requires present System, Planet and Moon samples. It checks ranges, absence semantics, prohibited radius/climate fields, P3->P5 projection, dependency budgets and Direct/Worker equivalence for Planet and Moon.

### 7. Browser matrix initially did not execute the canonical browser runtime

**Finding:** an early workflow draft labelled jobs as browser tests while invoking only the Node conformance program.  
**Remediation:** replaced with a real Playwright page execution loading P2 and P3 scripts inside Chromium/Firefox/WebKit. Linux Chromium, Windows Chromium and macOS ARM64 WebKit have already independently reproduced the pre-freeze Golden candidate; the final frozen head must repeat the complete matrix including Linux Firefox/WebKit.

### 8. Performance evidence initially measured the prototype surface

**Finding:** old diagnostics could not certify the canonical projection.  
**Remediation:** canonical performance/working-set evidence now resolves through `OFU.p3Astronomy`, pins `sourceSha`, enforces dependency budgets, and measures random Galaxy, repeated System and repeated Planet queries.

### 9. Scientific provenance contradicted schema v1

**Finding:** the retained pre-freeze provenance note still described schema-0 radius tables after radius authority moved to P5.  
**Remediation:** promoted the provenance document to schema-v1 language, removed the conflicting physical-radius claim, documented insolation/climate ownership and preserved explicit evidence/fidelity classes.

### 10. Evidence contamination and stale-head ambiguity

**Finding:** phase closure must not rely on mixed or stale reports.  
**Remediation:** P3 evidence files are P3-owned, include exact source SHA where applicable, run the generic evidence-isolation guard, and exact checkout is asserted before every certification job. Superseded workflow matrices are cancelled by branch-level concurrency.

## Golden candidate independently observed before freeze

At source `03ef2aff4cc855c89c813a8506e8272e817d89eb`, before writing the frozen vector but after required Planet/Moon coverage was introduced:

- manifest hash: `a6150302cbb9158014a1bb99592e13404b51973745fb32b4e66e57688ed4a34d`
- compact corpus: 9 records
- corpus digest: `f5406c3940fd443d9f800a2e63a3f13313b619e931b36489c071f6ca683cb4e0`
- Region digest: `33aeb20e65ff9ba8a0d82fce73d9ff9ec7b54d6a2af7d9f11d1cea35f5138d23`
- Galaxy digest: `5887ce485b5659fd3bd0d11f32a5301ec6a2e16c738046b1e9c396371ef3ee51`
- System digest: `0ef186a6052c086b663c88d26312686e219da0d50c9d7096c138bb402b4e820a`
- Planet digest: `c2f6bb2d2ce9c51b3047d0da9db2fd1d72c01c7a8dba37ee7302354ec8bf56ff`
- Moon digest: `f50ac0d18cb8cfe5232e928b25bb4d651d9b3cde64f4418cad9b1d63ae647014`

Those exact values agreed across Linux x64 Node, Linux x64 Chromium, Windows x64 Chromium and macOS ARM64 WebKit. They are now frozen in `golden-p3-corpus-v1.json`; this observation is supporting evidence, not a substitute for final exact-head certification.

## Scientific diagnostics observed on the same source

For deterministic `N=50,000` diagnostics:

- primary mass below 0.5 solar: `0.75958`
- primary mass at least 8 solar: `0.00698`
- multiplicity incidence proxies low/solar/high primary mass: `0.25300 / 0.45058 / 0.94840`
- spheroid proxy low/high galaxy mass: `0.03698 / 0.65580`
- adjacent density mean absolute delta: `268.265625`
- distant density mean absolute delta: `6912.06640625`

These are declared model diagnostics, not observational frequency claims.

## Dependency and performance evidence observed on the same source

Dependency metrics:

- System: 3 nodes, 45 derives, depth 1
- Planet: 6 nodes, 53 derives, depth 2
- Moon: 7 nodes, 56 derives, depth 3

Linux x64 Node v24.20.0 diagnostic timings:

- random Galaxy: ~1.284 ms/query
- repeated System: ~1.826 ms/query
- repeated Planet: ~2.118 ms/query

Heap delta in this short diagnostic was negative and is therefore treated only as a non-growth observation, not a stable memory benchmark.

## Remaining limitations accepted as non-blocking for P3

- the large-scale density field is stylized and is not an N-body cosmology;
- galaxy distributions are approximate and not survey-selection calibrated;
- stellar evolution uses coarse proxy knots, not precision evolutionary tracks;
- multiplicity does not model the full joint orbital distribution;
- planet occurrence is a bounded generative approximation across heterogeneous observational regimes;
- `bulkPriorClass` is intentionally coarse and is not physical composition realization;
- moon occurrence is weakly constrained and therefore HYPOTHETICAL/STYLIZED;
- no N-body dynamical evolution, P4 history, P5 physical planetology, climate, terrain, life, civilization or production rendering is implemented in P3.

These are scope/fidelity limitations, not contradictions of the frozen P3 v1 contract.

## Final review gate

P3 is adversarially acceptable as a canonical candidate only if the final exact source head reproduces the frozen corpus and all Foundation/P1/P2/P3 + browser matrix gates. Any frozen-digest drift, cross-runtime disagreement, identity/address failure, authority-boundary regression or dependency-bound breach reopens this review as a blocker.
