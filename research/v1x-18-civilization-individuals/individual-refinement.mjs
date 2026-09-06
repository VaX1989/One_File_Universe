import {createHash} from 'node:crypto';
import {MODEL_FAMILY, LIMITS, validateWorld, internals} from './civilization-model.mjs';

export const INDIVIDUAL_MODEL_ID='ofu-r18-civ-person-refinement-1';
export const INDIVIDUAL_LIMITS=Object.freeze({maxMaterialized:128,maxMemories:8,maxKnowledge:6,maxGoals:4,maxRelationships:6});

function fail(message){throw new Error(`R18 individual refinement: ${message}`);}
function assert(ok,message){if(!ok)fail(message);}
function hashHex(domain,...parts){const h=createHash('sha256');h.update(domain);for(const p of parts){h.update('\0');h.update(String(p));}return h.digest('hex');}
function hashInt(domain,mod,...parts){assert(Number.isSafeInteger(mod)&&mod>0,'hash modulus');return Number(BigInt('0x'+hashHex(domain,...parts).slice(0,16))%BigInt(mod));}
function personId(worldId,originId,birthYear,serial){return hashHex('OFU-R18-PERSON-v1',worldId,originId,birthYear,serial);}
function locateSettlement(world,id){const s=world.settlements.find(x=>x.id===id);assert(s,`unknown settlement ${id}`);return s;}
function currentSliceEntries(world,settlementId){const s=locateSettlement(world,settlementId);return s.slices.map(slice=>({...slice,currentSettlementId:s.id,age:internals.ageAt(slice,world.year)}));}

export function personAddress(world, settlementId, ordinal){
  validateWorld(world);assert(Number.isSafeInteger(ordinal)&&ordinal>=0,'ordinal');
  let offset=ordinal;
  for(const slice of currentSliceEntries(world,settlementId)){
    if(offset<slice.count)return Object.freeze({currentSettlementId:settlementId,originId:slice.originId,birthYear:slice.birthYear,serial:slice.serialStart+offset});
    offset-=slice.count;
  }
  fail('ordinal exceeds settlement population');
}

function parentRefs(world,address){
  const candidates=world.birthLedger.filter(e=>e.settlementId===address.originId&&e.birthYear<=address.birthYear-18&&e.birthYear>=address.birthYear-45&&e.count>0)
    .sort((a,b)=>a.birthYear-b.birthYear);
  if(!candidates.length)return [];
  const refs=[];
  for(let k=0;k<Math.min(2,candidates.length);k++){
    const idx=hashInt('OFU-R18-PARENT-COHORT-v1',candidates.length,address.originId,address.birthYear,address.serial,k),c=candidates[idx];
    const serial=hashInt('OFU-R18-PARENT-SERIAL-v1',c.count,address.originId,address.birthYear,address.serial,k,c.birthYear);
    refs.push({kind:'genealogical-parent-candidate',id:personId(world.worldId,c.settlementId,c.birthYear,serial),originId:c.settlementId,birthYear:c.birthYear,serial,certainty:'MODEL_DERIVED_SYNTHETIC'});
  }
  return refs;
}

function roleFor(address,age,settlement){
  if(age<15)return 'dependent';if(age>=65)return 'elder';
  const roles=['food-producer','craft-worker','trader','builder','care-worker','administrator'];
  const techBias=settlement.technologyPpm>600000?2:0;
  return roles[(hashInt('OFU-R18-ROLE-v1',roles.length,address.originId,address.birthYear,address.serial)+techBias)%roles.length];
}
function goalsFor(settlement){
  const out=[];
  if(settlement.foodStock<internals.population(settlement)*50)out.push('secure-food');
  if(settlement.conflictPpm>350000)out.push('reduce-risk');
  if(settlement.infrastructure<settlement.ruins)out.push('repair-infrastructure');
  if(settlement.technologyPpm<700000)out.push('acquire-knowledge');
  if(!out.length)out.push('maintain-household');
  return out.slice(0,INDIVIDUAL_LIMITS.maxGoals);
}
function knowledgeFor(address,settlement){
  const pool=['local-terrain','food-practices','kin-network','trade-routes','construction','institutions','craft-technique','ritual-tradition','conflict-memory'];
  const count=Math.min(INDIVIDUAL_LIMITS.maxKnowledge,2+Math.floor(settlement.technologyPpm/250000));
  const ranked=pool.map(topic=>({topic,rank:hashHex('OFU-R18-KNOWLEDGE-v1',address.originId,address.birthYear,address.serial,topic)})).sort((a,b)=>a.rank.localeCompare(b.rank));
  return ranked.slice(0,count).map(x=>x.topic);
}
function memoriesFor(world,address){
  return world.history.filter(e=>e.year>=address.birthYear&&(e.settlementId===address.currentSettlementId||e.settlementId===address.originId)).slice(-INDIVIDUAL_LIMITS.maxMemories).map(e=>({type:e.type,year:e.year,settlementId:e.settlementId}));
}

