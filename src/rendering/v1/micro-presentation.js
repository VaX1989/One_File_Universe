(function(root){
'use strict';const O=root.OFU,C=O.v1PresentationCore;
if(!C)throw new Error('v1 presentation core required');
const {SCALES,object,scene,id,src}=C;
function micro({world,microscopic=world?.microscopic,representation,regime='MICROSTRUCTURE'}={}){
 const m=representation||microscopic,k=String(regime).toUpperCase();
 if(!m)return scene(k,'unresolved',[],[],[],{supported:false,reason:'NO_SOURCE_REPRESENTATION'});
 let s=m;
 if(!m.contract?.startsWith('ofu-v1-material')&&!m.regime){
  s=k==='ATOMIC'?(m.atomicPreview||m.atomic):k==='MOLECULAR'?m.molecular:k==='MATERIAL'?m:(m.tissue||m.cell||m);
 }
 if(!s)return scene(k,'unresolved',[],[],[],{supported:false,reason:'REGIME_NOT_MATERIALIZED'});
 const sid=id(s,s.materialId||s.sourceEntityId||m.organismIdentity||'micro'),objects=[];
 if(k==='ATOMIC'){
  const rows=(s.atoms||[]).slice(0,C.CAPS.microNodes);
  const points=rows.map(a=>a.position||[0,0,0]);
  const lo=[0,1,2].map(axis=>Math.min(0,...points.map(p=>Number(p[axis])||0))),hi=[0,1,2].map(axis=>Math.max(1,...points.map(p=>Number(p[axis])||0)));
  const span=Math.max(2,hi[0]-lo[0],hi[1]-lo[1]);
  for(let i=0;i<rows.length;i++){const a=rows[i],p=points[i];objects.push(object('ATOM',a.atomId||sid+':'+i,a,{x:.5+(p[0]-(lo[0]+hi[0])/2)*.75/span,y:.5+(p[1]-(lo[1]+hi[1])/2)*.75/span,z:p[2],element:a.element||'?',radiusPx:10,coordinateAuthority:a.coordinateAuthority,visualGrammar:'BOUNDED_STRUCTURAL_ATOM'},{claims:{literalAtomicPhotography:false,classicalTrajectory:false,electronOrbit:false}}));}
 }else if(k==='MOLECULAR'){
  const rows=(s.units||s.complexes||[]).slice(0,128);
  for(let i=0;i<rows.length;i++){const x=rows[i];objects.push(object('MOLECULAR_COMPLEX',x.unitId||id(x,sid+':'+i),x,{x:.18+(i%4)*.21,y:.25+Math.floor(i/4)*.19,formula:x.formula||null,label:x.formula||x.shapeClass||'Unresolved unit',sizePx:22,visualGrammar:'REPRESENTATIVE_CHEMISTRY'},{claims:{exactMolecularComposition:false,exactSpatialArrangement:false}}));}
 }else if(k==='MATERIAL'){
  let total=0;for(const [i,x] of (s.components||[]).entries()){objects.push(object('MATERIAL_COMPONENT',sid+':'+x.id,x,{x:.14+total/1e6*.72,y:.4,width:x.ppm/1e6*.72,height:.18,ppm:x.ppm,label:x.id,formula:x.formula,visualGrammar:'MODEL_COMPOSITION_FRACTION'},{claims:{measuredComposition:s.exactBulkCompositionClaim===true}}));total+=x.ppm;}
 }else{
  const rows=(s.features||s.grains||s.pores||s.fibers||s.cells||s.elements||[]).slice(0,256);
  for(let i=0;i<rows.length;i++){const x=rows[i],sid2=x.featureId||id(x,sid+':'+i),p=x.positionPpm||[C.rand(sid2,1)*1e6,C.rand(sid2,2)*1e6,0];
   objects.push(object(x.kind||(s.grains?'MATERIAL_GRAIN':'MICROSTRUCTURE_ELEMENT'),sid2,x,{x:.08+.84*p[0]/1e6,y:.08+.84*p[1]/1e6,sizePx:6+Number(x.extentPpm||60000)/7000,label:x.kind||'Domain',visualGrammar:'REPRESENTATIVE_VOLUME'},{claims:{earthCellMorphologyAssumed:false,exactGrainGeometry:false}}));}
 }
 return scene(k,sid,objects,[],[{kind:'MICRO_AUTHORITY_BOUNDARY',authority:C.AUTHORITY,sourceRepresentationAuthority:s.visualAuthority||src(s),classicalLimitAcknowledged:k==='ATOMIC'}],{supported:true,representationId:sid,sourceEntityId:s.sourceEntityId||null,sourceAuthority:src(s),chemistryAuthority:s.chemistryAuthority||null,status:s.status||'READY',quantumSimulation:false,unresolved:objects.length===0,limitations:s.limitations||[],quantumBoundary:s.quantumBoundary||null});
}
O.v1MicroPresentation=Object.freeze({micro});
})(globalThis);
