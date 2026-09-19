#!/usr/bin/env python3
import os,sys,json,hashlib,hmac,importlib.util
from pathlib import Path
ROOT=Path.cwd()

def load_json(p): return json.loads((ROOT/p).read_text(encoding='utf-8'))
def sha(b): return hashlib.sha256(b).hexdigest()
def check(ok,msg):
    if not ok: raise AssertionError(msg)
def reject(fn,msg):
    try: fn()
    except Exception: return
    raise AssertionError(msg+' expected rejection')

manifest=load_json(Path('conformance/iw0/manifest.json'))
p2=load_json(Path('conformance/iw0/p2-vectors.json'))
p4=load_json(Path('conformance/iw0/p4-vectors.json'))
pre=b''
for f in sorted(manifest['files'],key=lambda x:x['path']):
    raw=(ROOT/f['path']).read_bytes();check(len(raw)==f['bytes'],'byte count '+f['path']);check(sha(raw)==f['sha256'],'sha '+f['path']);pre+=f['path'].encode()+b'\0'+raw+b'\0'
check(sha(pre)==manifest['corpus_digest'],'corpus digest')
check((ROOT/'conformance/iw0/CORPUS.sha256').read_text().split()[0]==manifest['corpus_digest'],'CORPUS.sha256')

spec=importlib.util.spec_from_file_location('ofu_p2_oracle',ROOT/'tools/p2_oracle.py');O=importlib.util.module_from_spec(spec);spec.loader.exec_module(O)

def val(n):
    k=n['kind']
    if k=='null': return None
    if k=='bool': return n['value']
    if k=='int': return int(n['decimal'])
    if k=='bytes': return bytes.fromhex(n['hex'])
    if k=='text': return n['value']
    if k=='array': return [val(x) for x in n['items']]
    if k=='map': return {e['key']:val(e['value']) for e in n['entries']}
    raise ValueError(k)
def segs(ss):
    out=[]
    for s in ss:
        v=s['value'];k=s['kind']
        if k in ('u64','i64'):v=int(v)
        elif k=='bytes':v=bytes.fromhex(v)
        out.append({'kind':k,'value':v})
    return out

def neutral(n):
    if n is None or isinstance(n,(str,bool)): return n
    if isinstance(n,list): return [neutral(x) for x in n]
    if isinstance(n,dict):
        if set(n)=={'$bytes'}: return bytes.fromhex(n['$bytes'])
        if set(n)=={'$int'}: return int(n['$int'])
        return {k:neutral(v) for k,v in n.items()}
    raise TypeError(type(n))

def domain(tag,v): return hashlib.sha256(tag.encode()+b'\0'+O.enc(v)).digest()

positive=rejections=0
for c in p2['positive_canonical_values']:
    b=O.enc(val(c['input']));check(b.hex()==c['expected_hex'],'P2 positive '+c['id']);check(O.enc(O.dec(b))==b,'P2 roundtrip '+c['id']);positive+=1
for c in p2['malformed_canonical_bytes']:
    reject(lambda c=c:O.dec(bytes.fromhex(c['input_hex'])),c['id']);rejections+=1
addr={}
for c in p2['positive_addresses']:
    b=O.address(segs(c['segments']));check(b.hex()==c['expected_hex'],'address '+c['id']);check(O.address(O.parse_address(b))==b,'address roundtrip '+c['id']);d=O.derive(bytes.fromhex(p2['seed_hex']),bytes.fromhex(p2['semantic_manifest_hash']),c['derive']['domain'],b,c['derive']['property'],int(c['derive']['counter']));check(d.hex()==c['derive']['expected_hex'],'derive '+c['id']);addr[c['id']]=b;positive+=1
for c in p2['malformed_addresses']:
    reject(lambda c=c:O.parse_address(bytes.fromhex(c['input_hex'])),c['id']);rejections+=1
check(O.mh(p2['semantic_manifest']).hex()==p2['semantic_manifest_hash'],'manifest hash');desc,uid=O.universe(bytes.fromhex(p2['seed_hex']),bytes.fromhex(p2['semantic_manifest_hash']));check(desc.hex()==p2['universe_descriptor_hex'],'universe descriptor');check(uid.hex()==p2['universe_identity'],'universe identity');positive+=2
for c in p2['identity_cases']:
    actual=O.entity(bytes.fromhex(c['universe_identity']),c['namespace'],val(c['stable_key']));check(actual.hex()==c['expected_entity_identity'],'entity '+c['id']);positive+=1
for c in p2['derivation_separation']:
    actual=O.derive(bytes.fromhex(p2['seed_hex']),bytes.fromhex(p2['semantic_manifest_hash']),c['domain'],addr[c['address_ref']],c['property'],int(c['counter']));check(actual.hex()==c['expected_hex'],'derive separation '+c['id']);positive+=1
