# Contributing to One File Universe

## Normative language

English is the normative project language. Use English for source identifiers, comments, documentation, ADRs, schemas, manifests, tests, CI output, issue/specification text, pull requests, commit/release descriptions and canonical user-facing terminology.

Localization resources may contain translations when localization is deliberately introduced. Such translations are non-normative and must not define canonical identifiers or semantics.

## Evidence discipline

- Do not describe unexecuted tests as PASS.
- Preserve the evidence taxonomy used by the repository.
- Record runtime, platform and toolchain details for conformance or performance claims.
- Treat green CI as necessary but not sufficient when a known valid review finding remains unresolved.

## Constitutional changes

A change to a constitutional MUST requires an ADR and a compatibility impact statement. Do not silently redefine canonical identity, addressing, serialization, derivation, numeric semantics or persistence compatibility in an implementation-only commit.

## Release artifact

The release product remains one self-contained HTML artifact. Build and test dependencies must not become application-owned runtime dependencies.
