# Spatial Continuum architecture experiment

This proving slice replaces V2's visual/navigation kernel for two connected journeys while retaining genuine OFU authority and data:

```text
SYSTEM → ORBIT → APPROACH → GLOBAL → REGIONAL → LOCAL → HUMAN
HUMAN → MATERIAL → MICROSTRUCTURE → MOLECULAR → ATOMIC
```

Both paths are reversible. The generated artifact is separate from the released V2 artifact and is not a release candidate.

## Reproduce

Use the repository's declared Node `24.20.x` runtime.

```sh
npm ci
npm run test:continuum
npm run build:continuum
npm run test:continuum:browser
```

The browser suite expects Playwright Chromium to be installed. To write inspectable screenshots into a chosen directory:

```sh
OFU_CONTINUUM_EVIDENCE_DIR=/absolute/output/path npm run test:continuum:browser
```

Open `dist/One_File_Universe_Spatial_Continuum.html` directly or serve `dist/` from localhost. The artifact is self-contained and its CSP prohibits runtime connections.

## Controls

- Click/tap the visible canonical planet or source sample to select it.
- Wheel or pinch for continuous scale travel.
- Drag or arrow keys to orbit/look.
- Use the scale landmarks or Deeper/Shallower controls for accessible semantic travel.
- Use W/A/S/D at HUMAN scale.
- Back/Escape restores retained scale, focus, and camera context.

The UI continuously identifies the canonical focus, reference frame, handoff, source sample, and scientific authority of the active representation.

## Documents

- [Architecture decision](ARCHITECTURE_DECISION.md)
- [Evidence and acceptance results](EVIDENCE.md)
- [Third-party notice](THIRD_PARTY_NOTICES.md)
