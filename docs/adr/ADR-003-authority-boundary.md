# ADR-003 — Canonical / Derived / Presentation Boundary

**Status:** Accepted

## Decision
OFU separates state into:

1. canonical procedural facts;
2. canonical mutable overlay;
3. derived simulation/cache state;
4. presentation state.

Only the first two define portable world meaning. Derived and presentation state MUST be rebuildable and MUST NOT silently become authoritative.

## Consequences
GPU particles, interpolation, visual noise, transient meshes and frame-dependent effects may be nondeterministic. Orbit identity, irreversible world events, inventory, extinctions and other declared canonical facts may not.