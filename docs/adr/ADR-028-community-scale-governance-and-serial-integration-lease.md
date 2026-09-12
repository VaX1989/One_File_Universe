# ADR-028 — Community-scale governance with decentralized ownership and a serial canonical integration lease

**Status:** Accepted

**Ratified:** 2026-09-08 by the project founder for forward community-scale development. This ADR evolves the operational model of ADR-025 without weakening its exact-base and ownership principles.

## Context

A project that can attract hundreds or thousands of contributors cannot make the founder or one permanent integration owner approve every ordinary change. OFU also cannot allow independent branches or popularity to redefine canonical identity, history, scientific authority or release truth. The architecture therefore needs high parallelism at the leaves and deliberate serialization at canonical promotion boundaries.

## Decision

1. Contribution authority follows a public ladder: Contributor → Trusted Contributor → Reviewer → Domain Maintainer → Core/Integration Maintainer, with a future Technical Steering Committee when independent maintainership exists.
2. Domain work should be locally ownable through stable narrow-waist contracts and machine-readable areas, authority classes and Contribution Units.
3. Ordinary local decisions stay local. Public contract/cross-domain changes require RFC-level review. Constitutional changes require explicit constitutional governance and an ADR.
4. Canonical promotion remains serial. Multiple qualified Integration Maintainers may exist, but exactly one active integration lease may own a promotion transaction at a time.
5. Independent branch evidence is not composable proof of the integrated result. Promotion evidence must bind to the exact composed candidate and release certification to the relevant exact SHA.
6. Project Steward authority protects mission and constitutional invariants; it is not a requirement for founder review of ordinary implementation PRs.
7. Ownership, risk and review routing should increasingly be generated or validated from machine-readable policy rather than maintained as disconnected prose.
8. Governance maturity must be measured. A personal-repository bootstrap with one owner must not be presented as community-resilient merely because target roles are documented.

## Consequences

- OFU can increase contributor count without granting canonical authority linearly with participation.
- The project intentionally trades some promotion latency for deterministic composition and authority integrity.
- Bus factor becomes a tracked engineering/governance property rather than an informal aspiration.
- Organization teams, CODEOWNERS, branch rulesets and the TSC are activated only when real people exist to staff them; target-state names do not fabricate operational governance.
- Superseding the one-active-lease invariant or collapsing domain authority into unrestricted global writes requires a new architectural/constitutional decision.
