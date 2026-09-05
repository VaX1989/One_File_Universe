# ADR-024 — Certified history and forward frontier DAG

**Status:** Proposed

## Context

The original P0–P12 roadmap contains valuable versioned history and scientifically careful phase closure. The expanded founder vision spans astronomy, planetology, biology, civilization, rendering, UX, runtime, microscopic models and future non-classical research that can no longer be represented honestly as one mostly linear phase sequence.

Rewriting old phase statuses would destroy provenance; forcing all future work into P7→P8→P9 would suppress legitimate parallel research and implementation.

## Decision

Use two complementary roadmap layers:

- **Layer A — Certified Development History:** preserves P0–P6 and prior release/product milestones exactly according to their declared scopes and evidence. Historical P7–P12 labels remain useful planning vocabulary.
- **Layer B — Forward Frontier DAG:** machine-readable planning metadata that encodes future workstream dependencies, maturity, authority, ownership and promotion prerequisites.

The frontier DAG is not canonical universe state. A workstream appearing in it does not authorize implementation or promotion, and `DONE_WITHIN_DECLARED_SCOPE` never means the whole scientific domain is permanently complete.

## Consequences

- Historical scientific claims and digests remain untouched.
- Future orchestration can derive parallel groups and critical paths mechanically.
- Research, presentation and canonical promotion can be represented separately.
- DAG/schema validation becomes a documentation/governance check.
- Changing future planning metadata does not change Universe Identity or generator semantics.
