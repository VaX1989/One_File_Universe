import assert from 'node:assert/strict';
import {load,authority,selection,budget} from '../extensions/helpers.mjs';
const O=load([
 'src/extensions/cross-scale.js',
 'src/domains/v1/surface/address.js',
 'src/domains/v1/surface/cross-scale-adapter.js'
]);
const A=O.v2x06SurfaceAddress,S=O.v2x06SurfaceCrossScale,X=O.pxCrossScale;
const address=A.locate('world-cross-scale',12345678,-76543210,3),observables={[S.LOCATION_OBSERVABLE]:address.locationIdentity,[S.PLANET_OBSERVABLE]:address.planetIdentity};
function parentFor(level){return X.commit({selection:selection(),regime:S.regime(level),authority:authority(),spatial:{frame:'planet-local',unit:'mm',anchor:['0','0','0'],bounds:[['-1000','1000'],['-1000','1000'],['-1000','1000']]},matter:[],observables})}
const refined=S.refineContext({parent:parentFor(3),address,toLevel:9,authority:authority(),budget:{...budget,bytes:131072}});assert.equal(refined.operation,'REFINE');assert.equal(refined.witness.status,'PASS');assert.equal(refined.address.locationIdentity,address.locationIdentity);assert.equal(refined.result.details[0].representation.locationIdentity,address.locationIdentity);assert.deepEqual(refined.rule.observableKeys,['surface.location.identity','surface.planet.identity']);
const fine=A.atLevel(address,9),projected=S.projectContext({parent:parentFor(9),address:fine,toLevel:3,authority:authority(),budget:{...budget,bytes:131072}});assert.equal(projected.operation,'PROJECT');assert.equal(projected.witness.status,'PASS');assert.equal(projected.address.locationIdentity,address.locationIdentity);
const reconciled=S.reconcileContext({parent:parentFor(3),address,toLevel:7,authority:authority(),budget:{...budget,bytes:131072}});assert.equal(reconciled.operation,'RECONCILE');assert.equal(reconciled.witness.status,'PASS');
console.log(JSON.stringify({schema:'ofu-v2x-06-cross-scale-oracle-1',status:'PASS',locationIdentity:address.locationIdentity,refineWitness:refined.witness.status,projectWitness:projected.witness.status,reconcileWitness:reconciled.witness.status}));
