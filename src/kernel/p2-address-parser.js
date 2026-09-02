(function(root){
'use strict';
const P=(root.OFU||{}).p2;if(!P)throw new Error('P2 canonical kernel required');
const MAX=P.MAX,D=new TextDecoder('utf-8',{fatal:true});
function fail(m){throw new Error('OFU address: '+m)}
function parseAddress(bytes){
  if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
  if(bytes.length>MAX.addressBytes)fail('address too large');
  let i=0;
  function rd(){if(i>=bytes.length)fail('truncated');return bytes[i++]}
  function take(n){if(!Number.isSafeInteger(n)||n<0||i+n>bytes.length)fail('truncated');const b=bytes.slice(i,i+n);i+=n;return b}
  function vu(){let x=0,n=0,shift=0,last=0;for(;;){const b=rd();last=b;if(++n>3)fail('length varint too long');x|=(b&127)<<shift;if(!(b&128))break;shift+=7}if(n>1&&(last&127)===0)fail('non-minimal length');return x}
  if(String.fromCharCode(...take(4))!=='OFUA')fail('magic');
  if(rd()!==1)fail('unsupported version');
  const count=vu();if(count<1||count>MAX.addressSegments)fail('segment count');
  const out=[];
  for(let n=0;n<count;n++){
    const t=rd();
    if(t===1){const len=vu();if(len>MAX.addressNamespaceBytes)fail('namespace too long');let s;try{s=D.decode(take(len))}catch{fail('invalid UTF-8')}if(s!==s.normalize('NFC'))fail('non-canonical Unicode');out.push({kind:'namespace',value:s})}
    else if(t===2||t===3){const b=take(8);let x=0n;for(const q of b)x=(x<<8n)|BigInt(q);out.push({kind:t===2?'u64':'i64',value:t===2?x:BigInt.asIntN(64,x)})}
    else if(t===4){const len=vu();if(len>MAX.addressSegmentBytes)fail('bytes segment too long');out.push({kind:'bytes',value:take(len)})}
    else fail('unknown segment tag');
  }
  if(i!==bytes.length)fail('trailing bytes');
  return out;
}
P.parseAddress=parseAddress;
})(typeof globalThis!=='undefined'?globalThis:this);