export function materializePerson(world,address){
  validateWorld(world);assert(address&&typeof address==='object','address');
  const settlement=locateSettlement(world,address.currentSettlementId);
  const slice=settlement.slices.find(s=>s.originId===address.originId&&s.birthYear===address.birthYear&&address.serial>=s.serialStart&&address.serial<s.serialStart+s.count);
  assert(slice,'address is not represented by active aggregate slice');
  const age=world.year-address.birthYear;
  const id=personId(world.worldId,address.originId,address.birthYear,address.serial);
  const relationships=parentRefs(world,address).slice(0,INDIVIDUAL_LIMITS.maxRelationships);
  return Object.freeze({
    modelId:INDIVIDUAL_MODEL_ID,authority:'MODEL_DERIVED_SIMULATION',id,address:Object.freeze({...address}),age,ageBand:internals.ageBand(age),
    role:roleFor(address,age,settlement),knowledge:Object.freeze(knowledgeFor(address,settlement)),goals:Object.freeze(goalsFor(settlement)),
    memories:Object.freeze(memoriesFor(world,address)),relationships:Object.freeze(relationships),
    lifeEvents:Object.freeze([{type:'birth',year:address.birthYear,settlementId:address.originId},...(address.originId!==address.currentSettlementId?[{type:'migration-before-materialization',year:null,settlementId:address.currentSettlementId}]:[])])
  });
}

export function refineIndividuals(world,{settlementId,start=0,count=1}){
  validateWorld(world);assert(Number.isSafeInteger(start)&&start>=0,'start');assert(Number.isSafeInteger(count)&&count>=0&&count<=INDIVIDUAL_LIMITS.maxMaterialized,'count budget');
  const total=internals.population(locateSettlement(world,settlementId));assert(start+count<=total,'refinement range');
  const people=[];for(let i=0;i<count;i++)people.push(materializePerson(world,personAddress(world,settlementId,start+i)));
  return Object.freeze({operation:'REFINE',contract:'ofu-px-cross-scale-1',modelId:INDIVIDUAL_MODEL_ID,worldId:world.worldId,year:world.year,settlementId,start,count,totalPopulation:total,people:Object.freeze(people)});
}

export function projectIndividuals(world,refinement){
  validateWorld(world);assert(refinement?.modelId===INDIVIDUAL_MODEL_ID,'model id');
  const byAge={child:0,adult:0,elder:0},byRole={};
  for(const person of refinement.people){byAge[person.ageBand]++;byRole[person.role]=(byRole[person.role]||0)+1;}
  return Object.freeze({operation:'PROJECT',contract:'ofu-px-cross-scale-1',settlementId:refinement.settlementId,sampleCount:refinement.people.length,totalPopulation:internals.population(locateSettlement(world,refinement.settlementId)),byAge:Object.freeze(byAge),byRole:Object.freeze(byRole)});
}

export function reconcileIndividuals(world,refinement){
  const projection=projectIndividuals(world,refinement),seen=new Set();
  for(const person of refinement.people){
    assert(!seen.has(person.id),'duplicate individual');seen.add(person.id);
    const rematerialized=materializePerson(world,person.address);assert(rematerialized.id===person.id,'identity drift');
    assert(JSON.stringify(rematerialized)===JSON.stringify(person),'late materialization drift');
    assert(person.memories.length<=INDIVIDUAL_LIMITS.maxMemories&&person.knowledge.length<=INDIVIDUAL_LIMITS.maxKnowledge&&person.goals.length<=INDIVIDUAL_LIMITS.maxGoals&&person.relationships.length<=INDIVIDUAL_LIMITS.maxRelationships,'bounded cognition');
  }
  assert(projection.sampleCount<=projection.totalPopulation,'sample exceeds aggregate');
  return Object.freeze({operation:'RECONCILE',contract:'ofu-px-cross-scale-1',status:'PASS',modelId:INDIVIDUAL_MODEL_ID,projection,method:'IDENTITY_MEMBERSHIP_REMaterialization_AND_BOUNDED_COGNITION_CHECK'});
}

export const identityResearch=Object.freeze({personId,hashFunction:'SHA-256 via node:crypto research prototype',promotionPath:'replace Node binding with frozen OFU canonical digest/domain separation without changing address tuple'});
