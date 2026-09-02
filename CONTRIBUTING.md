# Contributing to One File Universe

OFU is evidence-gated. Contributions are evaluated not only for whether they work locally, but for whether they preserve canonical semantics, portability and verification.

## Workflow

1. Start from the current `main` baseline.
2. Use a focused branch (`feature/`, `fix/`, `experiment/`, `docs/`).
3. Identify affected constitutional contracts/ADRs.
4. Add or update tests before claiming verification.
5. Run `npm test`.
6. Open a pull request describing semantics, risks, evidence and compatibility impact.

## Required PR questions

- Does this change canonical world meaning?
- Does it alter Universe Identity, Generator Manifest, event or save semantics?
- Which determinism class applies?
- Does it change Strict Direct-Open compatibility?
- Does it increase runtime working-set requirements?
- Does it introduce a new external runtime dependency? (Strict releases may not.)
- Which tests/invariants prove the claim?
- Is a new/superseding ADR required?

## Claim discipline

Use the project evidence taxonomy. Code existence is not verification. A test that has not run is not a PASS. A platform that was not tested is unverified.

## Experiments

P1/P2 explicitly encourage competing prototypes for languages, WASM strategy, numeric representations, PRF primitives, embedding/compression and rendering techniques. Experimental code must be labeled as such and must not silently become normative architecture.

## Generated artifacts

Large generated HTML artifacts should not be committed as ordinary source unless a phase-specific policy explicitly requires it. The repository is the source of truth; release artifacts are reproducibly generated products.

## Normative language

English is the normative project language. Use English for source identifiers, comments, documentation, ADRs, schemas, manifests, tests, CI output, issue/specification text, pull requests, commit/release descriptions and canonical user-facing terminology. Future localization may contain translations, but translations are non-normative and must not define canonical identifiers or semantics.
