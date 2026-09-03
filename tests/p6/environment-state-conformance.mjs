import assert from 'node:assert/strict';
import {findCanonicalTerrestrial,loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),B=O.p6Biosphere,E=O.p5EnvironmentV2;
assert.equal(B.classifyEnvironmentEvidence({unknown:['pressure'],unsupported:['waterPhase'],insolationKnown:true}),B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(B.classifyEnvironmentEvidence({unknown:[],unsupported:['waterPhase'],insolationKnown:true}),B.STATES.UNSUPPORTED_ENVIRONMENT);
assert.equal(B.classifyEnvironmentEvidence({unknown:[],unsupported:[],insolationKnown:false}),B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(B.classifyEnvironmentEvidence({unknown:[],unsupported:[],insolationKnown:true}),B.STATES.NO_BIOSPHERE);

const real=findCanonicalTerrestrial(O),projection=E.environmentV2Projection(real.planet,real.topology),adapted=B.adaptEnvironment(projection),witness=B.eligibility(adapted);
assert.equal(adapted.state,B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(witness.state,B.STATES.INSUFFICIENT_ENVIRONMENT);
assert.equal(witness.canGenerateBiosphere,false);
assert.equal(witness.source.contractId,B.P5_ENV_CONTRACT);
assert.equal(witness.source.schemaVersion,B.P5_ENV_VERSION);
assert.equal(witness.source.modelVersion,B.P5_ENV_MODEL);
assert.equal(witness.source.authority,B.P5_ENV_AUTHORITY);
assert.ok(adapted.unsupported.includes('waterPhase'));
assert.ok(adapted.unsupported.includes('geochemicalEnergyAvailability'));
assert.ok(adapted.unknown.includes('atmosphere'));
assert.ok(adapted.unknown.includes('pressure'));
assert.ok(adapted.unknown.includes('bondAlbedo'));
B.validateEligibilityWitness(witness);
console.log('P6 environment epistemic state conformance: PASS');
