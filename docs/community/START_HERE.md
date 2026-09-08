# Start Contributing to One File Universe

OFU is intentionally ambitious, but a contributor should not need to understand the entire universe engine before making a useful change.

## Five-minute orientation

Read, in order:

1. `docs/community/OFU_WAY.md` — the project's cultural/technical DNA.
2. `CONTRIBUTING.md` — the contribution workflow.
3. `docs/CONSTITUTION.md` — normative invariants when your work touches architecture or semantics.
4. the documentation/tests for the area you want to change.

You do **not** need to read every ADR before fixing a local bug.

## Pick a track

Choose the smallest area that matches your contribution: documentation, testing/falsification, product/UX/accessibility, rendering/performance, runtime, simulation/gameplay, scientific model, data/provenance, or core architecture.

See `docs/community/CONTRIBUTION_TRACKS.md`.

## Before coding

Run:

```bash
npm run contrib:doctor
```

For an existing issue, say what you intend to work on if duplication is plausible. For large architectural or scientific changes, discuss first rather than arriving with an enormous unreviewable patch.

## Make a focused change

Prefer a contribution unit with one clear responsibility, declared authority impact, bounded resource impact, tests, and no unrelated cleanup.

## Verify honestly

Run the narrowest relevant tests first, then the repository-required gate for your risk class. Never report a test, browser, operating system, physical device, dataset validation, or scientific result as verified unless it actually ran.

## Open the PR

The pull-request template asks for area, risk, authority, determinism, evidence, source rights, and known limitations. Those fields are part of how OFU lets many people work in parallel without requiring every reviewer to reconstruct your intent.

## Ask for help

Questions are contributions. If you cannot determine which authority owns a change, ask before inventing a new owner or copying logic across domains.
