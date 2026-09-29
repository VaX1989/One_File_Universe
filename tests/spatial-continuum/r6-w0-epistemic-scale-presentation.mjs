import assert from 'node:assert/strict';
import { EPISTEMIC_REPRESENTATION, createEpistemicScalePresentation } from '../../src/experiments/spatial-continuum/epistemic-scale-presentation.js';
import { createContextualMaterialGrammar, createContextualMicroGrammar } from '../../src/experiments/spatial-continuum/micro-grammar.js';

const contexts = {
  ice: { kind:'ICE', phase:'SOLID', structure:'CRYSTALLINE_PROXY', chemistryAuthority:'SOURCE_BACKED_KNOWN_CHEMISTRY', authority:'MODEL_DERIVED', porosityPpm:25000, components:[{id:'WATER_ICE',ppm:1000000,formula:'H2O',elements:{H:2,O:1},authority:'SOURCE_BACKED_KNOWN_CHEMISTRY'}] },
  basalt: { kind:'ROCK', phase:'SOLID', structure:'POLYCRYSTALLINE_PROXY', chemistryAuthority:'MODEL_DERIVED_PLAUSIBLE_CHEMISTRY', authority:'MODEL_DERIVED', porosityPpm:70000, components:[{id:'SILICATE_FRACTION',ppm:730000,authority:'MODEL_DERIVED_PLAUSIBLE_CHEMISTRY'},{id:'METAL_FRACTION',ppm:270000,authority:'MODEL_DERIVED_PLAUSIBLE_CHEMISTRY'}] },
  porousRock: { kind:'ROCK', phase:'SOLID', structure:'POROUS_AGGREGATE', chemistryAuthority:'UNRESOLVED_CHEMISTRY', authority:'MODEL_DERIVED', porosityPpm:310000, components:[{id:'UNRESOLVED_REMAINDER',ppm:1000000,authority:'UNRESOLVED_CHEMISTRY'}] },
  atmosphere: { kind:'ATMOSPHERE', phase:'GAS', structure:'GAS_MIXTURE', chemistryAuthority:'UNRESOLVED_CHEMISTRY', authority:'MODEL_DERIVED', components:[] }
};

const rows = {};
for (const [name, source] of Object.entries(contexts)) {
  const options = { sampleId:`world-a:${name}:surface-17`, sampleKind:source.kind, source, presentationSeed:'world-a:micro' };
  const material = createContextualMaterialGrammar(options);
  const micro = createContextualMicroGrammar(options);
  assert.deepEqual(material, createContextualMaterialGrammar(options), `${name} material grammar must rerun deterministically`);
  assert.deepEqual(micro, createContextualMicroGrammar(options), `${name} micro grammar must rerun deterministically`);
  assert.equal(micro.sourceSampleId, material.sourceSampleId);
  assert.equal(micro.continuityKey, material.continuityKey);
  assert.equal(micro.epistemic.continuity.continuityKey, material.continuityKey);
  assert.equal(micro.claims.quantumSimulation, false);
  assert.equal(micro.claims.particlePositions, false);
  assert.equal(micro.atomicField.countSemantics, 'BOUNDED_RENDER_SAMPLES_NOT_PARTICLE_COUNT');
  assert.equal(micro.atomicField.pointCount, 96);
  assert.ok(micro.positions.length <= 128);
  assert.ok(micro.microstructurePositions.length <= 42);
  assert.equal(micro.scientistStatus.molecular.explorerLabel, null);
  assert.equal(micro.scientistStatus.atomic.explorerLabel, null);
  assert.equal(micro.links.length, 0, `${name} must not render bond-like relations without exact structural evidence`);
  rows[name] = {
    sampleId: micro.sourceSampleId,
    fingerprint: micro.sourceContextFingerprint,
    topology: micro.topology,
    molecularRepresentation: micro.epistemic.molecular.representation,
    molecularStatus: micro.scientistStatus.molecular.summary,
    atomicRepresentation: micro.epistemic.atomic.representation,
    atomicStatus: micro.scientistStatus.atomic.summary,
    motifAnchors: micro.positions.length,
    exactLinksRendered: micro.links.length,
    atomicRenderSamples: micro.atomicField.pointCount
  };
}

