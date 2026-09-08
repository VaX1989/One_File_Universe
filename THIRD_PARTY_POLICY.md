# Third-Party Code, Data, Models, and Asset Policy

OFU's single-file distribution makes provenance a build concern. If material is embedded in the shipping HTML, the project must have the right to redistribute it in that form.

## Required information

Material proposed for repository or artifact inclusion must identify, as applicable:

- origin and upstream project or author;
- exact version, revision, DOI, catalog release, or download date;
- license and SPDX identifier when one exists;
- required attribution and notices;
- whether modification is permitted;
- whether redistribution is permitted;
- whether commercial redistribution is permitted;
- integrity hash for imported immutable data where practical;
- scientific provenance, units, scope, uncertainty, and known limitations for scientific inputs.

## Fail-closed rule

Unknown licensing status is not permission. Material with unresolved redistribution rights must not become a required part of the Strict single-file artifact.

Scientific usefulness, popularity, public accessibility, or availability on the web does not substitute for redistribution permission.

## Compatibility review

Third-party software licenses must be checked for compatibility with GPL-3.0-only before incorporation into a combined covered work. Separately distributed tools, test fixtures, specifications, or data may use different licenses when legally and architecturally separable; their license must remain explicit.

## Generated and AI-assisted material

A contributor remains responsible for having the right to submit generated or AI-assisted code, text, data, imagery, audio, or models. AI assistance does not erase source-license, attribution, patent, privacy, or provenance obligations.

## Machine-readable provenance target

The project will evolve toward machine-readable third-party and dataset manifests validated before the deterministic artifact build. See the science-contribution and governance documentation for the expected metadata model.
