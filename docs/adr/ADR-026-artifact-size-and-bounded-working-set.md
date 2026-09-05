# ADR-026 — Large distribution artifact and bounded runtime working set

**Status:** Proposed

## Context

OFU's canonical distribution is one self-contained HTML artifact. The project constitution already prohibits artificial payload inflation and requires a bounded working set, but the long-range universe may legitimately embed richer scientific reference data, shaders, tests, assets, model families and diagnostics. Optimizing for minimum HTML bytes would conflict with useful depth; treating large file size as permission for large resident state would conflict with browser viability.

## Decision

Clarify two independent budgets:

- **distribution artifact size** may grow substantially when bytes provide useful governed capability or evidence;
- **runtime materialized working set** remains explicitly bounded by CPU, heap, GPU, queue and simulation budgets.

Tens or hundreds of megabytes, or larger artifacts, are architecturally permissible when distribution and startup evidence supports them. Padding, duplicate unreachable payload and meaningless inflation remain forbidden.

Large embedded payloads should be indexed/staged/decoded/materialized on demand where practical. Strict Direct-Open remains the portability baseline; large-artifact evolution cannot silently introduce required external runtime resources.

## Consequences

- Artifact size is measured separately from startup amplification, resident heap and GPU state.
- The optimization target is useful universe capability per acceptable runtime cost, not minimum bytes.
- Future certification must report both distribution and runtime-resource evidence.
- This decision does not mandate a particular compression, binary embedding or streaming implementation.
