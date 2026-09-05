# Integration Matrix

This document records integration status and authority boundaries. It preserves frozen historical contracts and makes future interfaces explicit without marking them canonical prematurely.

## Status vocabulary

- `CANONICAL_FROZEN` — promoted versioned authority with certification evidence.
- `CURRENT_PRODUCT` — promoted product/runtime behavior on `main`, not necessarily canonical science.
- `CURRENT_DEVELOPMENT` — active candidate evidence outside `main`.
- `RESEARCH` — non-canonical research/prototype.
- `PLANNED` — architecture/frontier contract not yet implemented.
- `ARCHITECTURALLY_RESERVED` — future semantic space deliberately left open.
- `UNSUPPORTED` — current promoted model explicitly has no authority for the capability.

## Certified / promoted integration surfaces

| Producer | Consumer | Contract / meaning | Status | Notes |
|---|---|---|---|---|
| P2 kernel | all canonical domains | canonical bytes/address/identity/derivation | CANONICAL_FROZEN | Frozen by versioned P2 contracts. |
| P3 astronomy | P5 | `ofu-p3-p5-planetary-input-v1` | CANONICAL_FROZEN | P3 owns astronomical/body baseline facts only. |
| P4 temporal | mutable domain reducers | versioned event/order/replay/checkpoint/archive contract | CANONICAL_FROZEN | Domain physics is not owned by P4. |
| P5 physical | P5 terrain / downstream | `ofu-p5-planet-physical-v1` | CANONICAL_FROZEN | Terrestrial 1–8 Mearth bounded scope. |
| P5 terrain | renderer | exact cube-sphere topology + stylized dimensionless elevation code | CANONICAL_FROZEN + presentation consumer | Does not establish physical topography. |
| P5 Environment v2 | P6 v1 | `ofu-p5-p6-environment-v2` | CANONICAL_FROZEN | Real path remains scientifically insufficient for biology. |
| P6 v1 | renderer/product | eligibility witness + `biologyEstablished=false` on current real path | CANONICAL_FROZEN | Test fixtures are not production authority. |
| P1–P6 | v0.8 product/rendering | read-only canonical projections | CURRENT_PRODUCT | UI/renderer cannot change canonical truth. |

## Current Wave IV technical baseline

PR #48 was merged normally as `e33156ee8ed9c6e906d0d4e0b8142fa235a833c7`
after the exact `f4df1452529cb5f121e4065f567b4a3da52d2b75` candidate passed
Rendering Production `33959845666`, Wave IV `33959845605` and all frozen upstream
gates. This formalization incorporates that history, not the earlier failed
candidate. Surface and macro rendering remain `PRESENTATION_ONLY` under their
existing contracts. This is a technical baseline, not evidence of unbuilt v1.0
science, microscopic models or physical mobile verification.

The [active v1.0 contract](../governance/V1_IMPLEMENTATION_CONTRACT.md) authorizes
shipping model-derived astronomy, planet, life, civilization and microscopic
successors through the actual PX seams. Their integration status changes only
when real code and acceptance evidence exist.

## Future integration surfaces

| Producer / owner | Consumer | Planned contract | Status | Promotion rule |
|---|---|---|---|---|
| F-GOV | all future domains | Domain Provider / Authority Descriptor | PLANNED | contract freeze + ADR/compatibility review |
| F-EXP | product/rendering/domains | Exploration Query + Selection + Scale/Regime Travel | PLANNED | sparse/identity/reversibility evidence |
| F-PLANET | F-VIS/F-LIFE/F-HISTORY | physical geography/environment successor contracts | RESEARCH / PLANNED | scientific provenance/oracle/conservation + versioned promotion |
| F-LIFE | F-VIS/F-CIV/F-HISTORY/F-MICRO | positive biology/ecology/lifecycle successors | RESEARCH / PLANNED | positive upstream authority + P4 replay + scientific claim review |
| F-HISTORY | F-CIV/F-PLAY/F-MICRO | late materialization / significance projection | PLANNED | replay + cross-scale reconciliation |
| F-CIV | F-VIS/F-PLAY/F-HISTORY | population/settlement/culture/economy | PLANNED / RESEARCH | causal upstream dependencies + history/replay |
| F-PLAY | domain reducers | canonical action → event candidate | PLANNED | P4 admission/transition authority; no UI mutation bypass |
| F-VIS | product | representation provider + backend-neutral presentation state | PLANNED | WebGL2 Strict + optional WebGPU Enhanced non-interference |
| F-UX | product/runtime | semantic input/inspection/accessibility projections | PLANNED | journey/accessibility/device evidence |
| F-MICRO | F-LIFE/F-MATTER/F-VIS | organism↔tissue/cell regime bridge | ARCHITECTURALLY_RESERVED | bounded late materialization + model validity |
| F-MATTER | F-MICRO/F-VIS | molecular/atomic representation bridge | ARCHITECTURALLY_RESERVED | explicit visualization/dynamics authority |
| F-NONCLASS | future research consumers | non-classical regime/observable compatibility | ARCHITECTURALLY_RESERVED | no canonical promotion gate defined |
| F-SOUND | product/accessibility | context-driven audio provider | PLANNED | presentation-only + accessibility parity |

Future rows are planning metadata. They must not be interpreted as frozen protocols until a versioned implementation/promotion transaction explicitly changes their status.
