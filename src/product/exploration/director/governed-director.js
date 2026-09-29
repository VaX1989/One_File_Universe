export const DIRECTOR_VERSION=1;
export const DIRECTOR_DESCRIPTOR_CONTRACT='ofu-prod-w2-director-journey-1';
export const DIRECTOR_AUTHORITY='PRESENTATION_ONLY';
export const DIRECTOR_CAPTURE_AUTHORITY='OBSERVATIONAL_METADATA_ONLY';
export const DIRECTOR_DEFAULT_LIMITS=Object.freeze({
  maxStops:32,
  maxDescriptorBytes:131072,
  maxCaptures:32,
  maxCaptureMetadataBytes:16384
});

const encoder=new TextEncoder();
const FNV64_OFFSET=14695981039346656037n;
const FNV64_PRIME=1099511628211n;
const FNV64_MASK=(1n<<64n)-1n;

function fail(message){throw new Error('OFU Director: '+message)}
function plain(value){return !!value&&typeof value==='object'&&!Array.isArray(value)}
function integer(value,label,min,max){
  if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of bounds');
  return value;
}
function normalizeLimits(input={}){
  if(!plain(input))fail('limits must be a plain object');
  const allowed=new Set(Object.keys(DIRECTOR_DEFAULT_LIMITS));
  for(const key of Object.keys(input))if(!allowed.has(key))fail('unsupported limit: '+key);
  return Object.freeze({
    maxStops:integer(input.maxStops??DIRECTOR_DEFAULT_LIMITS.maxStops,'maxStops',2,256),
    maxDescriptorBytes:integer(input.maxDescriptorBytes??DIRECTOR_DEFAULT_LIMITS.maxDescriptorBytes,'maxDescriptorBytes',1024,1024*1024),
    maxCaptures:integer(input.maxCaptures??DIRECTOR_DEFAULT_LIMITS.maxCaptures,'maxCaptures',0,256),
    maxCaptureMetadataBytes:integer(input.maxCaptureMetadataBytes??DIRECTOR_DEFAULT_LIMITS.maxCaptureMetadataBytes,'maxCaptureMetadataBytes',256,131072)
  });
}
function stable(value){
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(stable);
  const out={};
  for(const key of Object.keys(value).sort())out[key]=stable(value[key]);
  return out;
}
function canonical(value){return JSON.stringify(stable(value))}
function fnv64(text){
  let hash=FNV64_OFFSET;
  for(const byte of encoder.encode(text)){hash^=BigInt(byte);hash=(hash*FNV64_PRIME)&FNV64_MASK}
  return hash.toString(16).padStart(16,'0');
}
function bytes(value){return encoder.encode(typeof value==='string'?value:canonical(value)).length}
function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value))}
function freeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value))freeze(child);
    Object.freeze(value);
  }
  return value;
}
function projection(plan,index){
  if(!plain(plan))fail('atlas revisit plan['+index+'] must be an object');
  if(plan.authority!=='REFERENCE_ONLY')fail('atlas revisit plan['+index+'] authority must be REFERENCE_ONLY');
  if(!plain(plan.subject)||typeof plan.subject.canonicalId!=='string'||!plan.subject.canonicalId.length)fail('atlas revisit plan['+index+'] subject identity missing');
  return {
    index,
    atlasEntryId:String(plan.atlasEntryId),
    kind:String(plan.kind),
    subjectCanonicalId:String(plan.subject.canonicalId),
    returnRef:plan.returnRef===null?null:clone(plan.returnRef),
    temporalRef:plan.temporalRef===null?null:clone(plan.temporalRef),
    scientificFingerprintRef:plan.scientificFingerprintRef===null?null:clone(plan.scientificFingerprintRef),
    exactTemporalStateReference:plan.exactTemporalStateReference===true,
    presentationHintOnly:plan.presentationHintOnly===true
  };
}
function descriptorPayload({routeId,routeLabel,stops}){
  return {
    contract:DIRECTOR_DESCRIPTOR_CONTRACT,
    version:DIRECTOR_VERSION,
    authority:DIRECTOR_AUTHORITY,
    routeId,
    routeLabel,
    stops,
    capture:{authority:DIRECTOR_CAPTURE_AUTHORITY,mode:'METADATA_ONLY'},
    mutations:{canonical:false,scientific:false,timeline:false,cameraAuthority:false,rendererAuthority:false,pickingAuthority:false},
    networkRequired:false
  };
}
function validateDescriptor(value,limits){
  if(!plain(value)||value.contract!==DIRECTOR_DESCRIPTOR_CONTRACT||value.version!==DIRECTOR_VERSION||value.authority!==DIRECTOR_AUTHORITY)fail('unsupported journey descriptor');
  if(typeof value.routeId!=='string'||!value.routeId.length)fail('descriptor route id missing');
  if(!Array.isArray(value.stops)||value.stops.length<2||value.stops.length>limits.maxStops)fail('descriptor stop count out of bounds');
  if(bytes(value)>limits.maxDescriptorBytes)fail('descriptor exceeds byte limit');
  const raw={...value};delete raw.descriptorId;delete raw.descriptorHash;
  const digest=fnv64(canonical(raw));
  if(value.descriptorId!=='journey-'+digest||value.descriptorHash!=='fnv1a64:'+digest)fail('descriptor hash/content mismatch');
  return value;
}
function summarize(snapshot){
  if(!plain(snapshot))fail('navigator snapshot must be an object');
  const render=plain(snapshot.render)?snapshot.render:{};
  if(render.sceneCount!==undefined&&render.sceneCount!==1)fail('journey observed more than one scene');
  if(render.cameraCount!==undefined&&render.cameraCount!==1)fail('journey observed more than one camera');
  if(render.rendererOwnedPicking!==undefined&&render.rendererOwnedPicking!==true)fail('journey observed non-renderer picking authority');
  if(snapshot.runtimeNetworkResources!==undefined&&snapshot.runtimeNetworkResources!==0)fail('journey observed mandatory runtime network resources');
  return freeze({
    semanticStage:snapshot.state?.scale?.semanticStage??snapshot.stage??null,
    targetStage:snapshot.state?.scale?.targetStage??null,
    moving:snapshot.state?.scale?.moving??null,
    worldIdentity:snapshot.worldIdentity??snapshot.world?.canonicalId??null,
    focusId:snapshot.openUniverse?.focusId??snapshot.selection?.canonicalId??null,
    sceneCount:render.sceneCount??null,
    cameraCount:render.cameraCount??null,
    rendererOwnedPicking:render.rendererOwnedPicking??null,
    runtimeNetworkResources:snapshot.runtimeNetworkResources??null
  });
}
function cancellation(signal){return !!signal?.aborted}
async function restoreOrigin(navigator,bookmark){
  await navigator.restoreBookmark(bookmark);
  await navigator.waitForSettled();
  return summarize(await navigator.snapshot());
}

