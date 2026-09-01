# Record & Certification Specification

## 1. Principle

OFU may attempt records, but no single scalar such as raw HTML size or theoretical seed count is accepted as sufficient evidence of technical merit.

A certified release reports a **Record Vector** and the evidence behind every axis.

## 2. Record Vector

Minimum axes:

- **B — Artifact Bytes:** exact byte length of the release HTML.
- **CFP — Certified Functional Payload:** bytes attributed to reachable, non-padding, feature-mapped components.
- **E — Executable Extent:** executable JS/WASM/shader payload and measured reachable program surface.
- **F — Functional Coverage:** declared self-contained capability domains with passing conformance evidence.
- **C — Canonical Conformance:** percentage/status of required deterministic vectors passing across the declared runtime matrix.
- **Q — Procedural Quality:** diversity/quality/controllability metrics defined per generator domain; theoretical possibility count alone is excluded.
- **R — Reproducibility:** strength of build pinning and independent byte-identical rebuild evidence.
- **V — Verification Coverage:** tests/invariants/known-answer vectors mapped to certified features.
- **W — Working-Set Efficiency:** measured memory/time/GPU budgets under standard benchmark scenes.

Additional axes MAY be added by later protocol versions.

## 3. Anti-padding rule

Raw artifact size is factual and always reportable. A byte/component only counts toward CFP if the component manifest demonstrates that it is:

1. reachable by a supported feature or verification path;
2. assigned a documented purpose;
3. mapped to one or more feature IDs;
4. covered by at least one test, invariant or conformance check appropriate to its role;
5. not intentionally duplicated merely to inflate size;
6. included in the internal software/component manifest with cryptographic hash and byte size.

Generated lookup tables and assets MAY count when they provide genuine runtime capability, but their role and generation provenance must be disclosed.

## 4. Component manifest

Each certified component should expose:

```text
componentId
version
kind
hashAlgorithm
hash
compressedBytes
embeddedBytes
purpose
entrypoints
dependencies
featureIds
testIds
determinismClass
fidelityClass (where applicable)
```

The verifier must distinguish source/build metadata, executable payload, static domain data, tests, documentation/runtime help and optional assets.

## 5. Strict self-contained proof

A Strict certification must demonstrate:

- exactly one application artifact;
- no required network access;
- no required application-owned external files;
- no CDN or runtime package manager;
- no service dependency;
- canonical operation independent of optional origin-bound persistence.

A browser is the declared execution platform and is not misrepresented as "no runtime dependency".

## 6. Determinism evidence

Certification must identify:

- Universe Identity;
- Generator Manifest hash;
- canonical protocol version;
- Golden Universe Corpus version;
- reference digest;
- runtime/OS/architecture matrix;
- exact pass/fail result for each target.

Visual equivalence does not satisfy canonical conformance.

## 7. Reproducible-build evidence

A release candidate should publish:

- source commit SHA;
- source tree identity where available;
- build instructions;
- toolchain lock/manifest;
- environment normalization assumptions;
- artifact byte count;
- artifact SHA-256;
- Generator Manifest hash;
- component manifest hash;
- conformance report;
- independent rebuild comparison.

The application may self-verify embedded components; the entire-file artifact hash is an external certification property.

## 8. Procedural quality

OFU explicitly rejects `possible outputs = quality`.

Every high-level generator domain should eventually define metrics for some combination of:

- validity;
- causal coherence;
- novelty/diversity;
- coverage of intended behavior space;
- controllability;
- constraint satisfaction;
- perceptual/semantic distinctiveness;
- simulation consistency after refinement.

Metrics must be domain-specific. No universal arbitrary formula such as `features × tree-depth / bytes` is considered normative.

## 9. Claims taxonomy

Release claims use these states:

- `TARGET` — desired, not demonstrated;
- `IMPLEMENTED` — exists in code;
- `TEST_DEFINED` — verification exists but has not necessarily run in the release environment;
- `VERIFIED` — passed defined verification;
- `CROSS_RUNTIME_VERIFIED` — passed required runtime matrix;
- `REPRODUCIBLE` — independent build evidence matches required identity;
- `CERTIFIED` — all protocol requirements for the claim are satisfied.

Marketing text MUST NOT promote a TARGET or IMPLEMENTED claim to CERTIFIED language.

## 10. Record integrity

If an external organization later defines a formal record category, OFU may map this protocol to it. Until then, the project must describe records as project-defined and evidence-backed rather than imply third-party recognition.