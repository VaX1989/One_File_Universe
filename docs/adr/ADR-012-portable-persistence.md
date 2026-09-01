# ADR-012 — Portable Persistence Is Authoritative

**Status:** Accepted

## Decision
Canonical mutable state MUST have a portable export/import representation independent of any single browser-origin storage implementation.

Browser-local storage MAY be used for autosave, cache and convenience, but it is not the sole authoritative copy.

A portable save identifies Universe Identity, generator/event/schema lineage, event/checkpoint state and integrity metadata.

## Consequences
P1 must prove export→clear local/transient state→reopen→import→same canonical digest, including corruption detection and fail-closed behavior.