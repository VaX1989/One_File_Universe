# Start Contributing to One File Universe

OFU is intentionally ambitious, but a contributor should not need to understand the entire universe engine before making a useful change.

## Five-minute orientation

Read, in order:

1. `docs/community/OFU_WAY.md` — the project's cultural/technical DNA.
2. `CONTRIBUTING.md` — the contribution workflow.
3. `docs/CONSTITUTION.md` — normative invariants when your work touches architecture or semantics.
4. the documentation/tests for the area you want to change.

You do **not** need to read every ADR before fixing a local bug.

## Check your environment

Run:

```bash
npm run contrib:doctor
```

For automation or IDE tooling:

```bash
npm run contrib:doctor -- --json
```

A warning is not automatically a blocker; for example, a different local Python version may prevent you from reproducing canonical cross-runtime evidence while still allowing a documentation change. A `FAIL` means the contribution environment is not considered healthy for the relevant local control plane.

## Ask the repository what a path means

Before editing an unfamiliar subsystem, run:

```bash
npm run contrib:explain -- src/path/file.js
```

The result tells you the path's area, current owners, authority classes and risk route. CI independently derives the complete PR context from the exact diff; your manually declared risk never overrides a higher machine-derived or semantic risk.

A path with no declared area is intentionally fail-closed. Register new architectural territory in the governance map rather than letting code appear with no owner.

## Pick a track

Choose the smallest area that matches your contribution: documentation, testing/falsification, product/UX/accessibility, rendering/performance, runtime, simulation/gameplay, scientific model, data/provenance, or core architecture.

See `docs/community/CONTRIBUTION_TRACKS.md`.

## Before coding

For an existing issue, say what you intend to work on when duplication is plausible. For large architectural or scientific changes, discuss first rather than arriving with an enormous unreviewable patch.

If you are introducing a significant durable subsystem/provider/control-plane surface, read `docs/community/CONTRIBUTION_UNITS.md` and add the machine-readable Contribution Unit that lets future reviewers understand its authority, determinism, dependencies, tests and shipping reachability.

## Make a focused change

Prefer one clear responsibility, declared authority impact, bounded resource impact, tests, and no unrelated cleanup. Small reviewable changes are easier to compose safely than broad drive-by refactors.

## Verify honestly

Run the narrowest relevant tests first, then the repository-required gate for your risk class. Never report a test, browser, operating system, physical device, dataset validation, scientific oracle, security control or release property as verified unless it actually ran or was directly observed.

Useful states include `PASS`, `FAIL`, `NOT_RUN`, `NOT_VERIFIED`, `NOT_MEASURABLE`, `UNSUPPORTED`, and `UNKNOWN`.

## Open the PR

The pull-request template asks for area, risk, Contribution Unit, authority, determinism, evidence, provenance, source rights and known limitations. CI then computes the exact changed-file context and fails if a changed path has no governance route.

## Ask for help

Questions are contributions. If you cannot determine which authority owns a change, ask before inventing a new owner or copying logic across domains.

Permanent technical decisions belong in the repository. Discussions may happen anywhere; architecture that others must depend on should end in the appropriate RFC/ADR/contracts/tests rather than living only in chat.
