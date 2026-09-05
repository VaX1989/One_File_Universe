(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const PLANET_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const SYSTEM_FIELDS=Object.freeze(PLANET_FIELDS.slice(0,-1));
const MAX_RECENT=12,MAX_TRAIL=40,MAX_BOOKMARKS=24,MAX_SYSTEMS=24;
const titleCase=value=>String(value||'').toLowerCase().replace(/(^|_)([a-z])/g,(_,space,c)=>(space?' ':'')+c.toUpperCase());
const toBigInt=(value,label)=>{try{return BigInt(value)}catch{throw new TypeError((label||'value')+' must be an integer')}};
function serializeFields(key,fields){if(!key)throw new TypeError('key required');return fields.map(name=>name+'='+toBigInt(key[name],name).toString()).join(';')}
function serializePlanetKey(key){return serializeFields(key,PLANET_FIELDS)}
function serializeSystemKey(key){return serializeFields(key,SYSTEM_FIELDS)}
function parseFields(token,fields){
 if(typeof token!=='string'||!token)throw new TypeError('serialized key required');
 const parts=token.split(';');if(parts.length!==fields.length)throw new TypeError('serialized key field count mismatch');
 const out={};
 for(let i=0;i<fields.length;i++){const expected=fields[i],prefix=expected+'=';if(!parts[i].startsWith(prefix))throw new TypeError('serialized key field order mismatch');out[expected]=toBigInt(parts[i].slice(prefix.length),expected)}
 return Object.freeze(out);
}
function parsePlanetKey(token){return parseFields(token,PLANET_FIELDS)}
function parseSystemKey(token){return parseFields(token,SYSTEM_FIELDS)}
function samePlanetKey(a,b){return !!a&&!!b&&PLANET_FIELDS.every(name=>toBigInt(a[name])===toBigInt(b[name]))}
function systemTokenFromPlanetToken(token){return serializeSystemKey(parsePlanetKey(token))}
function formatScaled(value,digits=3){
 const n=toBigInt(value),negative=n<0n,abs=negative?-n:n,scale=10n**BigInt(digits),whole=abs/scale,frac=(abs%scale).toString().padStart(digits,'0').replace(/0+$/,'');
 return (negative?'-':'')+whole.toString()+(frac?'.'+frac:'');
}
function formatMass(milliEarth){return formatScaled(milliEarth,3)+' Earth masses'}
function formatAu(microAu){return formatScaled(microAu,6)+' AU'}
function formatRatioPpm(ppm){return formatScaled(ppm,6)+' x Earth'}
function moonLabel(value){const n=toBigInt(value);return n===0n?'No moons':n===1n?'1 moon':n.toString()+' moons'}
function orbitBand(index,total){
 const i=Math.max(0,Number(index)||0),n=Math.max(1,Number(total)||1);
 if(n===1)return'only world in orbit order';
 if(i===0)return'first in orbit order';
 if(i>=n-1)return'last in orbit order';
 const ratio=(i+1)/n;return ratio<=0.34?'early in orbit order':ratio>=0.67?'late in orbit order':'middle of orbit order';
}
function planetSnapshot(planet,key,index,total){
 if(!planet||planet.status!=='PRESENT')return null;
 const facts=planet.facts||{},orbitIndex=Number(index??key?.orbitSlot??0n),orbitTotal=Math.max(1,Number(total)||1),bulk=facts.bulkPriorClass?titleCase(facts.bulkPriorClass):'Bulk class unavailable';
 const mass=facts.baselineMassMilliEarth===undefined?null:toBigInt(facts.baselineMassMilliEarth),semiMajor=facts.baselineSemiMajorAxisMicroAu===undefined?null:toBigInt(facts.baselineSemiMajorAxisMicroAu),insolation=facts.baselineInsolationPpm===undefined?null:toBigInt(facts.baselineInsolationPpm),moons=facts.moonCount===undefined?null:toBigInt(facts.moonCount);
 const parts=[bulk];if(mass!==null)parts.push(formatMass(mass));parts.push(orbitBand(orbitIndex,orbitTotal));if(moons!==null)parts.push(moonLabel(moons));
 return Object.freeze({
  token:serializePlanetKey(key),systemToken:serializeSystemKey(key),orbitIndex,orbitTotal,title:'World '+String(orbitIndex+1),bulkClass:bulk,
  baselineMassMilliEarth:mass===null?null:mass.toString(),baselineSemiMajorAxisMicroAu:semiMajor===null?null:semiMajor.toString(),baselineInsolationPpm:insolation===null?null:insolation.toString(),moonCount:moons===null?null:moons.toString(),
  orbitBand:orbitBand(orbitIndex,orbitTotal),summary:parts.join(' · ')
 });
}
function relationBigInt(a,b){const x=toBigInt(a),y=toBigInt(b);return x===y?0:(x>y?1:-1)}
function ratioText(a,b){
 const x=toBigInt(a),y=toBigInt(b);if(x<=0n||y<=0n)return null;
 const scaled=(x*100n+y/2n)/y,whole=scaled/100n,frac=(scaled%100n).toString().padStart(2,'0').replace(/0+$/,'');return whole.toString()+(frac?'.'+frac:'')+'x';
}
function differenceSummary(current,other){
 if(!current||!other)return'No earlier world is available for comparison yet.';
 const notes=[];
 if(current.systemToken!==other.systemToken)notes.push('It belongs to a different visited system.');
 if(current.bulkClass!==other.bulkClass)notes.push('Its bulk class differs: '+current.bulkClass+' versus '+other.bulkClass+'.');
 if(current.baselineMassMilliEarth!==null&&other.baselineMassMilliEarth!==null){const rel=relationBigInt(current.baselineMassMilliEarth,other.baselineMassMilliEarth),ratio=ratioText(current.baselineMassMilliEarth,other.baselineMassMilliEarth);if(rel!==0&&ratio)notes.push('Its baseline mass is '+(rel>0?'higher':'lower')+' ('+ratio+' the comparison world).')}
 if(current.baselineInsolationPpm!==null&&other.baselineInsolationPpm!==null){const rel=relationBigInt(current.baselineInsolationPpm,other.baselineInsolationPpm);if(rel!==0)notes.push('Its baseline stellar forcing is '+(rel>0?'higher':'lower')+'.')}
 if(current.moonCount!==null&&other.moonCount!==null){const rel=relationBigInt(current.moonCount,other.moonCount);if(rel!==0)notes.push('It has '+(rel>0?'more':'fewer')+' canonical moons.')}
 if(current.systemToken===other.systemToken&&current.orbitIndex!==other.orbitIndex)notes.push('It appears '+(current.orbitIndex>other.orbitIndex?'later':'earlier')+' in this system\'s canonical orbit order.');
 return notes.length?notes.slice(0,3).join(' '):'These worlds match on the comparable baseline facts currently shown.';
}
function comparisonRows(left,right){
 if(!left||!right)return[];
 const row=(label,a,b)=>Object.freeze({label,left:a,right:b});
 const value=(snapshot,field,format)=>snapshot[field]===null?'Not established':format(snapshot[field]);
 return Object.freeze([
  row('System',left.systemToken,right.systemToken),
  row('Orbit order','World '+String(left.orbitIndex+1)+' of '+String(left.orbitTotal),'World '+String(right.orbitIndex+1)+' of '+String(right.orbitTotal)),
  row('Bulk class',left.bulkClass,right.bulkClass),
  row('Baseline mass',value(left,'baselineMassMilliEarth',formatMass),value(right,'baselineMassMilliEarth',formatMass)),
  row('Baseline orbit size',value(left,'baselineSemiMajorAxisMicroAu',formatAu),value(right,'baselineSemiMajorAxisMicroAu',formatAu)),
  row('Baseline stellar forcing',value(left,'baselineInsolationPpm',formatRatioPpm),value(right,'baselineInsolationPpm',formatRatioPpm)),
  row('Canonical moons',left.moonCount===null?'Not established':moonLabel(left.moonCount),right.moonCount===null?'Not established':moonLabel(right.moonCount))
 ]);
}
const uniqueTokens=(items,max)=>{const out=[];for(const token of items||[]){if(typeof token!=='string'||!token||out.includes(token))continue;try{parsePlanetKey(token)}catch{continue}out.push(token);if(out.length>=max)break}return out};
const uniqueSystems=(items,max)=>{const out=[];for(const token of items||[]){if(typeof token!=='string'||!token||out.includes(token))continue;try{parseSystemKey(token)}catch{continue}out.push(token);if(out.length>=max)break}return out};
function normalizeSession(raw={}){
 const current=typeof raw.current==='string'?safePlanetToken(raw.current):null,previous=typeof raw.previous==='string'?safePlanetToken(raw.previous):null,pinned=typeof raw.pinned==='string'?safePlanetToken(raw.pinned):null;
 const progress=raw.progress&&typeof raw.progress==='object'?raw.progress:{};
 return Object.freeze({version:1,current,previous,pinned,recent:Object.freeze(uniqueTokens(raw.recent,MAX_RECENT)),trail:Object.freeze(uniqueTokens(raw.trail,MAX_TRAIL)),bookmarks:Object.freeze(uniqueTokens(raw.bookmarks,MAX_BOOKMARKS)),systems:Object.freeze(uniqueSystems(raw.systems,MAX_SYSTEMS)),onboardingDismissed:raw.onboardingDismissed===true,progress:Object.freeze({selected:progress.selected===true,approached:progress.approached===true,inspected:progress.inspected===true})});
}
function safePlanetToken(token){try{return serializePlanetKey(parsePlanetKey(token))}catch{return null}}
function recordVisit(sessionInput,token){
 const session=normalizeSession(sessionInput),normalized=safePlanetToken(token);if(!normalized)return session;
 const systemToken=systemTokenFromPlanetToken(normalized),changed=session.current&&session.current!==normalized,trail=session.trail.filter(item=>item!==normalized);trail.push(normalized);
 return normalizeSession({...session,current:normalized,previous:changed?session.current:session.previous,recent:[normalized,...session.recent.filter(item=>item!==normalized)],trail:trail.slice(-MAX_TRAIL),systems:session.systems.includes(systemToken)?session.systems:[...session.systems,systemToken]});
}
function toggleBookmark(sessionInput,token){const session=normalizeSession(sessionInput),normalized=safePlanetToken(token);if(!normalized)return session;const has=session.bookmarks.includes(normalized),bookmarks=has?session.bookmarks.filter(item=>item!==normalized):[normalized,...session.bookmarks];return normalizeSession({...session,bookmarks})}
function togglePin(sessionInput,token){const session=normalizeSession(sessionInput),normalized=safePlanetToken(token);if(!normalized)return session;return normalizeSession({...session,pinned:session.pinned===normalized?null:normalized})}
function markProgress(sessionInput,name){const session=normalizeSession(sessionInput);if(!['selected','approached','inspected'].includes(name))return session;return normalizeSession({...session,progress:{...session.progress,[name]:true}})}
function dismissOnboarding(sessionInput){const session=normalizeSession(sessionInput);return normalizeSession({...session,onboardingDismissed:true})}
function systemLabel(sessionInput,systemToken){const session=normalizeSession(sessionInput),index=session.systems.indexOf(systemToken);return index>=0?'System '+String(index+1):'Current system'}
function differenceScore(a,b){
 if(!a||!b||a.token===b.token)return-1;let score=0;if(a.systemToken!==b.systemToken)score+=4;if(a.bulkClass!==b.bulkClass)score+=4;if(a.moonCount!==null&&b.moonCount!==null&&a.moonCount!==b.moonCount)score+=2;if(a.baselineMassMilliEarth!==null&&b.baselineMassMilliEarth!==null&&a.baselineMassMilliEarth!==b.baselineMassMilliEarth)score+=2;if(a.baselineInsolationPpm!==null&&b.baselineInsolationPpm!==null&&a.baselineInsolationPpm!==b.baselineInsolationPpm)score+=2;score+=Math.min(3,Math.abs(a.orbitIndex-b.orbitIndex));return score;
}
const api=Object.freeze({seamVersion:1,PLANET_FIELDS,SYSTEM_FIELDS,serializePlanetKey,serializeSystemKey,parsePlanetKey,parseSystemKey,samePlanetKey,systemTokenFromPlanetToken,formatMass,formatAu,formatRatioPpm,moonLabel,orbitBand,planetSnapshot,differenceSummary,comparisonRows,normalizeSession,recordVisit,toggleBookmark,togglePin,markProgress,dismissOnboarding,systemLabel,differenceScore});
O.v09ExplorerCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
