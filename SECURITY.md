# Security Policy

One File Universe ships an unusual attack surface: the canonical product is intended to be a local, self-contained HTML artifact, while its source, build pipeline, imported saves, scientific data and browser runtime remain security boundaries.

## Supported surfaces

| Surface | Security-report status |
|---|---|
| Latest stable release (`v1.0.0` until superseded) | Reports accepted and triaged |
| Current development / release candidates | Reports accepted; these are not stable compatibility promises |
| Historical preview releases | Not supported except when a report reveals a defect that also affects a supported surface |
| Third-party forks or modified distributions | Contact that distributor first unless the issue also affects upstream OFU |

A supported surface means the project accepts and assesses security reports. It does not promise a particular remediation SLA, bounty, or backport until such a program is explicitly published.

## Security goals

Strict OFU releases aim to:

- require no runtime network access for the complete baseline universe;
- load no application-owned external runtime resources;
- validate portable save/archive integrity before applying state;
- bound parsers and materialization before allocating or committing untrusted input;
- fail closed on incompatible, malformed or authority-invalid manifests;
- distinguish untrusted imported data from executable payload;
- keep presentation/acceleration failures from corrupting canonical state;
- bind published artifacts to exact source, hashes and reproducible-build evidence;
- keep CI/release credentials outside untrusted contribution execution;
- preserve dependency, action and build provenance at the level claimed by release evidence.

## Important threat boundaries

### Imported state and user content

Portable `.ofu` saves/archives and other imported material are untrusted input. Parsers must validate structure, size/depth/count limits, versions, hashes and semantic invariants before canonical state is committed.

Imported user content must never become executable JavaScript, HTML or privileged browser behavior merely because it is embedded in a save, catalog or project file.

### Single-file artifact

A single file simplifies distribution but does not make the artifact inherently trustworthy. The external release hash, exact-source identity and independent build evidence remain stronger trust anchors than internal component hashes alone.

### Offline claim

“Offline” means no required runtime network resource for the complete baseline product. Conformance should instrument or block external requests where practical rather than trusting source inspection alone.

### Build and contributor automation

Pull-request automation that executes untrusted contributions must use least privilege, immutable third-party Action references, exact-head checkout and non-persistent checkout credentials. Privileged workflows must not execute untrusted PR code through `pull_request_target` or an equivalent trust-boundary mistake.

The broader supply-chain policy is in `config/governance/supply-chain-policy.json`.

## Reporting a vulnerability

**Do not publish exploit details, proof-of-concept payloads, private data or other sensitive vulnerability information in a normal public issue.**

The target reporting mechanism is GitHub Private Vulnerability Reporting. It is a blocking OFU 2.0 public-launch gate and must not be claimed active until repository administration has actually enabled and verified it.

If GitHub displays **Report a vulnerability** for this repository, use that private reporting flow.

If private vulnerability reporting is not available, open a minimal public issue titled `[security contact request]` that contains **no vulnerability details** and asks the maintainers to establish a private channel. A maintainer should then move substantive discussion out of public view before receiving sensitive information.

A useful private report normally includes:

- affected release/commit and browser/runtime;
- affected component or import/build path;
- impact and realistic attacker prerequisites;
- minimal reproduction steps or proof of concept;
- whether the issue is already public or known elsewhere;
- any intended disclosure timeline;
- suggested mitigation, when known.

## Coordinated disclosure

Maintainers should acknowledge valid private reports, assess scope, reproduce where possible, develop and verify a fix, and coordinate public disclosure with the reporter. Exact response and disclosure timing depends on severity, exploitability and release constraints; OFU does not currently promise a fixed security SLA.

When a vulnerability is disclosed, release/advisory notes should clearly identify affected versions, fixed versions or mitigations, and the evidence supporting remediation. Credit reporters when they want attribution and it is safe to do so.

There is currently **no public bug-bounty promise**. Do not infer compensation from submission of a report.

## Launch status

Private vulnerability reporting, repository security settings and stronger supply-chain evidence are tracked in issue #266 and `config/governance/public-launch-gates.json`. Missing repository-admin evidence remains `PENDING`; policy text alone is not a security certification.
