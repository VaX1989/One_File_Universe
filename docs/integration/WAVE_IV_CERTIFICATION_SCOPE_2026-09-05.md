# Wave IV certification composition closure

## Reproduction

Rendering Production run `33957192995` at
`197044377b529357d421dfa15f58798f04632451` exposed a certification-scope
defect, not a reason to weaken the surface oracle. Its Windows artifact
`9966781759` has archive SHA-256
`6bc3666c678371a98aad4d67d823491951adbf1f361605252673a269237812ea`.

The historical v08 foundation build contains the early 16 m, 5-by-5 terrain
neighborhood. At the 65 m Human camera pose none of its triangles intersect the
165 sampled view rays. The full Wave IV build includes the bounded frustum-aware
terrain provider; the same independent CPU oracle finds 105 visible intersections
in its 24-patch plan. Its 64 m patches cover the view rather than merely the
camera's ground position. Synthetic planes separately verify analytic center-ray
distance, winding, floating-origin translation, empty scenes and missing pixels.

## Corrected certification scopes

Rendering Production explicitly certifies two artifacts at one source commit:
the foundation retains every historical startup, product and gesture regression;
then visual closure builds the full Wave IV product and tests its actual active
scale controls, renderers and terrain composition. The exact-head build job
reproduces both scopes and archives separately named manifests. The primary
artifact is the full product. Full-product visual tests reject a foundation-only
manifest. Retired legacy controls are not clicked invisibly by automation.

System must own the visible macro canvas. Local coverage still requires at least
eight independently confirmed mesh intersections with zero background holes.
Orbit/Approach sphere coverage, FV04, all three historical near-globe probes and
three repeated scale cycles remain mandatory. Five platform-qualified visual
record names prevent artifact-merge collisions between the Chromium platforms or
the WebKit platforms.

The production seal checks all five foundation records and all five full-product
records against their respective artifact bytes, hashes and manifests. Both must
share the exact source and unchanged canonical witnesses. A full-product hash
cannot be substituted for a foundation hash or vice versa. Twelve adversarial
schema fixtures reject missing/duplicate records, wrong source/hash, corrupted
bytes, absent/failed pixels, false device claims and omitted navigation evidence.
These fixtures are not runtime measurements and are never production evidence.

## Evidence boundaries

The independent pure ray oracle is shared by browser evidence and Node regression
fixtures. A local document-write focused journey passed actual scale-button
navigation, both viewport classes, local entry, reverse handoffs and historical
near-globe probes. This environment cannot establish direct-file or GPU evidence;
those remain exact-head hosted requirements. The full nine-scale platform matrix
and convergence seal remain part of the promotion decision.

No browser, canonical check, globe coverage check, surface no-hole requirement or
protection rule is removed. Physical Android/iOS status remains NOT_VERIFIED.
