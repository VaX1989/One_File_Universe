# OFU RFC Process

RFCs are for durable architectural decisions, not every change.

## When an RFC is required

Use an RFC for a new public/provider contract, authority transfer, new canonical/persistence semantics, cross-domain architecture, major build/runtime policy, incompatible change, new subsystem class, or constitutional proposal.

A local implementation change that preserves existing contracts usually does not need one.

## Location and lifecycle

RFCs live under `rfcs/` and use `rfcs/TEMPLATE.md`.

States:

`DRAFT -> DISCUSSION -> ACCEPTED | REJECTED -> IMPLEMENTING -> IMPLEMENTED -> SUPERSEDED`

An RFC may be withdrawn by its authors before acceptance.

## Required content

An RFC must explain the problem, goals/non-goals, proposed design, alternatives, authority impact, determinism impact, compatibility/migration, one-file/offline impact, resource impact, security/privacy implications where relevant, scientific/provenance implications where relevant, testing/evidence plan, and unresolved questions.

## Decision

Domain maintainers decide local architectural RFCs when no cross-area authority conflict exists. Cross-area RFCs require the affected maintainers and a Core Maintainer. Constitutional RFCs use the higher threshold in `GOVERNANCE.md`.

Acceptance is recorded with rationale. Rejection is not a judgment of the contributor; it means the project is not adopting that design.

## ADR relationship

The RFC records the proposal and discussion. An ADR records the durable architectural decision after acceptance when the decision has long-lived semantic consequences.
