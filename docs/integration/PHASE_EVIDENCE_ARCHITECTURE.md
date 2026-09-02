# Phase-Owned Evidence Architecture

**Status:** STABLE_SNAPSHOT  
**Integration baseline:** `main@0d802f2af87e7db4ba9553f11cc9914c93a3cebc`  
**Purpose:** prevent cross-phase artifact contamination without weakening any phase's fail-closed evidence validation.

## Problem reproduced

On P4 head `14537ef25083787cc13b8c93a250995e8dacdc28`, Foundation, P1 and P4 conformance pass. P2 runtime/oracle/browser/reproducibility jobs also pass, but the P2 aggregate rejects:

`p2-build/evidence/p4-node-replay.json`

The rejection is correct: the document declares P4 semantics and an unsupported P2 evidence kind. The contamination occurs earlier because the P2 workflow invokes a generic test command that now includes P4 tests, P4 writes to a generic evidence directory, and the P2 build artifact uploads a generic `dist/` tree.

This is an evidence-ownership defect, not a P2 protocol defect.

## Required directory ownership

Generated conformance evidence MUST be phase-owned. The recommended layout is:

```text
dist/
  evidence/
    foundation/
    p1/
    p2/
    p3/
    p4/
    p5/
```

Equivalent typed artifact roots are acceptable if they provide the same isolation property. A generic shared evidence directory with phase files as siblings is not acceptable for canonical CI packaging.

Committed release evidence under `docs/` or `reports/` may use a different presentation layout, but every generated evidence document must preserve its phase and exact-source provenance.

## Artifact ownership

Phase workflows MUST upload only the artifacts they own.

Examples:

```text
p2-build            -> P2 build payload only
p2-evidence-*       -> dist/evidence/p2/**
p3-evidence-*       -> dist/evidence/p3/**
p4-evidence-*       -> dist/evidence/p4/**
p5-research-*       -> explicitly research-labelled P5 outputs
```

A phase-specific aggregate must never rely on filename filtering across an ambiguous mixed directory.

Build outputs and conformance evidence SHOULD be separate artifacts when practical. If a build artifact contains evidence, the included evidence subtree must still be phase-owned and explicit.

## Workflow execution rule

A phase-specific workflow MUST NOT depend on a generic command whose scope can silently expand when a downstream phase adds tests.

For P2, the workflow must execute the explicitly intended Foundation/P1/P2 commands and build/reproducibility checks. It must not acquire P3/P4/P5 execution merely because `npm test` was extended by a feature branch.

The same rule applies to later phases: their workflows may intentionally call frozen upstream gates, but each invocation and output destination must be explicit.

## Fail-closed rule is preserved

Isolation is not a license to weaken validation.

For a P2 evidence set:

1. every discovered evidence document must still validate as P2;
2. malformed documents fail the aggregate;
3. unknown P2 evidence kinds fail unless explicitly versioned/allowed;
4. a P3/P4/P5 document deliberately or accidentally inserted into the P2-owned evidence set MUST fail the P2 aggregate;
5. legitimate P4 evidence written to the P4-owned subtree MUST NOT be included in a P2 artifact in the first place.

The same symmetric rule applies to every later phase.

## Exact-source provenance

Every canonical conformance artifact must retain enough provenance to prove what source it certifies. Existing phase schemas remain authoritative for exact field names; this architecture does not redefine P2 evidence schema.

At minimum the evidence system must be able to establish:

- phase;
- evidence kind and schema/version;
- exact source commit SHA;
- exact workflow/run or equivalent execution identity where applicable;
- runtime/platform identity where applicable;
- PASS/FAIL outcome;
- digest/hash commitments required by the owning phase.

An aggregate must reject evidence that does not certify the intended exact source.

## Required regression tests

### EVIDENCE-ISO-001 — downstream evidence cannot contaminate upstream packaging

Run the P2 workflow on a tree that also contains valid P4 tests/evidence generation. The resulting P2 artifacts must contain only P2-owned evidence and P2 build outputs.

### EVIDENCE-ISO-002 — fail closed on injected foreign evidence

Deliberately place a valid `phase: P4` document inside the P2-owned aggregate input. P2 aggregation must fail.

### EVIDENCE-ISO-003 — generic test-scope growth cannot change P2 evidence scope

Extend the repository's generic test command with a synthetic downstream phase test. P2 workflow execution and artifact membership must remain unchanged because it uses explicit phase-scoped commands.

### EVIDENCE-ISO-004 — exact-source mismatch fails

Present otherwise valid phase evidence for a different source SHA. The owning phase aggregate must fail.

## P4 exit requirement

The P4 head that resolves the reproduced contamination is not integration-ready until exact-head CI reports all of:

- Foundation PASS;
- P1 PASS;
- P2 PASS;
- P4 PASS.

The P2 aggregator must remain fail-closed throughout the fix.
