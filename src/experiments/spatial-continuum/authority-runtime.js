const copyKey=key=>Object.freeze(Object.fromEntries(Object.entries(key).map(([name,value])=>[name,BigInt(value)])));

export function createReadOnlyAuthorityRuntime(root=globalThis,{ctx,seedKey}={}){
  const O=root.OFU,AS=O?.v1ExplorationAddressSpace,P=O?.pxProduct,W=O?.v1WorldContext,providers=O?.v1Providers;
  if(!ctx||!seedKey||!AS||!P||!W||!providers)throw new Error('OFU read-only authority dependencies are not ready');
  const seed=copyKey(seedKey),universe=AS.universe(P.captured(seed).selection.target.universeId);
  let selected=null,world=null,point=null,local=null,disposed=false;
  function graphForKey(input){
    const key=copyKey(input),galaxy=AS.galaxyFromCanonical({ctx,universeNode:universe,canonicalKey:key}),region=AS.regionFromCanonical({ctx,galaxy,canonicalKey:key}),hood=AS.neighborhood(region,{x:key.siteX/16n,y:key.siteY/16n,z:key.siteZ/16n}),system=AS.systemFromCanonical({ctx,neighborhood:hood,canonicalKey:key}),children=AS.systemChildren({ctx,system}),planet=children.planets.find(node=>node.canonicalKey.orbitSlot===key.orbitSlot),body=key.satelliteSlot===undefined?planet:children.moons.find(node=>node.canonicalKey.orbitSlot===key.orbitSlot&&node.canonicalKey.satelliteSlot===key.satelliteSlot);
    if(!body)throw new Error('Canonical body does not exist at the requested key');
    return Object.freeze({galaxy,region,hood,system,body,children});
  }
  const seedGraph=graphForKey(seed);
  function enterKey(input){
    if(disposed)throw new Error('Read-only authority runtime is disposed');
    selected=graphForKey(input);const selection=P.captured(selected.body.canonicalKey).selection;
    world=providers.worldForBody(selection,selected.body.kind==='moon'?Number(selected.body.canonicalKey.satelliteSlot):null);point=null;local=null;return snapshot();
  }
  function query(id,payload={}){
    if(disposed)throw new Error('Read-only authority runtime is disposed');if(!selected?.body||!['planet','moon'].includes(selected.body.kind))throw new Error('Provider query requires a selected world');
    const selection=P.captured(selected.body.canonicalKey).selection,descriptor=P.registry.descriptor(id),operation=['INSPECT','DISCOVER','REPRESENT'].find(candidate=>descriptor.operations.includes(candidate));if(!operation)throw new Error('Provider has no read-only operation: '+id);
    const merged=selected.body.kind==='moon'?{...payload,satelliteSlot:Number(selected.body.canonicalKey.satelliteSlot)}:payload;
    return P.registry.invoke(id,{contract:O.pxContracts.VERSION,provider:id,operation,selection,fidelity:descriptor.fidelity,budget:descriptor.budget,payload:merged}).value;
  }
  function at(latMicroDeg=0,lonMicroDeg=0){
    if(!world)throw new Error('Select a world before resolving a surface location');
    point=W.location(world.planetIdentity,Number(latMicroDeg),Number(lonMicroDeg));local=query('v1.query.local-world',{...point,historyEpoch:world?.civilization?.epoch??0});return snapshot();
  }
  function scale(stage){if(String(stage).toUpperCase()!=='HUMAN')throw new Error('The read-only authority runtime only materializes HUMAN context');if(!point)at(0,0);return snapshot()}
  function snapshot(){return Object.freeze({version:'ofu-spatial-continuum-read-only-authority-runtime-1',body:selected?.body||null,system:selected?.system||null,world,point,local,sideEffectFree:true,globalScaleMutation:false})}
  function dispose(){disposed=true;selected=null;world=null;point=null;local=null;return true}
  enterKey(seed);
  return Object.freeze({VERSION:'ofu-spatial-continuum-read-only-authority-runtime-1',ctx,universe,seed,seedGraph,graphForKey,enterKey,query,at,scale,snapshot,dispose});
}
