# ADR-024 — Certified history and forward frontier DAG

**Status:** Accepted

**Ratified:** 2026-09-05 under the founder's Absolute Completion Mission; see
[program execution authority](../governance/V1_PROGRAM_EXECUTION_AUTHORITY.md)
and [v1.0 implementation contract](../governance/V1_IMPLEMENTATION_CONTRACT.md).
Acceptance is a forward architecture decision, not certification of unbuilt
capabilities or a change to frozen P0-P6 semantics.

## Context

The original P0–P12 roadmap contains valuable versioned history and scientifically careful phase closure. The expanded founder vision spans astronomy, planetology, biology, civilization, rendering, UX, runtime, microscopic models and future non-classical research that can no longer be represented honestly as one mostly linear phase sequence.

Rewriting old phase statuses would destroy provenance; forcing all future work into P7→P8→P9 would suppress legitimate parallel research and implementation.

## Decision

Use two complementary roadmap layers:

- **Layer A — Certified Development History:** preserves P0–P6 and prior release/product milestones exactly according to their declared scopes and evidence. Historical P7–P12 labels remain useful planning vocabulary.
- **Layer B — Forward Frontier DAG:** machine-readable planning metadata that encodes future workstream dependencies, maturity, authority, ownership and promotion prerequisites.

The frontier DAG is not canonical universe state. A workstream appearing in it does not by itself authorize implementation or promotion; the separate v1.0 program mandate supplies implementation authority, and `DONE_WITHIN_DECLARED_SCOPE` never means the whole scientific domain is permanently complete.

## Consequences

- Historical scientific claims and digests remain untouched.
- Future orchestration can derive parallel groups and critical paths mechanically.
- Research, presentation and canonical promotion can be represented separately.
- DAG/schema validation becomes a documentation/governance check.
- Changing future planning metadata does not change Universe Identity or generator semantics.
