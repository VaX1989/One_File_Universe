# ADR-005 — Canonical Sparse Addressing

**Status:** Accepted

## Decision
Objects and facts are addressed by exact canonical identifiers, not by traversal position in a materialized universe tree.

Addresses MUST use representations that preserve required integer precision. Values beyond JavaScript safe integer range MUST NOT rely on `Number` identity.

Semantic hierarchy is allowed, but random access MUST avoid enumerating unrelated ancestors/siblings.

## Consequences
The project targets sparse-addressed world semantics with bounded dependency depth. Human-readable addresses may exist, but canonical byte encoding is normative.