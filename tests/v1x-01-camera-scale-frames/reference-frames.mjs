import {assert,graph,close} from './support.mjs';
const g=graph();
const pairs=[['galaxy','system'],['system','planet'],['planet','surface'],['surface','human'],['human','micro'],['micro','galaxy'],['surface','galaxy']];
for(const [from,to] of pairs){
 const transform=g.relativeTransform(from,to);assert.equal(transform.matrix.length,16);assert.ok(transform.matrix.every(Number.isFinite),from+' -> '+to+' finite');
 const witness=g.witness(from,to,[.123,-.2,.4]);assert.equal(witness.finite,true);assert.ok(Number.isFinite(witness.roundTripErrorMeters));
}
assert.ok(g.witness('micro','galaxy',[.123,-.2,.4]).roundTripErrorMeters<1e-6,'macro/micro round trip stays sub-micrometre in physical error');
assert.ok(g.witness('surface','galaxy',[.123,-.2,.4]).roundTripErrorMeters<1,'surface/macro flattened witness stays finite and sub-metre');
let pose={frameId:'micro',position:[.123,-.2,.4],orientation:[0,0,0,1]};
for(const frame of ['human','surface','planet','system','galaxy'])pose=g.rebasePose(pose,frame);
assert.ok(pose.position.every(Number.isFinite));
// Direct Number flattening is deliberately not claimed to preserve microscopic residue.
const matrix=g.relativeTransform('micro','galaxy').matrix;assert.ok(Math.abs(matrix[0])>0&&Number.isFinite(1/matrix[0]));
close(g.frame('micro').metersPerUnit,1e-9,0);
console.log(JSON.stringify({status:'PASS',oracle:'v1x01-reference-frames-oracle-1',pairs:pairs.length,macroMicroFinite:true,authority:'PRESENTATION_ONLY'}));
