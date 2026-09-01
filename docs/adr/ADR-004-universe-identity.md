# ADR-004 — Universe Identity

**Status:** Accepted

## Decision
A canonical universe is identified by at least:

`MasterSeed256 + GeneratorManifestHash + CanonicalProtocolVersion`.

The seed is entropy, not a container for subsystem version bits. Generator lineage remains explicit.

## Consequences
Two artifacts using the same seed but different canonical generator manifests do not silently represent the same universe. Presentation-only changes do not create new universe identity.