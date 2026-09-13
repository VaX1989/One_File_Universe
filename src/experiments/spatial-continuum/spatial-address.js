import { AUTHORITY } from './constants.js';

const AUTHORITIES=new Set(Object.values(AUTHORITY));
const text=(value,label)=>{const output=String(value??'').trim();if(!output)throw new TypeError(label+' is required');return output};
const stableValue=value=>typeof value==='bigint'?value.toString():Array.isArray(value)?value.map(stableValue):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stableValue(value[key])])):value;

export function addressSegment(spec={}){
  const id=text(spec.id,'address segment id'),kind=text(spec.kind,'address segment kind').toUpperCase(),authority=text(spec.authority||AUTHORITY.UNKNOWN,'address segment authority').toUpperCase();
  if(!AUTHORITIES.has(authority))throw new RangeError('Unknown address authority: '+authority);
  return Object.freeze({id,kind,parentId:spec.parentId==null?null:text(spec.parentId,'address parent id'),authority,key:Object.freeze(stableValue(spec.key||{})),capabilities:Object.freeze([...(spec.capabilities||[])].map(value=>String(value).toUpperCase()).sort())});
}

export function createSpatialAddress(segments=[]){
  const path=segments.map(addressSegment);
  for(let index=1;index<path.length;index++)if(path[index].parentId!==path[index-1].id)throw new Error(`Address parent mismatch at ${path[index].id}`);
  const serialized=path.map(segment=>`${encodeURIComponent(segment.kind.toLowerCase())}:${encodeURIComponent(segment.id)}`).join('/');
  return Object.freeze({
    contract:'ofu-spatial-address-1',
    segments:Object.freeze(path),
    depth:path.length,
    leaf:path.at(-1)||null,
    serialized,
    ids:Object.freeze(path.map(segment=>segment.id)),
    append(spec){const segment=addressSegment({...spec,parentId:spec.parentId??path.at(-1)?.id??null});return createSpatialAddress([...path,segment])},
    parent(){return path.length?createSpatialAddress(path.slice(0,-1)):this},
    includes(id){return path.some(segment=>segment.id===String(id))}
  });
}

export function addressFromNode(node,parentAddress=createSpatialAddress()){
  if(!node)throw new TypeError('Address node is required');
  return parentAddress.append({id:node.entityId||node.id,kind:node.kind,authority:String(node.sourceAuthority||node.authority||AUTHORITY.UNKNOWN).includes('CANONICAL')?AUTHORITY.CANONICAL:String(node.sourceAuthority||node.authority||'').includes('MODEL')?AUTHORITY.MODEL_DERIVED:AUTHORITY.UNKNOWN,key:node.canonicalKey||node.metadata?.point||{},capabilities:[node.selectable&&'SELECT',node.navigable&&'TRAVEL'].filter(Boolean)});
}
