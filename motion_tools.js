(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
function retime(sequence,seconds){
 const out=M().animation.validate(sequence),old=M().animation.duration(out);
 if(!Number.isFinite(seconds)||seconds<.01||seconds>600||old<=0)throw Error('Choose a duration from 0.01 to 600 seconds for a clip with at least two keys.');
 const ratio=seconds/old;
 for(const k of out.keys){k.time*=ratio;if(k.pose.vfx_frame_time!==undefined)k.pose.vfx_frame_time*=ratio;
 for(const e of k.pose.vfx||[]){for(const field of ['range','source'])for(const time of ['start','end'])if(Number.isFinite(e[field]?.[time]))e[field][time]*=ratio;}}
 return M().animation.validate(out);
}
function overclock(sequence,id){
 const out=M().animation.validate(sequence);
 if(out.weapon_type==='base')throw Error('Choose a weapon attack animation first.');
 out.id=id;out.name=('overclock_'+out.name.replace(/^overclock_/, '')).slice(0,100);
 for(const k of out.keys){k.pose.weapon.size_multiplier=3;for(const e of k.pose.vfx||[])if(e.source.animation_id===sequence.id)e.source.animation_id=id;}
 return M().animation.validate(out);
}
const api={retime,overclock};global.SolMotionTools=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
