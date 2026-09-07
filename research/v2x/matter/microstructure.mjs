import { addSafe, asciiCompare, assertRecord, boundedArray, mulDivFloor, nonNegativeInt, ppm, sumSafe, uniqueIds } from '../reference/bounded-math.mjs';
import { MATTER_AUTHORITY } from './reaction-network.mjs';
export const MICROSTRUCTURE_LIMITS=Object.freeze({grains:256,interfaces:512,maxVolume:10_000_000_000,maxDefects:10_000_000_000});

function allocateSource(volume, requests, label){const ordered=[...requests].sort((a,b)=>asciiCompare(a.id,b.id)),total=sumSafe(ordered.map(x=>x.request),`${label}.total`),out=new Map();if(total<=volume){for(const x of ordered)out.set(x.id,x.request);return out;}let used=0;for(const x of ordered){const v=mulDivFloor(volume,x.request,total,`${label}.${x.id}`);out.set(x.id,v);used=addSafe(used,v,`${label}.used`);}let residual=volume-used;for(const x of ordered){if(!residual)break;if(out.get(x.id)<x.request){out.set(x.id,out.get(x.id)+1);residual--;}}return out;}

export function evolveMicrostructure(state){
  assertRecord(state,'state');boundedArray(state.grains,'grains',MICROSTRUCTURE_LIMITS.grains);boundedArray(state.interfaces,'interfaces',MICROSTRUCTURE_LIMITS.interfaces);
  const ids=uniqueIds(state.grains,'grains');uniqueIds(state.interfaces,'interfaces');
  const grains=new Map(state.grains.map(g=>[g.id,{...g,volume:nonNegativeInt(g.volume,'volume',MICROSTRUCTURE_LIMITS.maxVolume),defects:nonNegativeInt(g.defects??0,'defects',MICROSTRUCTURE_LIMITS.maxDefects)}]));
  const openingVolume=sumSafe([...grains.values()].map(g=>g.volume),'openingVolume'),groups=new Map(),meta=new Map();
  for(const e of state.interfaces){if(!ids.has(e.from)||!ids.has(e.to)||e.from===e.to)throw new Error('invalid grain interface');const sourceVolume=grains.get(e.from).volume,maxTransfer=nonNegativeInt(e.maxTransfer??sourceVolume,'maxTransfer',MICROSTRUCTURE_LIMITS.maxVolume),transferPpm=ppm(e.transferPpm??0),request=Math.min(maxTransfer,mulDivFloor(sourceVolume,transferPpm,1_000_000,`interfaceRequest.${e.id}`));if(!groups.has(e.from))groups.set(e.from,[]);groups.get(e.from).push({id:e.id,request});meta.set(e.id,{...e,request});}
  const allocated=new Map();for(const [source,requests] of groups){const a=allocateSource(grains.get(source).volume,requests,`grain.${source}`);for(const [id,v] of a)allocated.set(id,v);}
  const delta=new Map(state.grains.map(g=>[g.id,0])),transfers=[];
  for(const id of [...meta.keys()].sort(asciiCompare)){const e=meta.get(id),transfer=allocated.get(id)??0;delta.set(e.from,addSafe(delta.get(e.from),-transfer,`grainDelta.${e.from}`));delta.set(e.to,addSafe(delta.get(e.to),transfer,`grainDelta.${e.to}`));transfers.push(Object.freeze({interfaceId:id,from:e.from,to:e.to,requested:e.request,transferred:transfer,sourceCompetitionRejected:e.request-transfer}));}
  for(const g of grains.values()){g.volume=addSafe(g.volume,delta.get(g.id),`grainVolume.${g.id}`);nonNegativeInt(g.volume,`grainVolume.${g.id}`,MICROSTRUCTURE_LIMITS.maxVolume);const removed=mulDivFloor(g.defects,ppm(g.annealPpm??0),1_000_000);g.defects-=removed;g.annealedDefects=removed;}
  const closingVolume=sumSafe([...grains.values()].map(g=>g.volume),'closingVolume');if(openingVolume!==closingVolume)throw new Error('volume conservation failed');
  return Object.freeze({authority:MATTER_AUTHORITY,grains:Object.freeze([...grains.values()].map(Object.freeze)),transfers:Object.freeze(transfers),evidence:Object.freeze({openingVolume,closingVolume}),transitionPolicy:'SIMULTANEOUS_OPENING_VOLUME_ALLOCATION_PER_SOURCE_GRAIN',permutationInvariantClaim:true,defectTransportClaim:false,nonClaim:'Representative microstructure abstraction, not universal constitutive law.'});
}
