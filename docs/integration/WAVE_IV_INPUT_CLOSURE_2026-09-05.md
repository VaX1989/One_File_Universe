# Wave IV input and readiness closure investigation

## Exact starting evidence

Repository: VaX1989/One_File_Universe. Authorized branch:
`integration/wave-iv-massive-convergence-vertical-slice-2026-09-04`.

Original candidate: `326bb09594af5d226f81d12d4aeae92786f218cb`, tree
`ec4b84669489551479f0fb3c65a1195cda6421d7`.
Rendering Production run `33954385038` failed. A diagnostic-only source bundle
commit `fb0fae0fa50afa397a0658f6250b0ef26bd70ff0` preserved the same runtime;
run `33955475373` repeated the integrated-journey failure.

## Findings and repairs

1. **TEST_ORACLE_DEFECT:** the legacy integrated journey required native canvas
   `pan-y pinch-zoom`, while the Wave IV input owner intentionally implements
   application scale travel with `touch-action: none`. Changing only the string
   would not prove correctness. The replacement tests actual single-owner drag,
   pinch direction, one-finger continuation, cancellation, capture loss, blur
   cleanup, target/witness stability and native panel gesture availability.
   Chromium also receives trusted browser touch events; other engines explicitly
   report portable PointerEvent routing rather than physical input certification.
2. **INPUT_DEFECT:** the router did not clean its pointer map on capture loss.
   The legacy preview could become idle while the router retained a stale finger.
   The owner now handles capture loss, blur, hidden documents, selection changes
   and scene changes. Late loss events cannot clear another active finger, and
   a scene handoff during pinch cannot dereference a cleared gesture.
3. **STATE_OWNERSHIP_DEFECT:** resizing desktop Approach to mobile changed the
   projection-aware camera distance from about 2.859 to 4.951 planet radii, but
   left scale intent at the old anchor. The stronger pinch oracle reproduced the
   disagreement. Updating the active anchored framing now synchronizes scale
   intent through the scale owner; continuous travel is deliberately not snapped
   back to an anchor by resize.
4. **INTERMITTENT_STARTUP_TIMEOUT, ROOT CAUSE NOT ESTABLISHED:** Firefox's original
   warm reload timed out before detailed failure evidence was written. The same
   runtime passed the startup step in run `33955475373`. That successful run alone
   does not prove a fix or establish the cause. The harness now retains failure
   state, page errors and bounded console diagnostics, brings the page forward,
   uses a timer-polled semantic predicate with the same 30-second deadline, and
   exercises eight Firefox warm starts (three for other engines). No browser or
   readiness assertion is waived.

## Local evidence boundaries

The available local Node is 22.16.0 and the installed Playwright driver is
1.57.0-beta with system Chromium, not the pinned CI Node/Playwright versions.
The local browser administrator blocks direct `file://` navigation. An explicitly
labelled document-write harness exercised the complete Explore/Approach/Inspect/
Lab/mobile round trip and trusted Chromium touch on the modified working tree.
It passed, including stable canonical planet/environment/eligibility witnesses.
This is focused exploratory evidence, NOT direct-file certification and NOT an
exact-committed-head cross-browser seal. Hosted checks remain mandatory.

Physical-device status: **NOT_VERIFIED**. Required protected checks are unchanged.
The founder's superseding engineering-sequencing instruction is recorded in
`docs/governance/V1_PROGRAM_EXECUTION_AUTHORITY.md`.

## Second-pass closure: deterministic startup and renderer-specific coverage

Run `33956223782` at `d76d04576c989d9aeb33de5bd36332c15fc2b961`
passed the exact-head canonical/node/build gate. The integrated journey, including
its new gesture checks, passed on macOS WebKit, Linux WebKit and Windows Chromium.
The new Firefox failure artifact made the earlier intermittent startup issue
reproducible: a cold start was SUPPORTED, but the first warm reload selected a
P5_MASS_DOMAIN / UNSUPPORTED world, with no page error or network dependency.

**STARTUP_SELECTION_OWNERSHIP_DEFECT:** the inspector's default canonical address
uses siteX=8, while the certified rendering preview uses siteX=61. A browser-restored
Planet selector combined with newly created default address inputs caused the
inspector to select the former and the preview to follow it. This is not GPU
startup latency. Injecting the restored selector into the unchanged document
reproduced the same unsupported target locally.

The bootstrap now establishes an explicit initial selection: the build's exact
preview planet in rendering builds, or the declared template default in the
inspector-only build. It verifies the resulting identity. Browser form restoration
is not a selection authority, while subsequent explicit user queries remain fully
available. Bootstrap runs at the document event target before dependent preview
listeners, rather than at the later window bubble phase. Node regression tests
execute the real bootstrap for all seven restored entity types, both build modes,
subsequent user queries and malformed/mismatched manifests. Browser production
retains the unmodified cold and first warm lifecycle, then deliberately injects a
restored selector on subsequent reloads and checks exact inspector/preview identity.

**RENDERER_ORACLE_SCOPE_DEFECT:** the newly unblocked visual-closure test applied
the globe's spherical coverage mask after Close had correctly handed off to the
local Human renderer. The local snapshot has no globe LOD plan. The test now uses
the actual local camera, terrain session, renderer and budgets for that stage.
Its independent CPU ray/triangle samples are compared to WebGL framebuffer pixels;
a CPU-confirmed visible terrain intersection must not be background. No globe
pixel assertion is removed: Orbit/Approach retain the original spherical mask and
FV04 checks, and all three historical near-globe probes (1.35R, 1.05R, 1.012R)
explicitly exercise the hardened globe camera without invoking the newer semantic
surface handoff. Failures retain renderer-specific state rather than only a log.

The local document-write harness passes both the startup reproducer and desktop /
390x844 surface entry, reverse handoff, and historical near-globe camera probes.
The locally available browser has no usable WebGL2, so local framebuffer measurement
is explicitly NOT_MEASURABLE; it is not claimed as GPU or direct-file certification.
The required exact-head hosted matrix must establish those results.
