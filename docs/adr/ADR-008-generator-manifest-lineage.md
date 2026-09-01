# ADR-008 — Generator Manifest and Lineage

**Status:** Accepted

## Decision
Canonical generators are versioned independently in a Generator Manifest whose canonical hash participates in Universe Identity.

A canonical-output-changing modification MUST update the relevant generator identity. Presentation-only changes MUST NOT.

## Compatibility
Historical artifact execution, compatibility windows and explicit migrations are permitted strategies. The newest artifact is not required to embed every historical implementation forever.

## Consequences
World evolution is explicit lineage, never silent reinterpretation.