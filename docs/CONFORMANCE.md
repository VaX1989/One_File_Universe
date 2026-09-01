# Conformance Model

## 1. Goal

Conformance exists to make OFU claims falsifiable. Passing on one developer machine is not portability.

## 2. Conformance layers

### Layer A — Artifact

Checks that the release is one HTML file, contains the declared manifests/payloads, and requires no application-owned external runtime resource.

### Layer B — Bootstrap

Checks direct-open behavior, capability detection, network independence, embedded payload decoding and controlled degradation.

### Layer C — Canonical kernel

Known-answer tests for addressing, deterministic derivation, numeric primitives, canonical serialization and hashing.

### Layer D — Generator domains

Golden vectors and invariants for every stable generator namespace.

### Layer E — Temporal state

Event ordering, replay, checkpoint equivalence, compaction, save import/export and migration tests.

### Layer F — Runtime independence

Golden Universe Corpus digest equality across the declared runtime matrix.

### Layer G — Performance budgets

Working-set, generation latency and renderer budgets for named benchmark profiles. Performance failure does not silently alter canonical semantics.

## 3. Runtime profiles

### Strict Direct-Open

Normative target:

- local single-file launch;
- no required network;
- no required secure-context-only feature;
- no SharedArrayBuffer dependency;
- portable authoritative save/export;
- WebGL2 baseline where graphics are required, with capability-aware fallback policy.

### Enhanced

Optional capabilities can include WebGPU, origin-bound persistent storage, SharedArrayBuffer where cross-origin isolation exists, and higher visual/compute budgets.

Enhanced MUST pass the same canonical corpus digest as Strict for the same Universe Identity and protocol.

## 4. Initial target matrix

The exact CI matrix is refined during P1, but the project intends to test representative current engines rather than only branded browsers:

- Chromium family;
- Firefox/Gecko;
- WebKit/Safari where automation infrastructure permits;
- x86-64 and ARM64 where runners/devices are available;
- Windows, Linux and macOS where applicable.

A platform absent from the executed evidence MUST be reported as unverified, not presumed passing.

## 5. Golden Universe Corpus

The corpus is a versioned set of:

- master seeds;
- Generator Manifest identities;
- canonical addresses;
- property/domain queries;
- edge values;
- expected canonical byte outputs or hierarchical digests.

The corpus must include ordering/concurrency tests demonstrating that unrelated query order cannot alter results.

## 6. Network-isolation verification

Strict testing should block or instrument network APIs and external resource requests. A passing result requires no required runtime request to remote or sibling resources.

The exact sandbox harness is a P1 deliverable because browser `file://` security behavior varies. The protocol records actual behavior rather than assuming uniform origin semantics.

## 7. Save conformance

Portable save tests include:

1. create universe and canonical mutations;
2. export save;
3. clear transient/browser-local state;
4. reopen artifact;
5. import save;
6. replay/resolve current canonical state;
7. compare canonical digest;
8. corrupt payload and verify fail-closed integrity behavior.

## 8. Evidence taxonomy

Each check is recorded as one of:

- `NOT_IMPLEMENTED`
- `TEST_DEFINED`
- `NOT_EXECUTED`
- `PASS`
- `FAIL`
- `PARTIAL`
- `ENVIRONMENT_LIMITED`

A release summary must not collapse PARTIAL or ENVIRONMENT_LIMITED into PASS.

## 9. P1 constitutional prototype gate

Before astronomy implementation becomes a priority, P1 must demonstrate with one tiny end-to-end artifact:

- modular sources -> deterministic single HTML;
- local/direct-open bootstrap;
- embedded executable payload, including a WASM experiment if retained as a candidate;
- Worker + transferable buffer path;
- WebGL2 baseline scene/diagnostic;
- WebGPU capability probe only, not dependency;
- portable save round trip;
- internal component manifest;
- known-answer canonical digest;
- network-independent operation;
- repeatable build experiment.

P1 exists to invalidate assumptions cheaply.