import { createHash } from 'node:crypto';

function h01(text, lane) {
  const d = createHash('sha256').update('OFU-WVE-MOL-v0\0').update(text).update(`\0${lane}`).digest();
  return d.readUInt32BE(0) / 0xFFFFFFFF;
}

export function sourceBackedAtomicRepresentation({ complexId, sourceId, atoms, coordinateUnit = 'angstrom', reportedResolutionAngstrom = null }) {
  if (!complexId || !sourceId || !Array.isArray(atoms)) throw new TypeError('source-backed structure requires ids and atoms');
  return {
    schema: 'ofu.wve.atomic-representation.v0', complexId, sourceId, coordinateUnit,
    provenance: 'SOURCE_BACKED', evidenceClass: 'EMPIRICALLY_CONSTRAINED',
    visualAuthority: 'SOURCE_BACKED', dynamicalAuthority: 'NONE',
    reportedResolutionAngstrom,
    atoms: atoms.map((a) => ({ element: a.element, x: a.x, y: a.y, z: a.z, group: a.group ?? null }))
  };
}

export function syntheticVisualBackmap({ complexId, beads, atomsPerBead = 4, radius = 0.12 }) {
  if (!complexId || !Array.isArray(beads)) throw new TypeError('complexId and beads required');
  if (!Number.isInteger(atomsPerBead) || atomsPerBead < 1 || atomsPerBead > 12) throw new RangeError('atomsPerBead 1..12');
  const atoms = [];
  for (let b = 0; b < beads.length; b++) {
    const bead = beads[b];
    for (let a = 0; a < atomsPerBead; a++) {
      const key = `${complexId}:${b}:${a}`;
      const theta = 2 * Math.PI * h01(key, 'theta');
      const z = 2 * h01(key, 'z') - 1;
      const rxy = Math.sqrt(Math.max(0, 1 - z * z));
      atoms.push({
        element: bead.visualElement ?? 'C', group: bead.id ?? `bead-${b}`,
        x: bead.x + radius * rxy * Math.cos(theta),
        y: bead.y + radius * rxy * Math.sin(theta),
        z: bead.z + radius * z
      });
    }
  }
  return {
    schema: 'ofu.wve.atomic-representation.v0', complexId, sourceId: null, coordinateUnit: 'nanometre',
    provenance: 'SYNTHETIC_BACKMAP', evidenceClass: 'FICTIONAL',
    visualAuthority: 'REPRESENTATIONAL', dynamicalAuthority: 'NONE',
    warning: 'Coordinates are deterministic visualization geometry, not an inferred conformer or dynamical microstate.',
    atoms
  };
}

export function projectAtomicRepresentation(representation) {
  if (!Array.isArray(representation.atoms) || representation.atoms.length === 0) {
    return { atomCount: 0, centroid: [0, 0, 0], radiusOfGyration: 0, composition: {} };
  }
  const n = representation.atoms.length;
  let sx = 0, sy = 0, sz = 0;
  const composition = {};
  for (const atom of representation.atoms) {
    sx += atom.x; sy += atom.y; sz += atom.z;
    composition[atom.element] = (composition[atom.element] ?? 0) + 1;
  }
  const c = [sx / n, sy / n, sz / n];
  let r2 = 0;
  for (const atom of representation.atoms) {
    r2 += (atom.x - c[0]) ** 2 + (atom.y - c[1]) ** 2 + (atom.z - c[2]) ** 2;
  }
  return { atomCount: n, centroid: c, radiusOfGyration: Math.sqrt(r2 / n), composition };
}
