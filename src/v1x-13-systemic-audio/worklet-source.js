(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const PROCESSOR_NAME='ofu-systemic-audio-v1';
const SOURCE=`'use strict';
const MAX_LAYERS=6;
const TAU=Math.PI*2;
class OFUSystemicAudioProcessor extends AudioWorkletProcessor {
  constructor(){
    super();
    this.layers=[];
    this.phase=new Float64Array(MAX_LAYERS);
    this.noise=0x6d2b79f5;
    this.port.onmessage=(event)=>{
      const data=event&&event.data;
      if(!data||data.type!=='plan'||!Array.isArray(data.layers)){this.layers=[];return;}
      this.layers=data.layers.slice(0,MAX_LAYERS).map(layer=>({
        type:layer.type==='noise'||layer.type==='pulse'?'noise'===layer.type?'noise':'pulse':'tone',
        frequency:Number.isFinite(layer.frequency)?Math.max(20,Math.min(18000,layer.frequency)):220,
        gain:Number.isFinite(layer.gain)?Math.max(0,Math.min(0.35,layer.gain)):0,
        activity:Number.isFinite(layer.activity)?Math.max(0,Math.min(1,layer.activity)):0
      }));
    };
  }
  random(){
    let x=this.noise|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.noise=x|0;return ((x>>>0)/4294967295)*2-1;
  }
  process(_inputs,outputs){
    const output=outputs[0];if(!output||output.length===0)return true;
    const frames=output[0].length;
    for(let c=0;c<output.length;c++)output[c].fill(0);
    for(let i=0;i<frames;i++){
      let sample=0;
      for(let j=0;j<this.layers.length;j++){
        const layer=this.layers[j];
        this.phase[j]=(this.phase[j]+TAU*layer.frequency/sampleRate)%TAU;
        let v;
        if(layer.type==='noise')v=this.random()*0.45;
        else if(layer.type==='pulse')v=Math.sin(this.phase[j])*(0.25+0.75*(Math.sin(this.phase[j]*0.125)>0?1:0));
        else v=Math.sin(this.phase[j]);
        sample+=v*layer.gain;
      }
      sample=Math.max(-0.85,Math.min(0.85,sample));
      for(let c=0;c<output.length;c++)output[c][i]=sample;
    }
    return true;
  }
}
registerProcessor('${PROCESSOR_NAME}',OFUSystemicAudioProcessor);`;
O.systemicAudioWorkletV1=Object.freeze({PROCESSOR_NAME,SOURCE,MAX_LAYERS:6});
})(globalThis);
