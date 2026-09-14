# Spatial Continuum R6 — causal universe synthesis

R6 is stacked on exact R5 commit `5a4386d75f71e29007b9afa496de68b937fca9d6` / tree `2c90da0c5f606fd33acfa79d0fa24dd0647557ad`. Released V2 remains untouched.

## R6-01 cooperative discovery substrate

Sparse OFU discovery is deterministic but can consume thousands of expensive P3 probes synchronously. R6 begins with a bounded cooperative scheduler rather than hiding that work behind a loading animation.

Each request owns a canonical key and an interaction intent key. Work advances through a deterministic cursor in fixed probe-count slices, yielding to the browser between slices. Slice size, queue order, cancellation timing, and request history are excluded from entity identity. Partial results from cancelled requests never commit.

The scheduler provides:

- bounded pending work;
- priority with deterministic queue tie-breaking;
- explicit cancellation and `AbortSignal` support;
- latest-intent-wins supersession;
- progress snapshots;
- stale-work exclusion;
- scheduling-independent concatenation of canonical discovery order.

This first checkpoint proves the scheduling primitive in isolation. It does not yet claim the product discovery path is nonblocking; integration into open-universe authority and visible progressive materialization is the next dependency.
