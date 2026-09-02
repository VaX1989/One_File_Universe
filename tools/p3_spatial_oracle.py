#!/usr/bin/env python3
"""Independent P3 spatial-partition oracle.

This deliberately does not import or translate the JavaScript generator. It verifies the
normative Euclidean partition mapping that makes Sector computational rather than physical.
"""
import json
import os
from pathlib import Path

AXIS = 512

def absolute_site(sector: int, local: int) -> int:
    if local < 0 or local >= AXIS:
        raise ValueError("local site outside 0..511")
    return sector * AXIS + local

def split_site(absolute: int) -> tuple[int, int]:
    sector = absolute // AXIS
    local = absolute - sector * AXIS
    assert 0 <= local < AXIS
    return sector, local

vectors = [
    (-2, 511, -513), (-1, 0, -512), (-1, 511, -1),
    (0, 0, 0), (0, 511, 511), (1, 0, 512), (1, 511, 1023),
]
for sector, local, expected in vectors:
    got = absolute_site(sector, local)
    assert got == expected, (sector, local, got, expected)
    assert split_site(got) == (sector, local)

for absolute in range(-4097, 4098):
    sector, local = split_site(absolute)
    assert absolute_site(sector, local) == absolute

report = {
    "phase": "P3",
    "status": "PASS",
    "oracle": "independent-python-spatial-v1",
    "axis": AXIS,
    "boundaryVectors": [
        {"sector": s, "local": l, "absolute": a} for s, l, a in vectors
    ],
    "roundTripRange": [-4097, 4097],
    "sourceSha": os.environ.get("OFU_SOURCE_SHA"),
}
Path("dist/evidence").mkdir(parents=True, exist_ok=True)
Path("dist/evidence/p3-spatial-oracle.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
