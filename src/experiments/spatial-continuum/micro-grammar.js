import { AUTHORITY } from './constants.js';

const hash=value=>{let output=2166136261;for(const character of String(value)){output^=character.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const FAMILY=Object.freeze({WATER:'AQUEOUS_CONTEXT',ICE:'CRYSTALLINE_CONTEXT',ROCK:'MINERAL_CONTEXT',MINERAL:'MINERAL_CONTEXT',SOIL:'HETEROGENEOUS_CONTEXT',BIOLOGICAL_TISSUE:'BIOLOGICAL_CONTEXT',ORGANISM:'BIOLOGICAL_CONTEXT',MANUFACTURED_MATERIAL:'MANUFACTURED_CONTEXT',ARTIFACT:'MANUFACTURED_CONTEXT',ATMOSPHERE:'ATMOSPHERIC_CONTEXT'});
const PALETTES=Object.freeze({AQUEOUS_CONTEXT:['#66b9d4','#b8e4eb','#477d9f'],CRYSTALLINE_CONTEXT:['#9bdbe7','#d8f5f4','#7297be'],MINERAL_CONTEXT:['#d29b68','#7ca8b7','#8d77aa'],HETEROGENEOUS_CONTEXT:['#b58b62','#799866','#7a6c91'],BIOLOGICAL_CONTEXT:['#80b879','#d2a86b','#8b75b2'],MANUFACTURED_CONTEXT:['#aab8c2','#d59a65','#668fa7'],ATMOSPHERIC_CONTEXT:['#91b8d2','#d4e2e8','#69839c'],UNKNOWN_CONTEXT:['#8aa4b5','#c4a879','#817b9c']});
const topologyFor=(structure,phase)=>structure.includes('CRYSTALLINE')&&!structure.includes('POLY')?'LATTICE_ORIENTED_PRESENTATION':structure.includes('POLYCRYSTALLINE')?'GRAIN_BOUNDARY_PRESENTATION':structure.includes('AMORPHOUS')?'DISORDERED_DOMAIN_PRESENTATION':structure.includes('POROUS')?'POROUS_AGGREGATE_PRESENTATION':structure.includes('BIOLOGICAL')?'FIBROUS_DOMAIN_PRESENTATION':structure.includes('COMPOSITE')?'MULTIPHASE_DOMAIN_PRESENTATION':phase==='LIQUID'?'FLUID_NEIGHBORHOOD_PRESENTATION':phase==='GAS'?'DISPERSED_FIELD_PRESENTATION':'UNRESOLVED_CONTEXT_PRESENTATION';
const frozenPoint=point=>Object.freeze(point.map(value=>Number(value.toFixed(6))));

function contextualComponents(source){
  return Object.freeze((Array.isArray(source?.components)?source.components:[]).slice(0,16).map(component=>Object.freeze({id:String(component.id||'UNKNOWN'),ppm:Number(component.ppm)||0,formula:component.formula==null?null:String(component.formula),elements:component.elements&&typeof component.elements==='object'?Object.freeze({...component.elements}):null,authority:String(component.authority||source.chemistryAuthority||'UNRESOLVED_CHEMISTRY')})));
}

export function createContextualMaterialGrammar({sampleId,sampleKind,source={},presentationSeed=null}={}){
  const id=String(sampleId||source.sourceEntityId||'unknown-sample'),kind=String(sampleKind||source.kind||'UNKNOWN').toUpperCase(),phase=String(source.phase||(kind==='WATER'?'LIQUID':'SOLID')).toUpperCase(),structure=String(source.structure||(kind==='ICE'?'CRYSTALLINE_PROXY':kind==='ROCK'?'POLYCRYSTALLINE_PROXY':kind==='SOIL'?'POROUS_AGGREGATE':phase==='LIQUID'?'FLUID':'UNRESOLVED')).toUpperCase(),family=FAMILY[kind]||'UNKNOWN_CONTEXT',topology=topologyFor(structure,phase),components=contextualComponents(source),porosityPpm=Math.max(0,Math.min(1000000,Number(source.porosityPpm)||0)),seed=String(presentationSeed?`${presentationSeed}:${id}:${kind}`:`${id}:${kind}:contextual-material`),rnd=randomFactory(seed+':material'),domainCount=Math.max(1,Math.min(8,components.filter(component=>component.ppm>0).length||1)),instanceCount=topology==='LATTICE_ORIENTED_PRESENTATION'?27:topology==='POROUS_AGGREGATE_PRESENTATION'?36:topology==='DISPERSED_FIELD_PRESENTATION'?42:topology==='FLUID_NEIGHBORHOOD_PRESENTATION'?32:24+Math.floor(rnd()*13);
  return Object.freeze({contract:'ofu-r6-contextual-material-grammar-1',sourceSampleId:id,sourceKind:kind,family,phase,structure,topology,palette:Object.freeze(PALETTES[family]||PALETTES.UNKNOWN_CONTEXT),components,componentCount:components.length,domainCount,instanceCount,porosityPpm,chemistryAuthority:String(source.chemistryAuthority||'UNRESOLVED_CHEMISTRY'),presentationSeed:seed,authority:AUTHORITY.PRESENTATION_ONLY,inputAuthority:String(source.authority||AUTHORITY.MODEL_DERIVED),claims:Object.freeze({exactSpecimenGeometry:false,exactGrainGeometry:false,exactPoreGeometry:false,exactPhaseArrangement:false}),deterministic:true});
}

function molecularPoints(grammar,rnd){
  const topology=grammar.topology,points=[];
  if(topology==='LATTICE_ORIENTED_PRESENTATION'){const yaw=(rnd()-.5)*1.1,pitch=(rnd()-.5)*.42,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){const px=x*1.35,py=(x+z)%2*.34,pz=z*1.35,tiltedY=py*cp-pz*sp,tiltedZ=py*sp+pz*cp;points.push(frozenPoint([px*cy-tiltedZ*sy,tiltedY,px*sy+tiltedZ*cy]))}}
  else {const count=topology==='DISPERSED_FIELD_PRESENTATION'?11:topology==='FLUID_NEIGHBORHOOD_PRESENTATION'?10:8+Math.floor(rnd()*5);for(let index=0;index<count;index++){const progression=count===1?0:index/(count-1),angle=progression*Math.PI*(topology==='FIBROUS_DOMAIN_PRESENTATION'?2.2:3.4)+(rnd()-.5)*.8,radius=topology==='FLUID_NEIGHBORHOOD_PRESENTATION'?1.2+rnd()*2.4:topology==='POROUS_AGGREGATE_PRESENTATION'?2.2+rnd()*1.4:1.1+progression*2.5,y=topology==='DISPERSED_FIELD_PRESENTATION'?(rnd()-.5)*5:topology==='FIBROUS_DOMAIN_PRESENTATION'?Math.sin(angle*1.7)*.75:(rnd()-.5)*2.5;points.push(frozenPoint([Math.cos(angle)*radius,y,Math.sin(angle)*radius*.72]))}}
  return Object.freeze(points);
}

function molecularLinks(points,topology){
  const links=[];if(topology==='DISPERSED_FIELD_PRESENTATION')return Object.freeze(links);if(topology==='LATTICE_ORIENTED_PRESENTATION'){for(let index=0;index<points.length;index++){if(index%3<2)links.push(Object.freeze([index,index+1]));if(index<6)links.push(Object.freeze([index,index+3]))}return Object.freeze(links)}for(let index=1;index<points.length;index++)if(topology!=='FLUID_NEIGHBORHOOD_PRESENTATION'||index%3!==0)links.push(Object.freeze([index-1,index]));if(points.length>8&&topology!=='FLUID_NEIGHBORHOOD_PRESENTATION')links.push(Object.freeze([0,Math.floor(points.length/2)]));return Object.freeze(links);
}

function microstructurePoints(grammar,rnd){
  const points=[],count=grammar.instanceCount,topology=grammar.topology;
  for(let index=0;index<count;index++){
    if(topology==='LATTICE_ORIENTED_PRESENTATION'){const side=3,x=index%side-1,z=Math.floor(index/side)%side-1,y=Math.floor(index/(side*side))-1;points.push(frozenPoint([x*1.55,y*1.55,z*1.55]));continue}
    if(topology==='MULTIPHASE_DOMAIN_PRESENTATION'||topology==='GRAIN_BOUNDARY_PRESENTATION'){const domain=index%grammar.domainCount,angle=domain/grammar.domainCount*Math.PI*2,center=[Math.cos(angle)*2.15,(domain%2-.5)*1.2,Math.sin(angle)*1.35];points.push(frozenPoint([center[0]+(rnd()-.5)*1.5,center[1]+(rnd()-.5)*1.5,center[2]+(rnd()-.5)*1.5]));continue}
    if(topology==='POROUS_AGGREGATE_PRESENTATION'){const angle=rnd()*Math.PI*2,radius=1.8+rnd()*2.2;points.push(frozenPoint([Math.cos(angle)*radius,(rnd()-.5)*3.5,Math.sin(angle)*radius*.75]));continue}
    if(topology==='FLUID_NEIGHBORHOOD_PRESENTATION'||topology==='DISPERSED_FIELD_PRESENTATION'){const radius=1+rnd()*3.8,angle=rnd()*Math.PI*2;points.push(frozenPoint([Math.cos(angle)*radius,(rnd()-.5)*4,Math.sin(angle)*radius]));continue}
    points.push(frozenPoint([(rnd()-.5)*6,(rnd()-.5)*4,(rnd()-.5)*4]));
  }
  return Object.freeze(points);
}

const ATOMIC_FIELD_BY_TOPOLOGY=Object.freeze({
  LATTICE_ORIENTED_PRESENTATION:Object.freeze({distribution:'ANISOTROPIC_CONTEXT_FIELD',axisScale:Object.freeze([1.16,.72,1.16])}),
  GRAIN_BOUNDARY_PRESENTATION:Object.freeze({distribution:'ORIENTED_BOUNDARY_CONTEXT_FIELD',axisScale:Object.freeze([1.28,.82,.72])}),
  DISORDERED_DOMAIN_PRESENTATION:Object.freeze({distribution:'DISORDERED_CONTEXT_FIELD',axisScale:Object.freeze([1,.9,1.08])}),
  POROUS_AGGREGATE_PRESENTATION:Object.freeze({distribution:'VOID_BIASED_CONTEXT_FIELD',axisScale:Object.freeze([1.2,.84,1.2])}),
  FIBROUS_DOMAIN_PRESENTATION:Object.freeze({distribution:'ELONGATED_CONTEXT_FIELD',axisScale:Object.freeze([.62,1.48,.62])}),
  MULTIPHASE_DOMAIN_PRESENTATION:Object.freeze({distribution:'MULTIPHASE_CONTEXT_FIELD',axisScale:Object.freeze([1.25,.92,.78])}),
  FLUID_NEIGHBORHOOD_PRESENTATION:Object.freeze({distribution:'ISOTROPIC_CONTEXT_FIELD',axisScale:Object.freeze([1,1,1])}),
  DISPERSED_FIELD_PRESENTATION:Object.freeze({distribution:'SPARSE_CONTEXT_FIELD',axisScale:Object.freeze([1.35,1.22,1.35])}),
  UNRESOLVED_CONTEXT_PRESENTATION:Object.freeze({distribution:'UNRESOLVED_CONTEXT_FIELD',axisScale:Object.freeze([1,1,1])})
});

function atomicField(grammar,rnd){
  const specification=ATOMIC_FIELD_BY_TOPOLOGY[grammar.topology]||ATOMIC_FIELD_BY_TOPOLOGY.UNRESOLVED_CONTEXT_PRESENTATION,points=[];
  for(let index=0;index<96;index++){
    const theta=rnd()*Math.PI*2,phi=Math.acos(2*rnd()-1),baseRadius=Math.max(1.7,Math.min(4.1,Math.abs((rnd()+rnd()+rnd())-1.5)*3.4+1.2)),voidBias=grammar.topology==='POROUS_AGGREGATE_PRESENTATION'?.72+Math.abs(Math.sin(theta*2.5))*.5:1,sparseBias=grammar.topology==='DISPERSED_FIELD_PRESENTATION'?.82+rnd()*.55:1,radius=baseRadius*voidBias*sparseBias;
    points.push(frozenPoint([radius*Math.sin(phi)*Math.cos(theta)*specification.axisScale[0],radius*Math.cos(phi)*specification.axisScale[1],radius*Math.sin(phi)*Math.sin(theta)*specification.axisScale[2]]));
  }
  return Object.freeze({...specification,points:Object.freeze(points),pointCount:points.length,authority:AUTHORITY.PRESENTATION_ONLY,semantics:'SOURCE_TOPOLOGY_CONTEXT_NOT_PARTICLE_POSITIONS'});
}

export function createContextualMicroGrammar(options={}){
  const material=createContextualMaterialGrammar(options),rnd=randomFactory(material.presentationSeed+':micro'),positions=molecularPoints(material,rnd),links=molecularLinks(positions,material.topology),microstructure=microstructurePoints(material,rnd),knownElements=Object.freeze([...new Set(material.components.flatMap(component=>component.elements?Object.keys(component.elements):[]))].sort()),field=atomicField(material,randomFactory(material.presentationSeed+':atomic-field'));
  return Object.freeze({contract:'ofu-r6-contextual-micro-grammar-1',sourceSampleId:material.sourceSampleId,sourceKind:material.sourceKind,family:material.family,phase:material.phase,structure:material.structure,topology:material.topology,palette:material.palette,material,positions,links,linkSemantics:'PRESENTATION_PROXIMITY_NOT_BOND',siteCount:positions.length,microstructurePositions:microstructure,knownElements,elementContextAuthority:knownElements.length?material.chemistryAuthority:'UNKNOWN',atomicContextPoints:8+hash(material.presentationSeed+':atomic')%9,atomicField:field,corePointSemantics:'PRESENTATION_CONTEXT_NOT_NUCLEONS',presentationSeed:material.presentationSeed,authority:AUTHORITY.PRESENTATION_ONLY,claims:Object.freeze({exactMolecularSpecies:false,exactMolecularArrangement:false,exactMolecularBonds:false,exactNuclearComposition:false,exactElectronState:false,particlePositions:false,knownElementsAreArrangementClaim:false}),deterministic:true});
}
