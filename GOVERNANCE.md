# One File Universe Governance

## Purpose

One File Universe is designed to scale from a founder-led project into a durable Open Source technical community without losing the product vision, scientific honesty, canonical authority boundaries, or deterministic single-file contract that define the project.

This document governs community participation and the target large-scale decision model. Existing certified release/control-plane rules remain authoritative for active release transactions until they are explicitly migrated through the required ADR/constitutional process.

## Governing principles

1. **Mission before implementation preference.** The Constitution and accepted architectural contracts outrank local implementation convenience.
2. **Authority is explicit.** Contributors may improve a domain without acquiring unrelated canonical authority.
3. **Evidence before claims.** A contribution is evaluated by executable evidence appropriate to its risk, not by author reputation.
4. **Open discussion, durable decisions.** Conversation may happen anywhere; decisions with lasting technical effect must be recorded in the repository.
5. **Participation scales faster than privilege.** Anyone may contribute; merge, release, and constitutional authority are earned and narrowly scoped.
6. **No bus-factor-one release system.** The project may have multiple qualified integrators, while canonical promotion remains serialized.
7. **Commercial stewardship cannot override technical truth.** Payment, sponsorship, licensing, or employer status does not grant canonical scientific or architectural authority.

## Decision classes

### Local change

A change that does not alter public contracts, canonical semantics, authority ownership, persistence compatibility, interoperability, or constitutional invariants.

Process: issue or direct PR as appropriate, domain review, required tests.

### Architectural change

A change to a public/provider interface, cross-domain contract, persistence representation, build/composition rule, resource policy, or other long-lived architecture.

Process: RFC, affected-owner review, compatibility and migration analysis, ADR when accepted.

### Constitutional change

A change to the One File invariant, canonical identity, determinism model, scientific-authority model, permanent Open Source principle, project mission, or other foundational rule.

Process: RFC, broad review period, Technical Steering Council supermajority, Project Steward review, and an ADR/constitutional amendment. Constitutional changes must never silently rewrite already certified historical semantics.

## Roles

### Contributor

Anyone participating through issues, code, documentation, tests, science, review, design, research, accessibility work, or community support.

### Trusted Contributor

A contributor with a demonstrated record of accurate, constructive work who may triage issues and help review within known areas.

### Reviewer

A trusted contributor authorized to provide required reviews for specified areas. Review authority is scoped; it is not global merge authority.

### Domain Maintainer

Responsible for the health of one technical/scientific area: contract clarity, review throughput, tests, documentation, compatibility, and contributor mentoring.

### Core Maintainer

Responsible for cross-cutting kernel/runtime/build/governance surfaces and resolution of multi-domain interactions.

### Integration Maintainer

Qualified to operate the canonical integration queue. Multiple people may hold this role, but only one active **integration lease** may promote a candidate at a time.

### Release Conductor

The integration maintainer holding the release lease for a specific release transaction. The role ends when the transaction closes or the lease is relinquished.

### Technical Steering Council (TSC)

Target size: 5–9 members once the community is mature. The TSC resolves cross-area architecture, appoints/removes maintainers, approves architectural governance changes, and protects project continuity.

### Project Steward

Guardian of the founding mission and constitutional identity. The steward has no required approval role for ordinary PRs. Steward review is required for constitutional changes and changes to licensing/open-source guarantees. Steward objections must be written and tied to a documented constitutional principle rather than personal implementation preference.

## Bootstrap state

The repository is currently in founder/bootstrap governance. The repository owner temporarily performs steward, maintainer, and integration functions until additional maintainers are appointed. This is a migration state, not the intended thousand-contributor steady state.

## Integration lease and queue

Canonical promotion remains serial even when development is massively parallel:

`candidate -> compose on current integration tip -> exact gates -> promote -> certify new tip -> next candidate`

Independent green branches are not assumed composable.

The integration lease is a mutex over canonical promotion, not a permanent monopoly held by one person. The active holder and candidate identity must be auditable.

## Maintainer appointment

Maintainers are appointed based on sustained contribution quality, review quality, understanding of authority boundaries, reliability, communication, and ability to mentor others. Employment, sponsorship, commit count, or financial contribution alone is insufficient.

The mature project should require at least two active maintainers for a critical area before treating that area as operationally resilient.

## Removal and inactivity

Maintainer privileges may be reduced for prolonged inactivity, repeated unsafe merges, abuse of authority, serious Code of Conduct violations, or loss of community trust. Removal must be documented and proportionate; emergency access suspension may occur before final adjudication when repository integrity or safety is at risk.

## Conflicts of interest

Reviewers and maintainers should disclose material conflicts when a decision directly affects their employer, commercial license, funded research, or personal financial interest. Conflict does not automatically disqualify participation, but independent review may be required.

## Governance evolution

This model intentionally separates a stable constitutional core from changeable operational policy. The project should evolve toward organization teams, generated CODEOWNERS, a TSC, an auditable integration lease, and eventually an independent commons guarantee/foundation if the community becomes large enough to justify it.
