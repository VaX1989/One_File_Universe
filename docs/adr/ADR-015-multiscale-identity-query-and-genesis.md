# ADR-015 — Multiscale Identity, Query Context and Genesis Configuration

**Status:** Accepted

## Decision

OFU distinguishes permanent canonical identity from query context, model regime and mutable placement.

P2 makes the distinction concrete:

- `UniverseIdentity` binds the master seed and strict Semantic Generator Manifest hash;
- `CanonicalEntityIdentity` is **universe-scoped** and binds `UniverseIdentity + namespace + stableKey`;
- `QueryContext` describes an observation/query and does not rename an entity;
- `ModelRegime` describes the resolution/model regime and does not rename an entity;
- mutable location, containment and ownership do not implicitly participate in Entity Identity.

A domain may deliberately include immutable semantic material in its stable key, but callers must not smuggle transient query, location or ownership state into identity merely because it is convenient.

Genesis configuration that changes canonical initial conditions belongs in the Semantic Generator Manifest `genesis` field and therefore changes Universe Identity.

## Consequences

The same stable entity key in two different universes has different Entity Identity by construction. The same entity can move, change owner, be queried by different observers or be represented under different model regimes without accidental identity churn.
