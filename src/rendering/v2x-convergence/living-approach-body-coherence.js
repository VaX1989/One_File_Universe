(function(root){
'use strict';
const O=root.OFU,Base=O?.v1LivingRenderer;
if(!O||!Base||typeof Base.create!=='function')throw new Error('Living approach-body bridge dependencies required');
if(Base.__v2xApproachBodyCoherent)return;
const VERSION='ofu-v2x-living-approach-body-coherence-1';
const idOf=x=>String(x?.canonicalId||x?.entityId||x?.id||'');
function normalize(s){
 if(!s||!['ORBIT','APPROACH'].includes(String(s.stage||'').toUpperCase())||!s.body)return s;
 const bodyId=idOf(s.body);if(!bodyId)return s;
 const kind=String(s.body.kind||'').toLowerCase();if(kind!=='planet')return s;
 const rows=Array.isArray(s.rows)?s.rows:[];
 if(rows.some(x=>idOf(x)===bodyId))return s;
 return Object.freeze({...s,rows:Object.freeze([...rows,s.body])});
}
const Wrapped=Object.freeze({...Base,VERSION:Base.VERSION+'+approach-body-coherence',__v2xApproachBodyCoherent:true,create(canvas,glCanvas,options={}){const base=Base.create(canvas,glCanvas,options);async function render(s){return base.render(normalize(s))}return Object.freeze({...base,render})}});
O.v1LivingRenderer=Wrapped;O.v2xLivingApproachBodyCoherence=Object.freeze({VERSION,normalize});
})(globalThis);
