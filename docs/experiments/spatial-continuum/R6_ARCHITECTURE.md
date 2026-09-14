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

## R6-02 product integration and atomic window commits

Galaxy-window movement now uses the scheduler in the real direct-file product path. The previously committed field remains rendered and selectable while the next deterministic window is probed. A newer movement intent supersedes the prior request and composes from its pending spatial target, so rapid input still describes a continuous direction instead of repeatedly targeting the last settled cell.

Discovered entities are accumulated privately. R6 commits a complete bounded window atomically only when its request is still the owner of `ACTIVE_GALAXY_WINDOW`; cancelled or stale partial work cannot enter the materialization cache, graph, renderer, history, or canonical focus. Selection, Back, synchronous restore, and disposal cancel obsolete discovery explicitly.

The authority snapshot reports pending target, cursor work, slice count, item count, queue capacity, completions, cancellations, and stale-result attempts. The browser falsification test proves:

- the active window and scene remain unchanged while work is pending;
- browser timers and rendered frames advance between discovery slices;
- latest-intent supersession cancels the earlier request;
- only the composed latest target commits;
- Back cancels without mutating the active field;
- the scheduler and semantic working set remain bounded;
- the direct-file artifact makes no runtime network request.

R6 intentionally does not expose partial galaxy sets yet. Atomic bounded-window replacement has stable interaction semantics; progressively changing pick targets during navigation does not. Progressive presentation remains a possible later optimization only if it can preserve deterministic ordering, focus, and renderer-owned selection.

## R6-03 interactive seed bootstrap

The initial universe no longer performs a full sparse-window scan before exposing the product. It starts from the already-authoritative seed galaxy, renders that honest canonical result, marks the experience `INTERACTIVE`, and hydrates the remainder of the seed window through the same cancellable scheduler. Existing readiness consumers still receive `READY` after that hydration settles.

Input retains priority over bootstrap work. Moving to another cell, selecting the visible seed galaxy, navigating Back, or disposing the experience cancels hydration; no bootstrap completion can later overwrite the newer intent. In the Chromium software-rendered run used during development, interactive availability preceded a representative 3,501-probe neighbor result by roughly seven seconds. That does not make the underlying scan fast, but it removes the scan from the critical interaction path and makes the remaining latency measurable rather than frozen.

## R6-04 continuous macro cells

Galaxy windows are now bounded resident spatial cells rather than mutually exclusive pages. The authority retains the current cell plus relevant adjacent cells, flattens their canonical entities into one renderer-owned pick catalogue, prevents cross-cell identity duplication, and evicts cells beyond a strict resident-cell and adjacency budget. Each cell's presentation is offset relative to the current signed integer cell, so GPU coordinates remain bounded even when the address is extremely distant.

The one camera authority now carries a macro-space position. W/A/S/D moves it continuously at UNIVERSE scale. Crossing half a cell requests the relevant canonical neighbor without stopping camera input; changing direction cancels the obsolete request. On commitment, the cell origin and camera are rebased by the same exact presentation delta. The old cell moves to `-1`, the new cell becomes `0`, and the viewed objects retain their screen-space anchors.

The old field labels have been removed from the primary controls. The remaining buttons are optional keyboard-accessible Drift nudges over the same camera/streaming path, not direct state replacement. In the focused Chromium proof, two eight-galaxy cells coexisted in one scene, the prior cell survived handoff, the new cell added eight canonical identities, one camera and one scene remained authoritative, and the measured prior-object anchor displacement across rebasing was below `0.001 CSS px` on both axes.
