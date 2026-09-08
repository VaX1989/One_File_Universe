# Review Process

## Review the claim, not the person

Review depth follows change risk and authority impact. Famous contributors do not receive weaker gates; newcomers do not receive stronger gates merely because they are new.

## What reviewers check

Reviewers should determine:

- whether the change belongs to the declared area;
- whether it changes canonical/model/presentation authority;
- whether determinism or persistence compatibility changes;
- whether the final one-file artifact can actually reach/use the capability when that is claimed;
- whether resource bounds remain explicit;
- whether scientific claims match evidence and provenance;
- whether third-party rights are known;
- whether tests exercise the important failure paths;
- whether unverified evidence is labeled as unverified;
- whether an RFC/ADR is required.

## Review levels

- **R0/R1:** one qualified reviewer may be sufficient when policy permits.
- **R2:** relevant domain reviewer/maintainer.
- **R3:** affected domain maintainers plus cross-area review.
- **R4:** core/authority owner review and full integration evidence.
- **R5:** constitutional/release governance and same-SHA certification as applicable.

Machine-readable risk policy is in `config/governance/risk-policy.json`.

## Scope discipline

Large PRs are harder to review and harder to compose. Prefer narrowly scoped contribution units. Reviewers may ask for unrelated refactors to be split rather than accepting a mixed-risk patch.

## Evidence language

Use `PASS` only for executed evidence. Use `NOT_RUN`, `NOT_VERIFIED`, `NOT_MEASURABLE`, `UNSUPPORTED`, or an equally explicit state when appropriate.

## Review latency

Maintainers should optimize for predictable review, not merely maximum strictness. When rejecting or blocking work, identify the violated contract or missing evidence and, when practical, the smallest path to resolution.
