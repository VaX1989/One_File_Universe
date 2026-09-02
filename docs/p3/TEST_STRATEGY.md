# P3 Test and Conformance Strategy

**Status:** prototype strategy; Golden bytes intentionally not frozen before P2 closure.

## Implemented prototype checks

`tests/p3/run-p3-prototype-tests.mjs` covers:

- same query -> same canonical result;
- same stable key in another universe -> different identity;
- query-order independence;
- signed Region boundary ownership;
- parent/relationship identity coherence;
- Sector partition marker and physical System stable-key normalization;
- star/planet/moon bounds and positive physical proxies;
- explicit absent-slot semantics;
- unrelated presentation/query metadata has no effect;
- direct-query dependency/derivation budgets;
- deterministic statistical shape checks for IMF, multiplicity, morphology, and density diversity;
- direct vs Node Worker canonical digest agreement.

`tests/p3/p3-prototype-performance.mjs` measures cold/repeated/random entity queries and reports heap deltas plus dependency metrics. Timing and heap numbers are diagnostic, not normative.

## Deferred until P2 final candidate

- freeze `P3 Golden / Conformance Corpus v1`;
- independent implementation/oracle for P3 domain facts;
- browser direct/Worker/reordered/batched matrix;
- Linux Chromium/Firefox/WebKit plus declared Windows/macOS targets;
- exact-head evidence pinning;
- reproducible release build including P3;
- larger spatial autocorrelation and boundary-artifact analysis;
- adversarial corpus for all integer/resource bounds.

## Golden-corpus rule

No digest produced by schema version `0` is a normative Golden digest. Representative digests printed by prototype tests are ephemeral evidence only. Golden vectors may be committed only after the branch is rooted in the actual P2 final candidate and the P3 schemas/model parameters are approved for freeze.
