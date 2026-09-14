import { AUTHORITY } from './constants.js';

const hash=value=>{let output=2166136261;for(const character of String(value)){output^=character.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const FAMILY=Object.freeze({WATER:'AQUEOUS_CONTEXT',ICE:'CRYSTALLINE_CONTEXT',ROCK:'MINERAL_CONTEXT',SOIL:'HETEROGENEOUS_CONTEXT',ORGANISM:'BIOLOGICAL_CONTEXT',ARTIFACT:'MANUFACTURED_CONTEXT'});
const PALETTES=Object.freeze({AQUEOUS_CONTEXT:['#66b9d4','#b8e4eb','#477d9f'],CRYSTALLINE_CONTEXT:['#9bdbe7','#d8f5f4','#7297be'],MINERAL_CONTEXT:['#d29b68','#7ca8b7','#8d77aa'],HETEROGENEOUS_CONTEXT:['#b58b62','#799866','#7a6c91'],BIOLOGICAL_CONTEXT:['#80b879','#d2a86b','#8b75b2'],MANUFACTURED_CONTEXT:['#aab8c2','#d59a65','#668fa7'],UNKNOWN_CONTEXT:['#8aa4b5','#c4a879','#817b9c']});

export function createContextualMicroGrammar({sampleId,sampleKind,source={},presentationSeed=null}={}){
  const id=String(sampleId||'unknown-sample'),kind=String(sampleKind||source.kind||'UNKNOWN').toUpperCase(),family=FAMILY[kind]||'UNKNOWN_CONTEXT',rnd=randomFactory(presentationSeed||`${id}:${kind}:contextual-micro`),siteCount=7+Math.floor(rnd()*6),positions=[];
  for(let index=0;index<siteCount;index++){
    const progression=siteCount===1?0:index/(siteCount-1),angle=progression*Math.PI*3.4+(rnd()-.5)*.65,radius=family==='CRYSTALLINE_CONTEXT'?2.3+(index%2)*.45:family==='AQUEOUS_CONTEXT'?1.5+rnd()*2.3:1.1+progression*2.5;
    positions.push(Object.freeze([Math.cos(angle)*radius,(rnd()-.5)*(family==='CRYSTALLINE_CONTEXT'?.7:2.8),Math.sin(angle)*radius*.72]));
  }
  const links=[];for(let index=1;index<siteCount;index++)links.push(Object.freeze([index-1,index]));if(siteCount>8){links.push(Object.freeze([0,Math.floor(siteCount/2)]),Object.freeze([Math.floor(siteCount/3),siteCount-1]))}
  return Object.freeze({contract:'ofu-contextual-micro-grammar-2',sourceSampleId:id,sourceKind:kind,family,palette:Object.freeze(PALETTES[family]),positions:Object.freeze(positions),links:Object.freeze(links),siteCount,atomicContextPoints:8+hash((presentationSeed||id)+':atomic')%9,presentationSeed:presentationSeed||null,authority:AUTHORITY.PRESENTATION_ONLY,claims:Object.freeze({exactMolecularSpecies:false,exactMolecularArrangement:false,exactNuclearComposition:false,exactElectronState:false}),deterministic:true});
}
