(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x13-audio-controls-1';
function invariant(ok,message){if(!ok)throw new Error('V1X13 audio controls: '+message);}
function mount(container,runtime,options={}){
  invariant(container&&typeof container.appendChild==='function','container required');
  invariant(runtime&&typeof runtime.setControls==='function','audio runtime required');
  const doc=options.document||root.document;invariant(doc&&typeof doc.createElement==='function','document required');
  const initial=O.systemicAudioContextV1.controls(options.initial||{});
  const fieldset=doc.createElement('fieldset');fieldset.setAttribute('data-ofu-systemic-audio-controls','v1');
  const legend=doc.createElement('legend');legend.textContent='Systemic audio (optional)';fieldset.appendChild(legend);
  const note=doc.createElement('p');note.textContent='Audio is presentation-only and is never required for navigation or accessibility.';fieldset.appendChild(note);
  function row(labelText,input){const label=doc.createElement('label');const span=doc.createElement('span');span.textContent=labelText;label.appendChild(span);label.appendChild(input);fieldset.appendChild(label);return input;}
  const enabled=doc.createElement('input');enabled.type='checkbox';enabled.checked=initial.enabled;row('Enable audio',enabled);
  const volume=doc.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='0.05';volume.value=String(initial.volume);volume.setAttribute('aria-label','Audio volume');row('Volume',volume);
  const muted=doc.createElement('input');muted.type='checkbox';muted.checked=initial.muted;row('Mute audio',muted);
  const reduced=doc.createElement('input');reduced.type='checkbox';reduced.checked=initial.reducedSensory;row('Reduced sensory audio',reduced);
  let disposed=false;
  const current=()=>({enabled:enabled.checked!==false,volume:Number(volume.value),muted:muted.checked===true,reducedSensory:reduced.checked===true});
  const apply=()=>{if(disposed)return;Promise.resolve(runtime.setControls(current())).catch(()=>{});};
  for(const input of [enabled,volume,muted,reduced]){input.addEventListener('change',apply);input.addEventListener('input',apply);}
  container.appendChild(fieldset);Promise.resolve(runtime.setControls(initial)).catch(()=>{});
  return Object.freeze({
    element:fieldset,
    values:()=>Object.freeze(current()),
    dispose(){if(disposed)return;disposed=true;for(const input of [enabled,volume,muted,reduced]){input.removeEventListener('change',apply);input.removeEventListener('input',apply);}if(fieldset.parentNode)fieldset.parentNode.removeChild(fieldset);}
  });
}
O.systemicAudioControlsV1=Object.freeze({VERSION,mount});
})(globalThis);