check(len({c['expected_hex'] for c in p2['derivation_separation']})==len(p2['derivation_separation']),'derivation collision')

def rejection_fn(c):
    p=c['pattern'];k=p['kind']
    if k=='map-normalization-collision': return lambda:O.enc({p['keys'][0]:1,p['keys'][1]:2})
    if k=='integer': return lambda:O.enc(int(p['decimal']))
    if k=='nested-array-depth':
        def f():
            v=None
            for _ in range(p['depth']):v=[v]
            return O.enc(v)
        return f
    if k=='map-null-pairs': return lambda:O.enc({'k'+str(i).zfill(5):None for i in range(p['pairs'])})
    if k=='zero-bytes': return lambda:O.enc(bytes(p['length']))
    if k=='ascii-text': return lambda:O.enc('a'*p['length'])
    if k=='null-array': return lambda:O.enc([None]*p['length'])
    if k=='namespace': return lambda:O.address([{'kind':'namespace','value':'a'*p['length']}])
    if k=='bytes': return lambda:O.address([{'kind':'bytes','value':bytes(p['length'])}])
    if k=='manifest-mutation':
        def f():
            m=json.loads(json.dumps(p2['semantic_manifest']))
            if p['mutation']=='add-unknown-field':m['browser']='chromium'
            elif p['mutation']=='delete-domains':del m['domains']
            elif p['mutation']=='semantic-version-2':m['semanticManifestVersion']=2
            return O.mh(m)
        return f
    raise ValueError(k)
for c in p2['generated_rejections']:
    reject(rejection_fn(c),c['id']);rejections+=1

# Independent narrow-P4 oracle: derive the frozen domain-separated identities and total order using only P2 oracle bytes + hashlib.
u=bytes.fromhex(p4['universe_identity'])
lineage=domain('OFU-P4-LINEAGE-v1',{'universeIdentity':u,'parentCheckpointId':None,'branchKey':p4['lineage']['branch_key']});check(lineage.hex()==p4['lineage']['expected_lineage_id'],'P4 lineage');positive+=1
for k,v in p4['entities'].items(): check(O.entity(u,'synthetic',{'id':k}).hex()==v,'P4 entity '+k)
ids={}
for rec in p4['events']:
    d=neutral(rec['descriptor']);eid=domain('OFU-P4-EVENT-v1',d);check(eid.hex()==rec['expected_event_id'],'P4 event '+rec['label']);ids[rec['label']]=(d,eid);positive+=1
order=sorted(p4['input_order'],key=lambda x:(ids[x][0]['time']['seconds'],ids[x][0]['time']['micros'],ids[x][1]));check(order==p4['expected_canonical_order'],'P4 canonical order');positive+=1

def frontier_order_key(label):
    d,eid=ids[label]
    return (d['time']['seconds'],d['time']['micros'],eid)
def frontier_outcome(frontier_label,candidate_label):
    if frontier_label is None: return 'ACCEPT'
    frontier_id=ids[frontier_label][1];candidate_id=ids[candidate_label][1]
    if candidate_id==frontier_id: return 'DUPLICATE_NOOP'
    return 'ACCEPT' if frontier_order_key(candidate_label)>frontier_order_key(frontier_label) else 'REJECT_NON_CANONICAL_ORDER'
frontier_rejections=0
for scenario in p4['live_frontier_scenarios']:
    actual=frontier_outcome(scenario['frontier_event'],scenario['candidate_event'])
    check(actual==scenario['expected'],'P4 live frontier '+scenario['id'])
    positive+=1
    if actual=='REJECT_NON_CANONICAL_ORDER': frontier_rejections+=1;rejections+=1

check(domain('OFU-P4-TRANSITION-CONTRACT-v1',neutral(p4['transition_contract']['descriptor'])).hex()==p4['transition_contract']['expected_digest'],'P4 transition digest');positive+=1

evidence={'schema':'ofu-ind-conf-a-python-oracle-evidence-v1','status':'PASS','source_commit':os.environ.get('OFU_SOURCE_SHA','LOCAL-UNPINNED'),'corpus_digest':manifest['corpus_digest'],'positive_checks':positive,'rejection_checks':rejections,'p2_unicode_database':O.UNICODE_VERSION,'p4_scope':'identity/event/order/transition/live-frontier admission; checkpoint/archive behavior remains JS authority evidence','p4_live_frontier_scenarios':len(p4['live_frontier_scenarios']),'p4_live_frontier_rejections':frontier_rejections,'p4_frontier_model':'INDEPENDENT_MINIMAL_ORDER_KEY_STATE_MACHINE'}
out=ROOT/'dist/evidence/industrialization';out.mkdir(parents=True,exist_ok=True);(out/'ind-conf-a-python.json').write_text(json.dumps(evidence,indent=2,sort_keys=True)+'\n',encoding='utf-8')
print(json.dumps(evidence,sort_keys=True))
