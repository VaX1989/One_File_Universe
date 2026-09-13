const text=(value,label)=>{const output=String(value??'').trim();if(!output)throw new TypeError(label+' is required');return output};

export function createMaterializationCache({maxEntries=8,onDispose=value=>value?.dispose?.()}={}){
  const limit=Number(maxEntries);if(!Number.isInteger(limit)||limit<2)throw new TypeError('Materialization cache maxEntries must be an integer >= 2');
  if(typeof onDispose!=='function')throw new TypeError('Materialization cache disposer must be a function');
  const entries=new Map(),pinned=new Set(),evicted=[];let epoch=0,hits=0,misses=0,evictions=0,disposals=0,rematerializations=0;
  const touch=entry=>{entry.lastUsed=++epoch;return entry.value};
  const disposeEntry=(key,reason)=>{const entry=entries.get(key);if(!entry)return false;entries.delete(key);try{onDispose(entry.value,{key,kind:entry.kind,reason})}finally{disposals++}return true};
  const enforce=()=>{
    while(entries.size>limit){const candidate=[...entries.values()].filter(entry=>!pinned.has(entry.key)).sort((a,b)=>a.lastUsed-b.lastUsed||a.key.localeCompare(b.key))[0];if(!candidate)throw new Error('Materialization cache capacity is smaller than its pinned working set');disposeEntry(candidate.key,'LRU_EVICTION');evictions++;evicted.push(candidate.key);if(evicted.length>64)evicted.shift()}
  };
  return Object.freeze({
    get capacity(){return limit},
    has(key){return entries.has(String(key))},
    get(key){const entry=entries.get(String(key));if(!entry){misses++;return null}hits++;return touch(entry)},
    materialize(key,factory,{kind='CONTEXT',pin=false}={}){
      key=text(key,'materialization key');if(typeof factory!=='function')throw new TypeError('Materialization factory is required');
      const existing=entries.get(key);if(existing){hits++;if(pin)pinned.add(key);return touch(existing)}
      misses++;if(evicted.includes(key))rematerializations++;const value=factory();if(value==null)throw new Error('Materialization factory returned no context for '+key);
      entries.set(key,{key,kind:String(kind).toUpperCase(),value,lastUsed:++epoch});if(pin)pinned.add(key);enforce();return value;
    },
    setPinned(keys=[]){pinned.clear();for(const key of keys){const normalized=String(key);if(entries.has(normalized))pinned.add(normalized)}enforce();return Object.freeze([...pinned])},
    delete(key,{reason='EXPLICIT_DISPOSAL'}={}){key=String(key);pinned.delete(key);return disposeEntry(key,reason)},
    clear(){for(const key of [...entries.keys()])disposeEntry(key,'CACHE_DISPOSAL');pinned.clear();return true},
    snapshot(){const rows=[...entries.values()].sort((a,b)=>a.lastUsed-b.lastUsed).map(entry=>Object.freeze({key:entry.key,kind:entry.kind,pinned:pinned.has(entry.key),lastUsed:entry.lastUsed}));return Object.freeze({contract:'ofu-spatial-materialization-cache-1',capacity:limit,size:entries.size,bounded:entries.size<=limit,pinned:Object.freeze([...pinned]),entries:Object.freeze(rows),metrics:Object.freeze({hits,misses,evictions,disposals,rematerializations}),evictedHistory:Object.freeze([...evicted])})}
  });
}
