import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const calls={baseStates:[],selected:[],draws:0};
function ctx(){return {save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){calls.draws++},arc(){calls.draws++},moveTo(){},lineTo(){},fill(){},stroke(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){}}}
const canvas={width:900,height:620,clientWidth:900,clientHeight:620,getContext(){return ctx()},getBoundingClientRect(){return {width:900,height:620}}};
const baseInstance={async render(s){calls.baseStates.push(s)},activateAt(){return false},dispose(){},state(){return {version:'domain-composed',domainComposition:{owner:'V2X-07'}}}};
let lifeState=null;
const packet=Object.freeze({presence:'VISIBLE_MODELED_LIFE',packetFingerprint:'life-packet-a',renderDescriptors:Object.freeze([{id:'render:sample-a',populationId:'population-a',lineageId:'lineage-a',primitiveFamily:'CHAINED_ELLIPSOIDS',segmentBudget:5,sizeScale:1,defenseScale:.5,position:Object.freeze({x:0,y:0,z:0}),orientationTurns:0,motion:Object.freeze({amplitude:.5})}]),selectionTargets:Object.freeze([{populationId:'population-a',persistentIndividual:false,individualIdentityPromoted:false,selectionAuthorityClaimed:false}]),revisitToken:Object.freeze({schema:'ofu-v2x-08-life-revisit-token-1',sourceEventKey:'living:0:0:region-a'}),authority:Object.freeze({ecology:'MODEL_DERIVED_SIMULATION',renderGeometry:'PRESENTATION_ONLY'}),claimGuards:Object.freeze({canonicalAlienBiology:false,persistentIndividualIdentity:false})});
const O={
 v1LivingRenderer:Object.freeze({__v2xDomainComposed:true,create(){return baseInstance}}),
 v2x08LifeV2:Object.freeze({VERSION:'ofu-v2x-08-life-shipping-runtime-2',createLifeState(input){lifeState=Object.freeze({schema:'ofu-v2x-08-life-state-1',...input});return lifeState},createLifeShippingAdapter({getState}){assert.equal(getState(),lifeState);return Object.freeze({descriptor:Object.freeze({id:'ofu.v2x-08.life-shipping-adapter'}),buildViewportPacket({regionId,viewportKey,maxSamples,quality}){assert.equal(regionId,'region-a');assert.equal(viewportKey,'living:region-a');assert.equal(maxSamples,32);assert.equal(quality,'HIGH');return packet},revisit(token){return token===packet.revisitToken?Object.freeze({status:'REVISITED_EXACT',packet}):Object.freeze({status:'STATE_RESOLUTION_REQUIRED'})}})}})
};
const sandbox={OFU:O,Object,Array,String,Number,Math,Set,Map,BigInt,Error,TypeError,console};sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../../src/rendering/v2x-convergence/living-life-v2-consumer.js',import.meta.url),'utf8'),sandbox,{filename:'living-life-v2-consumer.js'});
assert.equal(sandbox.OFU.v1LivingRenderer.__v2xLifeV2Consumed,true);
assert.equal(sandbox.OFU.v2xLivingLifeV2Consumer.VERSION,'ofu-v2x-living-life-v2-consumer-1');
const renderer=sandbox.OFU.v1LivingRenderer.create(canvas,{}, {onObject:id=>calls.selected.push(id)});
const organism={kind:'ORGANISM',entityId:'population-a',lineageId:'lineage-a',individuals:100,traits:{mobilityPpm:850000,bodySizePpm:800000,structuralDefensePpm:700000,phototrophyPpm:100000},morphology:{symmetry:'BILATERAL_LIKE_MODEL_DESCRIPTOR',supportMode:'INTERNAL_SUPPORT_MODELED',locomotionMode:'ACTIVE_SURFACE_TRAVEL',feedingMode:'RESOURCE_CAPTURE'}};
const settlement={kind:'SETTLEMENT',entityId:'settlement-a'};
const state={stage:'HUMAN',point:{locationIdentity:'region-a'},world:{civilization:{epoch:0},biology:{ecosystem:{generation:0}}},local:{life:{local:{regionIdentity:'region-a',populations:[organism]}},objects:[organism,settlement]}};
await renderer.render(state);
assert.equal(calls.baseStates.length,1);assert.deepEqual(calls.baseStates[0].local.objects,[settlement],'generic ORGANISM cue must be removed before V2X-07 base composition renders');
assert.equal(lifeState.schema,'ofu-v2x-08-life-state-1');assert.equal(lifeState.lineages[0].id,'lineage-a');assert.equal(lifeState.populations[0].id,'population-a');assert.equal(lifeState.regions['region-a'].opportunityPpm,1000000);
const result=renderer.state().lifeV2Consumption;assert.equal(result.status,'VISIBLE_MODELED_LIFE');assert.equal(result.owner,'V2X-08');assert.equal(result.legacyGenericOrganismCueUsed,false);assert.equal(result.descriptors,1);assert.deepEqual(Array.from(result.primitiveFamilies),['CHAINED_ELLIPSOIDS']);assert.equal(result.revisitCurrent,'REVISITED_EXACT');assert.equal(result.persistentIndividualIdentityPromoted,false);assert.equal(result.selectionAuthorityClaimed,false);assert.equal(result.persistenceAuthorityClaimed,false);assert.ok(calls.draws>0,'rich morphology grammar must reach the actual canvas');
assert.equal(renderer.activateAt(450,360),true);assert.deepEqual(calls.selected,['population-a'],'selection must route to the aggregate population id without person promotion');
await renderer.render(state);assert.equal(renderer.state().lifeV2Consumption.revisitPrevious,'REVISITED_EXACT');
await renderer.render({...state,stage:'SYSTEM'});assert.equal(renderer.state().lifeV2Consumption.status,'NOT_ACTIVE_AT_STAGE');
console.log(JSON.stringify({schema:'ofu-v2x-living-life-v2-consumer-witness-1',status:'PASS',owner:'V2X-08',runtime:'ofu-v2x-08-life-shipping-runtime-2',legacyGenericOrganismCueUsed:false,canvasConsumption:true,aggregateSelection:true,revisit:'REVISITED_EXACT',canonicalMutation:false}));