export function createJourneyDescriptor({atlas,routeId,limits={}}={}){
  if(!atlas||typeof atlas.getRoute!=='function'||typeof atlas.revisitPlan!=='function')fail('Atlas getRoute/revisitPlan capability required');
  const bounded=normalizeLimits(limits),route=atlas.getRoute(routeId);
  if(!route)fail('unknown Atlas route');
  if(!Array.isArray(route.entryIds)||route.entryIds.length<2||route.entryIds.length>bounded.maxStops)fail('Atlas route stop count out of bounds');
  const stops=route.entryIds.map((entryId,index)=>{
    const plan=atlas.revisitPlan(entryId);
    if(String(plan.atlasEntryId)!==String(entryId))fail('Atlas route/revisit identity mismatch');
    return projection(plan,index);
  });
  const raw=descriptorPayload({routeId:String(route.id),routeLabel:route.label??null,stops});
  if(bytes(raw)>bounded.maxDescriptorBytes)fail('descriptor exceeds byte limit');
  const digest=fnv64(canonical(raw));
  return freeze({...raw,descriptorId:'journey-'+digest,descriptorHash:'fnv1a64:'+digest});
}

export function createDirector({atlas,navigator,limits={}}={}){
  if(!atlas||typeof atlas.revisitPlan!=='function')fail('Atlas revisitPlan capability required');
  const required=['snapshot','captureBookmark','restoreBookmark','navigateAtlasPlan','waitForSettled'];
  if(!navigator||required.some(name=>typeof navigator[name]!=='function'))fail('existing navigation authority adapter is incomplete');
  const bounded=normalizeLimits(limits);

  async function restore(bookmark){
    if(bookmark===undefined||bookmark===null)fail('bookmark required');
    return restoreOrigin(navigator,bookmark);
  }

  async function run(descriptor,{signal=null,reducedMotion=false,capture=true}={}){
    validateDescriptor(descriptor,bounded);
    const originBookmark=await navigator.captureBookmark();
    const origin=summarize(await navigator.snapshot());
    const captures=[];
    let completed=0;
    try{
      for(const stop of descriptor.stops){
        if(cancellation(signal)){
          const restored=await restoreOrigin(navigator,originBookmark);
          return freeze({status:'CANCELLED_RESTORED',descriptorId:descriptor.descriptorId,completedStops:completed,originBookmark,origin,restored,captures});
        }
        const plan=atlas.revisitPlan(stop.atlasEntryId);
        const live=projection(plan,stop.index);
        if(canonical(live)!==canonical(stop))fail('Atlas reference changed since descriptor creation');
        await navigator.navigateAtlasPlan(plan,{signal,reducedMotion:Boolean(reducedMotion)});
        await navigator.waitForSettled({signal});
        const summary=summarize(await navigator.snapshot());
        if(summary.worldIdentity!==null&&summary.worldIdentity!==stop.subjectCanonicalId)fail('journey target identity mismatch at stop '+stop.index);
        if(capture&&captures.length<bounded.maxCaptures){
          const metadata=freeze({
            contract:'ofu-prod-w2-director-capture-metadata-1',
            authority:DIRECTOR_CAPTURE_AUTHORITY,
            descriptorId:descriptor.descriptorId,
            stopIndex:stop.index,
            atlasEntryId:stop.atlasEntryId,
            subjectCanonicalId:stop.subjectCanonicalId,
            semanticStage:summary.semanticStage,
            worldIdentity:summary.worldIdentity,
            reducedMotion:Boolean(reducedMotion)
          });
          if(bytes(metadata)>bounded.maxCaptureMetadataBytes)fail('capture metadata exceeds byte limit');
          captures.push(metadata);
        }
        completed++;
      }
      return freeze({status:'COMPLETE',descriptorId:descriptor.descriptorId,completedStops:completed,originBookmark,origin,final:summarize(await navigator.snapshot()),captures});
    }catch(error){
      try{await restoreOrigin(navigator,originBookmark)}catch(restoreError){
        throw new AggregateError([error,restoreError],'OFU Director journey failed and origin restoration also failed');
      }
      throw error;
    }
  }

  return Object.freeze({
    version:DIRECTOR_VERSION,
    authority:DIRECTOR_AUTHORITY,
    limits:bounded,
    createDescriptor:routeId=>createJourneyDescriptor({atlas,routeId,limits:bounded}),
    run,
    restore
  });
}
