# Wave IV viewport closure - 2026-09-05

## Exact visual evidence reviewed

Full v09 artifact at `b54b5a2453cc31cf892715b4e515414435eb585c`,
Wave IV run `33956735121`, artifact `9966633065`.
Downloaded archive SHA-256:
`748fb6073c5f5e7ea59019b47d2586b0ea912bd6a7878dc4f24498fb31578ea7`.

Reviewed fresh desktop and 390x844 screenshots for Galaxy, stellar neighborhood,
System, Orbit, Approach, Global Surface, Regional Surface, Local Surface and Human.
The review is of the full Wave IV build, not the smaller v08 foundation artifact.

Two material viewport defects remained despite the traversal checks passing:

* The fixed 2.16R Global Surface camera could crop most of the globe on portrait
  screens, contradicting its whole-world framing. The globe handoff now uses the
  presentation sphere and actual viewport projection, with 92% limiting-axis
  occupancy and the existing safety minimum. Resize events reapply this framing
  through the same owner. Semantic scale intent remains separate from framing.
* The mobile context hint overlapped the selected-world identity banner. In planet
  scenes it now sits above the scale rail, outside the identity banner. Macro
  scenes keep the unobstructed top hint. Narrowest layouts retain their existing
  compact policy.

The browser traversal now asserts full-limb visibility, a bounded projected
occupancy, and no mobile hint/title overlap. A local document-write layout probe
passed desktop, 390x844, 360x800, 320x700, landscape and return-to-desktop resizing
without a new scale request. This is geometry/layout evidence, not GPU, direct-file
or physical-device certification. Fresh hosted evidence is still required.

## Surface oracle accounting correction

Rendering Production `33956735088` passed startup, warm-reload and integrated
journeys across its browser matrix, then exposed an error in the newly introduced
surface oracle: it expected a globe-wrapper `lifecycleAccountingExact` flag on the
surface's raw GPURegistry counters. The surface exposes counters, not that flag.

The assertion now independently checks integer/nonnegative counters, creation =
deletion + context invalidation + live buffers, two terrain buffers per live mesh,
and terrain + microdetail byte accounting, alongside the unchanged resource caps.
Six corrupt-counter fixtures must fail. The active-mesh CPU-ray/framebuffer test
is retained unchanged in substance. Missing geometry is not waived.

No canonical scientific component, historical release, protected check, required
browser or physical-device status is changed by these repairs.
