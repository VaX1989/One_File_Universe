# Supply-Chain Security

OFU's distribution simplicity does not remove software-supply-chain risk. Build scripts, GitHub Actions, embedded data and release provenance can all become trust boundaries.

Current policy is machine-readable in `config/governance/supply-chain-policy.json`.

Core requirements are least-privilege workflow tokens, full commit-SHA pinning for third-party Actions, non-persistent checkout credentials, exact-source verification and deterministic release builds. PR workflows that execute untrusted code must not use `pull_request_target` with privileged credentials.

Before broad 2.0 promotion, repository administration should also evaluate/enable the relevant GitHub security controls, dependency review, secret scanning/push protection and OpenSSF Scorecard. Published releases should move toward SLSA-compatible build provenance and an SPDX SBOM where it materially improves verifiability.

These are evidence targets, not badge targets: the project must not claim a security capability merely because a policy document mentions it.
