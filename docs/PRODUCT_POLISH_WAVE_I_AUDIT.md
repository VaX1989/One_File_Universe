# Product Polish Wave I — Product Audit and Disposition

Baseline: `8c9428242d3fc9958ebc8e4395a8990ecf25f1ef` / tree `243a6bcd991d079ca82108247a15b54af68e754b`.

This wave is presentation and product engineering only. P1–P6 canonical model authority, deterministic witnesses, sparse addressing semantics, P5 terrain meaning, Environment v2 authority, and P6 eligibility semantics are not modified.

## Forensic architecture

Canonical path: Boot → Universe Identity → sparse Inspector query → selected canonical entity → P5 realization → presentation renderer → scientific inspection → P4 temporal lab → portable archive/provenance.

The v0.6 implementation surfaced this engineering sequence almost directly. Wave I changes the visible hierarchy without changing authority:

- **Explore** — selected object, viewport, continuous scale, concise scientifically safe state.
- **Inspect** — sparse canonical query and canonical/derived evidence.
- **Lab / advanced** — temporal kernel, archives, provenance, build and renderer diagnostics.

## Product-debt register

| Finding | Severity | Baseline evidence | Journey | Repair | Canonical risk | Verification |
|---|---|---|---|---|---|---|
| Engineering-first flat hierarchy | IMPORTANT | diagnostics/provenance/query/lab all primary | first open | Explore/Inspect/Lab disclosure | LOW | browser semantics + screenshots |
| Raw digest dominates identity | IMPORTANT | HUD canonical planet is digest prefix | orientation | canonical address label + full stable ID inspection | LOW | product browser assertions |
| Canvas forced to `role="application"` | IMPORTANT | assigned at runtime | screen reader | conventional focusable canvas semantics | LOW | semantic assertions/manual review |
| `touch-action:none` scroll trap risk | IMPORTANT | baseline CSS | mobile/touch | permit `pan-y pinch-zoom`; robust pointer cancellation | LOW | automated pointer evidence; real device NOT_VERIFIED |
| Diagnostics rewritten each frame | IMPORTANT | RAF HUD updates | performance | bounded ~4 Hz presentation updates | NONE | update cadence test |
| Generic responsive stacking | IMPORTANT | coarse media queries | tablet/mobile | viewport-first breakpoints and single-column Inspector | NONE | 1440/1024/768/390/320 matrix |
| No reduced-motion camera path | IMPORTANT | interpolation always active | accessibility | snap nonessential interpolation under reduced motion | NONE | media-emulation test |
| Unsupported state product-weak | IMPORTANT | resource clearing exists but weak recovery UI | retarget | neutral viewport and understandable reason | LOW | real unsupported gate + visual test |
| Input failures expose technical errors | IMPORTANT | query/archive can throw | query/archive | deterministic preflight and understandable feedback | LOW | invalid-input tests |
| No meaningful nonvisual transition announcements | IMPORTANT | dynamic diagnostics only | assistive tech | polite live region for meaningful state changes only | NONE | semantic assertions |
| Monospace dominates product identity | POLISH | root font | first open | system UI typography; mono only technical | NONE | screenshots |
| Epistemic vocabulary is fragmented | IMPORTANT | raw status strings | scientific understanding | canonical/derived/presentation/unsupported vocabulary and guardrails | MEDIUM | copy audit + canonical tests |
| Real Safari/iOS/Android/physical touch unavailable | FOLLOW-UP | hosted automation only | device confidence | strict NOT_VERIFIED language | NONE | evidence metadata |

No TEST-ONLY control is visible in normal production interaction.

## Scientific communication disposition

The product explicitly preserves canonical model authority vs presentation-only rendering; `INSUFFICIENT_ENVIRONMENT` vs sterile/dead/uninhabitable/lifeless; unknown vs unsupported vs absent vs not evaluated; dimensionless/stylized P5 terrain displacement vs physical topographic metres; and effective radiative temperature vs physical surface temperature. No oceans, weather, atmosphere evolution, tectonics, vegetation, ice, settlements, biospheres, life, or civilization are invented.

## Accessibility review scope

Target: WCAG 2.2 AA-quality implementation for the relevant surface, **not formal certification**. Manual semantic review covers landmarks/headings, tab semantics, focus order, canvas semantics, form labels, error presentation, live-region scope, non-color state text, long-value wrapping, reduced motion, and hover independence. Automated browser evidence covers focus visibility, representative token contrast, keyboard input isolation, responsive reflow, reduced motion, target sizing, and semantic presence. Physical assistive-technology/device testing remains NOT_VERIFIED where unavailable.

## Product-quality rubric

| Category | Score | Disposition |
|---|---:|---|
| Experience | 5/5 | Explore-first hierarchy, orientation, continuous scale, intentional unsupported state |
| Visual | 4/5 | restrained system, viewport dominance, coherent density; physical-device typography not independently verified |
| Scientific communication | 5/5 | canonical/presentation boundaries and P6/P5 limitations explicit |
| Accessibility | 4/5 | deliberate semantics/keyboard/reflow/motion; real devices/external audit NOT_VERIFIED |
| Engineering | 5/5 | single-file/offline architecture and bounded renderer retained |
| Control plane | 5/5 target | valid only after exact-head, protected PR-event, expected-head merge, exact-main recertification |

A failed control-plane or certification gate overrides this descriptive rubric.