assert.equal(rows.ice.molecularRepresentation, EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD);
assert.equal(rows.basalt.molecularRepresentation, EPISTEMIC_REPRESENTATION.MODEL_DERIVED_ENSEMBLE);
assert.equal(rows.porousRock.molecularRepresentation, EPISTEMIC_REPRESENTATION.UNKNOWN_STRUCTURE);
assert.equal(rows.atmosphere.molecularRepresentation, EPISTEMIC_REPRESENTATION.UNKNOWN_STRUCTURE);
assert.equal(rows.atmosphere.atomicRepresentation, EPISTEMIC_REPRESENTATION.EXPLANATORY_ABSTRACTION);

const sameIdentityA = createContextualMicroGrammar({ sampleId:'same-kind-same-id', sampleKind:'ROCK', presentationSeed:'same-parent', source:contexts.basalt });
const sameIdentityB = createContextualMicroGrammar({ sampleId:'same-kind-same-id', sampleKind:'ROCK', presentationSeed:'same-parent', source:contexts.porousRock });
assert.notEqual(sameIdentityA.sourceContextFingerprint, sameIdentityB.sourceContextFingerprint, 'source context must contribute to presentation identity');
assert.notDeepEqual(sameIdentityA.positions, sameIdentityB.positions, 'same-kind samples with different source context must not collapse to identical presentation');

const exactSource = {
  kind:'MINERAL', phase:'SOLID', structure:'CRYSTALLINE', chemistryAuthority:'SOURCE_BACKED_KNOWN_CHEMISTRY', authority:'CANONICAL',
  components:[{id:'REFERENCE_PHASE',ppm:1000000,elements:{A:1,B:1},authority:'SOURCE_BACKED_KNOWN_CHEMISTRY'}],
  structureEvidence:{ exact:true, authority:'SOURCE_BACKED_EXACT_STRUCTURE', provenance:'fixture:explicit-structure', sites:[[0,0,0],[1,0,0],[0,1,0]], links:[[0,1],[0,2]] }
};
const exact = createContextualMicroGrammar({ sampleId:'exact-source-sample', sampleKind:'MINERAL', source:exactSource, presentationSeed:'exact-source' });
assert.equal(exact.epistemic.molecular.representation, EPISTEMIC_REPRESENTATION.AUTHORITATIVE_STRUCTURE);
assert.equal(exact.siteSemantics, 'AUTHORITATIVE_STRUCTURE_SITE');
assert.equal(exact.relationSemantics, 'AUTHORITATIVE_SOURCE_RELATION');
assert.equal(exact.claims.exactMolecularArrangement, true);
assert.equal(exact.claims.exactMolecularBonds, true);
assert.deepEqual(exact.positions, Object.freeze(exactSource.structureEvidence.sites.map(point=>Object.freeze(point.map(Number)))));
assert.deepEqual(exact.links, Object.freeze(exactSource.structureEvidence.links.map(link=>Object.freeze([...link]))));

const invalidExact = createEpistemicScalePresentation({
  sourceSampleId:'invalid-structure', sourceKind:'MINERAL', sourceContextFingerprint:'x', chemistryAuthority:'SOURCE_BACKED_KNOWN_CHEMISTRY', knownElements:['A'], topology:'LATTICE_ORIENTED_PRESENTATION',
  source:{structureEvidence:{exact:true,authority:'MODEL_DERIVED',sites:[[0,0,0]],links:[]}}
});
assert.notEqual(invalidExact.molecular.representation, EPISTEMIC_REPRESENTATION.AUTHORITATIVE_STRUCTURE, 'model-derived coordinates must fail closed instead of being promoted to exact structure');

const forward = ['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'];
const reverse = [...forward].reverse();
for (const stage of [...forward, ...reverse]) {
  const key = rows.ice.sampleId;
  assert.equal(key, 'world-a:ice:surface-17', `source identity changed during ${stage} traversal`);
}
assert.equal(createContextualMicroGrammar({ sampleId:'world-a:ice:surface-17', sampleKind:'ICE', source:contexts.ice, presentationSeed:'world-a:micro' }).sourceSampleId, rows.ice.sampleId, 'reverse/re-entry must recover exact sample identity');

console.log(JSON.stringify({status:'PASS',suite:'r6-w0-epistemic-scale-presentation',rows,authoritativeFixture:{sites:exact.siteCount,links:exact.links.length,status:exact.scientistStatus.molecular.summary},reverseIdentityPreserved:true,bounded:true,scientificClaimsAdded:false},null,2));
