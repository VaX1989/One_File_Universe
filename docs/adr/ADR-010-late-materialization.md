# ADR-010 — Constraint-Safe Late Materialization

**Status:** Accepted

## Decision
Fine-grained detail may be generated lazily, but MUST respect all canonical facts already committed at coarser levels.

Normative direction:

`CommittedFacts -> Constraints -> DetailGeneration`

not

`RandomDetail -> hope it matches history`.

## Consequences
Refinement requires property tests. A newly materialized ruler, ruin, species or artifact may elaborate history but cannot contradict a previously canonical extinction, regime collapse, geography or other relevant fact without explicit migration/new lineage.