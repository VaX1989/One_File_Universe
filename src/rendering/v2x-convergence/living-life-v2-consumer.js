(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const baseFactory=O.v1LivingRenderer,Life=O.v2x08LifeV2;
if(!baseFactory||!baseFactory.__v2xDomainComposed||!Life||typeof Life.createLifeState!=='function'||typeof Life.createLifeShippingAdapter!=='function')throw new Error('Living V2X-08 consumer dependencies missing');
if(baseFactory.__v2xLifeV2Consumed)return;
const VERSION='ofu-v2x-living-life-v2-consumer-1',MAX_SAMPLES=32,PPM=1000000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const idOf=v=>String(v?.entityId||v?.populationId||v?.id||'');
function safeInt(v,fallback=0){const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:fallback}
function ppm(v){const n=Number(v);return Number.isSafeInteger(n)?clamp(n,0,PPM):null}
function firstPpm(...values){for(const v of values){const n=ppm(v);if(n!==null)return n}return null}
function traitRows(pop){
 const t=pop?.traits||{},out=[];
 const rows=[
  ['body-size',firstPpm(t['body-size'],t.bodySizePpm,pop?.bodySizePpm)],
  ['mobility',firstPpm(t.mobility,t.mobilityPpm,pop?.mobilityPpm)],
  ['structural-defense',firstPpm(t['structural-defense'],t.structuralDefensePpm,t.defensePpm,pop?.structuralDefensePpm)],
  ['phototrophy',firstPpm(t.phototrophy,t.phototrophyPpm,pop?.phototrophyPpm)]
 ];
 for(const [key,value] of rows)if(value!==null)out.push({key,valuePpm:value});
 return out;
}
function morphology(pop){const m=pop?.morphology||{};return {symmetry:String(m.symmetry||'RADIAL_OR_BILATERAL_UNRESOLVED'),supportMode:String(m.supportMode||'UNRESOLVED'),locomotionMode:String(m.locomotionMode||'UNRESOLVED'),feedingMode:String(m.feedingMode||'UNRESOLVED')}}
function localPopulationRows(s){
 const fromLife=s?.local?.life?.local?.populations;
 if(Array.isArray(fromLife)&&fromLife.length)return fromLife;
 const objects=Array.isArray(s?.local?.objects)?s.local.objects:[];
 return objects.filter(x=>String(x?.kind||'').toUpperCase()==='ORGANISM').map(x=>x.population||x);
}
function currentRegionId(s){return String(s?.local?.life?.local?.regionIdentity||s?.point?.locationIdentity||'local-region')}
function buildState(s){
 const rows=localPopulationRows(s),regionId=currentRegionId(s),byLineage=new Map();
 for(const row of rows){const lineageId=String(row?.lineageId||row?.lineage?.id||idOf(row)||'');if(!lineageId)continue;if(!byLineage.has(lineageId))byLineage.set(lineageId,{id:lineageId,traits:traitRows(row),morphology:morphology(row),rows:[]});byLineage.get(lineageId).rows.push(row);}
 const lineages=[...byLineage.values()].slice(0,128).map(x=>({id:x.id,traits:x.traits,morphology:x.morphology}));
 const allowed=new Set(lineages.map(x=>x.id)),populations=[];
 for(const lineage of byLineage.values()){
  if(!allowed.has(lineage.id))continue;
  const represented=lineage.rows.reduce((sum,row)=>sum+safeInt(row?.individuals,row?.representedAbundance??row?.abundance??0),0);
  if(represented<=0)continue;
  const first=lineage.rows[0],populationId=String(first?.populationId||first?.entityId||first?.id||('population:'+lineage.id+':'+regionId));
  populations.push({id:populationId,lineageId:lineage.id,regionId,abundance:represented,lifecycleStagePpm:{juvenile:0,mature:PPM,senescent:0}});
 }
 const opportunity=firstPpm(s?.local?.life?.local?.opportunityPpm,s?.world?.biology?.ecosystem?.opportunityPpm)??PPM;
 const disturbance=firstPpm(s?.local?.life?.local?.disturbancePpm,s?.world?.biology?.ecosystem?.disturbancePpm)??0;
 const epoch=safeInt(s?.world?.civilization?.epoch,safeInt(s?.world?.historyEpoch,0)),generation=safeInt(s?.world?.biology?.ecosystem?.generation,0);
 return Life.createLifeState({eventKey:'living:'+epoch+':'+generation+':'+regionId,lineages,populations,interactions:[],regions:{[regionId]:{resourcePool:0,nutrientPool:0,opportunityPpm:opportunity,disturbancePpm:disturbance}}});
}
function drawEllipse(g,x,y,rx,ry,angle){g.save();g.translate(x,y);g.rotate(angle);g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();g.restore()}
function renderDescriptor(g,d,w,h,index){
 const x=w*(.5+d.position.x*.36),y=h*(.58+d.position.z*.25-d.position.y*.08),size=clamp(7+18*d.sizeScale,8,30),angle=d.orientationTurns*Math.PI*2,alpha=.62+Math.min(.25,d.motion.amplitude*.25);
 g.fillStyle='rgba(149,190,143,'+alpha+')';g.strokeStyle='rgba(220,239,214,.82)';g.lineWidth=1;
 if(d.primitiveFamily==='CHAINED_ELLIPSOIDS'){
  const count=clamp(d.segmentBudget,3,8);for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*size*.55;drawEllipse(g,x+Math.cos(angle)*offset,y+Math.sin(angle)*offset,size*.48,size*.28,angle);}
 }else if(d.primitiveFamily==='BRANCHED_RADIAL_PATCHES'){
  const branches=clamp(d.segmentBudget,3,8);for(let i=0;i<branches;i++){const a=angle+i*Math.PI*2/branches;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*size*1.25,y+Math.sin(a)*size*.72);g.stroke();drawEllipse(g,x+Math.cos(a)*size,y+Math.sin(a)*size*.58,size*.42,size*.18,a);}
  g.beginPath();g.arc(x,y,size*.32,0,Math.PI*2);g.fill();g.stroke();
 }else{
  const lobes=clamp(d.segmentBudget,3,7);for(let i=0;i<lobes;i++){const a=angle+i*Math.PI*2/lobes;drawEllipse(g,x+Math.cos(a)*size*.55,y+Math.sin(a)*size*.34,size*.45,size*.3,a);}
 }
 return {x,y,r:size*1.55,index};
}
function filteredState(s,hasLife){if(!hasLife||!s?.local||!Array.isArray(s.local.objects))return s;return {...s,local:{...s.local,objects:s.local.objects.filter(x=>String(x?.kind||'').toUpperCase()!=='ORGANISM')}}}
function create(canvas,glCanvas,options={}){
 const renderer=baseFactory.create(canvas,glCanvas,options),g=canvas.getContext('2d',{alpha:true});if(!g)throw new Error('Canvas2D unavailable for V2X-08 Living consumer');
 let hits=[],last=Object.freeze({status:'NO_MODELED_LOCAL_LIFE',provider:Life.VERSION||'ofu-v2x-08-life-shipping-runtime-2',descriptors:0}),previousToken=null;
 async function render(s){
  const rows=localPopulationRows(s),eligible=s?.stage==='HUMAN'&&rows.length>0;
  if(!eligible){hits=[];await renderer.render(s);last=Object.freeze({status:'NOT_ACTIVE_AT_STAGE',stage:s?.stage||null,provider:Life.VERSION||'ofu-v2x-08-life-shipping-runtime-2',descriptors:0});return state();}
  const lifeState=buildState(s),adapter=Life.createLifeShippingAdapter({getState:()=>lifeState}),regionId=currentRegionId(s),packet=adapter.buildViewportPacket({regionId,viewportKey:'living:'+regionId,maxSamples:MAX_SAMPLES,quality:'HIGH'});
  if(packet.presence!=='VISIBLE_MODELED_LIFE'||packet.renderDescriptors.length===0)throw new Error('V2X-08 rich Living consumer refused generic organism fallback');
  const revisitBefore=previousToken?adapter.revisit(previousToken):null;
  await renderer.render(filteredState(s,true));
  const box=canvas.getBoundingClientRect(),w=Math.max(1,box.width||canvas.clientWidth||canvas.width),h=Math.max(1,box.height||canvas.clientHeight||canvas.height);hits=[];
  packet.renderDescriptors.forEach((d,i)=>hits.push({...renderDescriptor(g,d,w,h,i),target:packet.selectionTargets[i]}));
  previousToken=packet.revisitToken;
  const exact=adapter.revisit(packet.revisitToken);if(exact.status!=='REVISITED_EXACT')throw new Error('V2X-08 current packet revisit must be exact');
  last=Object.freeze({status:'VISIBLE_MODELED_LIFE',owner:'V2X-08',provider:Life.VERSION||'ofu-v2x-08-life-shipping-runtime-2',adapter:adapter.descriptor?.id||'ofu.v2x-08.life-shipping-adapter',packetFingerprint:packet.packetFingerprint,descriptors:packet.renderDescriptors.length,selectionTargets:packet.selectionTargets.length,primitiveFamilies:Object.freeze([...new Set(packet.renderDescriptors.map(x=>x.primitiveFamily))].sort()),revisitCurrent:exact.status,revisitPrevious:revisitBefore?.status||null,authority:packet.authority,claimGuards:packet.claimGuards,legacyGenericOrganismCueUsed:false,persistentIndividualIdentityPromoted:false,selectionAuthorityClaimed:false,persistenceAuthorityClaimed:false});
  return state();
 }
 function activateAt(x,y){for(let i=hits.length-1;i>=0;i--){const p=hits[i];if(Math.hypot(Number(x)-p.x,Number(y)-p.y)<=p.r){const id=String(p.target?.populationId||'');if(id){options.onObject?.(id);return true}}}return renderer.activateAt(x,y)}
 function state(){return {...renderer.state(),lifeV2Consumption:last}}
 function dispose(){hits=[];previousToken=null;renderer.dispose()}
 return Object.freeze({...renderer,render,activateAt,state,dispose});
}
O.v1LivingRenderer=Object.freeze({...baseFactory,create,__v2xLifeV2Consumed:true,LIFE_V2_CONSUMER_VERSION:VERSION});
O.v2xLivingLifeV2Consumer=Object.freeze({VERSION,buildState,localPopulationRows});
})(typeof globalThis!=='undefined'?globalThis:this);
