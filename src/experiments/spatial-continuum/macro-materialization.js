const freezeList=value=>Object.freeze([...(value||[])]);
const clampPositive=(value,fallback)=>Math.max(1,Math.trunc(Number(value)||fallback));

export function createProgressiveMacroMaterializer({maxResident=32,maxBuildPerSlice=4,now=()=>globalThis.performance?.now?.()??Date.now()}={}){
  maxResident=clampPositive(maxResident,32);
  maxBuildPerSlice=Math.min(maxResident,clampPositive(maxBuildPerSlice,4));
  let epoch=0,active=new Map(),pending=null,lastTransition=null,cancelled=0,staleCompletions=0,commits=0,slices=0,built=0,evicted=0;

  const snapshot=()=>Object.freeze({
    contract:'ofu-progressive-macro-materializer-1',
    epoch,
    active:freezeList(active.values()),
    activeKeys:freezeList(active.keys()),
    pending:pending?Object.freeze({epoch:pending.epoch,targetKeys:freezeList(pending.targetKeys),remaining:pending.queue.length,built:pending.next.size,startedAt:pending.startedAt}):null,
    lastTransition,
    metrics:Object.freeze({cancelled,staleCompletions,commits,slices,built,evicted,maxResident,maxBuildPerSlice}),
  });

  const cancel=(reason='SUPERSEDED')=>{
    if(!pending)return Object.freeze({cancelled:false,epoch,reason:String(reason)});
    const cancelledEpoch=pending.epoch;pending=null;cancelled++;
    return Object.freeze({cancelled:true,epoch:cancelledEpoch,reason:String(reason)});
  };

  const begin=(targets,{keyOf=item=>String(item?.id??item),priorityOf=()=>0,reason='TARGET_CHANGED'}={})=>{
    cancel(reason);
    const targetList=[...(targets||[])],seen=new Set(),unique=[];
    for(const item of targetList){const key=String(keyOf(item));if(!key||seen.has(key))continue;seen.add(key);unique.push({key,item,priority:Number(priorityOf(item))||0,index:unique.length})}
    unique.sort((a,b)=>b.priority-a.priority||a.index-b.index);
    const bounded=unique.slice(0,maxResident),next=new Map(),queue=[];
    for(const entry of bounded){if(active.has(entry.key))next.set(entry.key,active.get(entry.key));else queue.push(entry)}
    const targetKeys=bounded.map(entry=>entry.key),nextEpoch=++epoch;
    pending={epoch:nextEpoch,targetKeys,next,queue,startedAt:now(),reason:String(reason)};
    if(!queue.length)commit(nextEpoch);
    return Object.freeze({epoch:nextEpoch,targetKeys:freezeList(targetKeys),reused:next.size,pending:queue.length});
  };

  const commit=requestEpoch=>{
    if(!pending||pending.epoch!==requestEpoch){staleCompletions++;return Object.freeze({status:'STALE',epoch:requestEpoch})}
    const previous=active,next=pending.next;
    let removed=0;for(const key of previous.keys())if(!next.has(key))removed++;
    active=new Map(next);evicted+=removed;commits++;
    lastTransition=Object.freeze({epoch:requestEpoch,startedAt:pending.startedAt,committedAt:now(),durationMs:Math.max(0,now()-pending.startedAt),resident:active.size,evicted:removed});
    pending=null;
    return Object.freeze({status:'COMMITTED',epoch:requestEpoch,resident:active.size,evicted:removed});
  };

  const runSlice=({build,keyOf=item=>String(item?.id??item),budget=maxBuildPerSlice}={})=>{
    if(typeof build!=='function')throw new TypeError('Macro materialization slice requires a build function');
    if(!pending)return Object.freeze({status:'IDLE',built:0,remaining:0});
    const requestEpoch=pending.epoch,limit=Math.min(maxBuildPerSlice,clampPositive(budget,maxBuildPerSlice));let count=0;
    slices++;
    while(pending&&pending.epoch===requestEpoch&&count<limit&&pending.queue.length){
      const entry=pending.queue.shift(),value=build(entry.item,{epoch:requestEpoch,key:entry.key,index:entry.index});
      if(!pending||pending.epoch!==requestEpoch){staleCompletions++;return Object.freeze({status:'STALE',epoch:requestEpoch,built:count,remaining:0})}
      pending.next.set(String(keyOf(value)||entry.key),value);count++;built++;
    }
    if(pending&&pending.epoch===requestEpoch&&!pending.queue.length){const result=commit(requestEpoch);return Object.freeze({...result,built:count,remaining:0})}
    return Object.freeze({status:'PENDING',epoch:requestEpoch,built:count,remaining:pending?.queue.length||0,resident:active.size,transitionResident:active.size+(pending?.next.size||0)});
  };

  const dispose=({disposeValue=null,reason='DISPOSE'}={})=>{
    cancel(reason);if(typeof disposeValue==='function')for(const value of active.values())disposeValue(value,reason);const removed=active.size;active.clear();evicted+=removed;epoch++;
    return Object.freeze({disposed:removed,epoch,reason:String(reason)});
  };

  return Object.freeze({begin,runSlice,cancel,dispose,snapshot,get active(){return freezeList(active.values())},get hasPending(){return !!pending}});
}
