# Security Policy

OFU's security model is unusual because the canonical product is a local, self-contained HTML artifact.

## Security goals

Strict releases aim to:

- require no network access;
- load no application-owned external resources;
- validate portable save/archive integrity before applying state;
- fail closed on incompatible or malformed canonical manifests;
- distinguish untrusted imported data from executable payload;
- publish release hashes and reproducible-build evidence;
- keep presentation/acceleration failures from corrupting canonical state.

## Imported data

Portable `.ofu` saves/archives are untrusted input. Parsers must validate structure, size limits, versions, hashes and semantic invariants before committing canonical state.

Imported user content must never become executable JavaScript/HTML merely because it is embedded in a save.

## Offline claim

"Offline" means no required runtime network resource. A future conformance harness should actively instrument/block network-capable APIs and external resource requests rather than rely only on source inspection.

## Integrity

Internal component hashes and self-tests do not replace the external SHA-256 of the release artifact. Whole-artifact identity and independent rebuild evidence are external certification properties.

## Reporting

Until a private security-reporting channel is configured, avoid publishing exploitable details for an unpatched release in a public issue. Repository maintainers should establish an appropriate private channel before the first public executable release.
