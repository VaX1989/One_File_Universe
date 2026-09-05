import assert from 'node:assert/strict';
import {load,DEFAULT_KEY} from './runtime-helper.mjs';
const {O,runtime:r}=load();let cases=0;const ok=(v,m)=>{assert.ok(v,m);cases++;};
const key={...DEFAULT_KEY,siteY:2n,siteZ:3n,orbitSlot:2n};r.enterKey(key);
const world=r.snapshot().world,W=O.v1WorldContext,B=O.v1Biology;
const canonicalBefore=O.pxContracts.stable(O.pxProduct.captured(key));
ok(/^[0-9a-f]{64}$/.test(world.canonicalInputDigest),'model world binds its captured canonical astronomy input by digest');
ok(world.biology.occupancy.biosphereEstablished,'real selected world establishes modeled biosphere');
ok(world.civilization.state==='MODELED_CIVILIZATION','civilization consumes actual evolved lineage');
ok(world.civilization.settlements.length>0&&world.civilization.settlements.length<=24,'bounded settlements');
const c=world.planetology.composition;ok(c.silicatePpm+c.metalPpm+c.volatilePpm===1000000,'compatibility composition conserves total mass fraction');
for(const s of world.civilization.settlements){
 const sample=W.sample(world.planetology,s.location),env=W.localEnvironment(world.planetology,sample);
 ok(sample.hydrology.surfaceState==='LAND_OR_EXPOSED_SUBSTRATE','settlements lie on modeled exposed land');
 ok(B.environmentEligibility(env).eligible,'settlement environment supports its lineage');
 ok(s.location.planetIdentity===world.planetIdentity,'settlement world identity');
 ok(s.canonicalPositionClaim===false,'modeled coordinates never claim canonical geodesy');
}
const point=world.civilization.settlements[0].location;r.at(point.latMicroDeg,point.lonMicroDeg,{stage:'HUMAN'});
const local=r.snapshot().local;ok(local.objects.some(o=>o.kind==='ORGANISM'),'local ecology is visible');ok(local.objects.some(o=>o.kind==='ARTIFACT'),'modeled technology yields local material');
for(const kind of ['ROCK','ORGANISM','ARTIFACT']){
 const object=local.objects.find(o=>o.kind===kind);ok(object,kind+' source exists');r.selectObject(object.entityId);r.enterMicro();
 ok(r.snapshot().micro.sourceEntityId===object.entityId,'source identity survives '+kind+' material projection');const scene=r.query('v1.scene.living-world',{...point,objectId:object.entityId,regime:'MATERIAL'});ok(scene.authority==='PRESENTATION_ONLY'&&scene.sourceEntityId===object.entityId,'registered scene retains actual material source without scientific promotion');
 for(const regime of ['MICROSTRUCTURE','MOLECULAR','ATOMIC']){r.deeper();const scene=r.query('v1.scene.living-world',{...point,objectId:object.entityId,regime});ok(scene.authority==='PRESENTATION_ONLY'&&scene.objects.length<=256,'registered '+regime+' handles bounded and unresolved chemistry');}ok(r.snapshot().micro.current.exactBulkInventoryClaim!==true,'no exhaustive atom enumeration');
 ok(r.snapshot().micro.current.classicalElectronTrajectoryClaim!==true,'no classical electron trajectory claim');
 for(let i=0;i<4;i++)r.back();ok(r.snapshot().point.locationIdentity===point.locationIdentity,'exact '+kind+' reverse context');
}
r.time(0);const origin=r.snapshot().world.civilization;r.time(60);r.time(0);ok(O.pxContracts.stable(r.snapshot().world.civilization)===O.pxContracts.stable(origin),'historical projection order-independent');
ok(O.pxContracts.stable(O.pxProduct.captured(key))===canonicalBefore,'model history and exploration never commit canonical P4 state');
r.enterKey(DEFAULT_KEY);const sterile=r.snapshot().world;ok(!sterile.biology.occupancy.biosphereEstablished,'real negative world remains sterile');ok(sterile.civilization.state!=='MODELED_CIVILIZATION','no civilization on sterile world');
r.at(0,0,{stage:'HUMAN'});ok(!r.snapshot().local.objects.some(o=>['ORGANISM','SETTLEMENT','ARTIFACT'].includes(o.kind)),'negative local branch has no invented organisms or artifacts');
const stable=r.snapshot();assert.throws(()=>r.at(90000001,0,{stage:'HUMAN'}));cases++;ok(r.snapshot().point.locationIdentity===stable.point.locationIdentity,'invalid latitude does not move selection');
ok(r.query('v1.query.model-history',{epoch:0}).archaeology.features.length===0,'sterile historical query is an empty causal history, not a failure');const source=r.snapshot().local.objects[0];assert.throws(()=>r.query('v1.query.material-source',{...stable.point,objectId:'invented-object'}));cases++;
ok(source.worldIdentity===sterile.planetIdentity,'sterile rock or ice still inspectable');
console.log(JSON.stringify({status:'PASS',suite:'wave-a-causal-contracts',cases,positiveWorld:world.planetIdentity,negativeWorld:sterile.planetIdentity,canonicalMutation:false}));
