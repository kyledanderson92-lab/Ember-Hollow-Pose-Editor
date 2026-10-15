(function(global){
'use strict';
const library=global.SolEffectLibrary||(typeof require==='function'?require('./effect_library.js'):null),clone=o=>JSON.parse(JSON.stringify(o));
const asset=id=>library.assets.find(a=>a.id===id),types=['sticker'];
function create(id,assetId,time=0){const a=asset(assetId);if(!a)throw Error('Unknown sticker asset.');return {id,type:'sticker',asset:assetId,enabled:true,opacity:1,hue:0,mirror_x:false,mirror_y:false,z:1,transform:{position:[0,-25],rotation:0,scale:1,scale_x:1,scale_y:1},range:{start:time,end:Math.min(600,time+a.frames.length/a.fps)},playback:{fps:a.fps,speed:1,start_frame:0,loop:false,frame:null}};}
function range(e){return [e.range.start,e.range.end];}
function active(e,a,time){return e.enabled&&e.opacity>0&&time>=e.range.start-1e-8&&time<e.range.end-1e-8;}
function frame(e,time){const a=asset(e.asset),p=e.playback;if(!a||!active(e,null,time))return -1;const n=p.frame===null?Math.floor(Math.max(0,time-e.range.start)*p.fps*p.speed+1e-8)+p.start_frame:p.frame;return p.loop?n%a.frames.length:(n<a.frames.length?n:-1);}
function origin(p,e){return e.transform.position;}
function size(e){const a=asset(e.asset);return [a.width*e.transform.scale*e.transform.scale_x,a.height*e.transform.scale*e.transform.scale_y];}
function corners(e){const [w,h]=size(e),r=e.transform.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[e.transform.position[0]+x*c-y*s,e.transform.position[1]+x*s+y*c]);}
function blend(out,a,b,t){if(!a.vfx&&!b.vfx)return;const aa=new Map((a.vfx||[]).map(e=>[e.id,e])),bb=new Map((b.vfx||[]).map(e=>[e.id,e]));out.vfx=[];for(const id of new Set([...aa.keys(),...bb.keys()])){const x=aa.get(id),y=bb.get(id);if(!x){continue;}const e=clone(x);if(y){const mix=(a,b)=>a+(b-a)*t;for(const k of ['opacity','hue'])e[k]=mix(x[k],y[k]);e.transform.position=x.transform.position.map((n,i)=>mix(n,y.transform.position[i]));e.transform.rotation=x.transform.rotation+((((y.transform.rotation-x.transform.rotation)%360)+540)%360-180)*t;for(const k of ['scale','scale_x','scale_y'])e.transform[k]=mix(x.transform[k],y.transform[k]);}out.vfx.push(e);}}
function validatePose(p){if(p.vfx_frame_time!==undefined&&(!Number.isFinite(p.vfx_frame_time)||p.vfx_frame_time<0||p.vfx_frame_time>600))throw Error('Invalid sticker pose time.');if(p.vfx===undefined)return;if(!Array.isArray(p.vfx)||p.vfx.length>32)throw Error('Maximum 32 stickers per pose.');
 // One-way migration: procedural effects have no useful sticker equivalent.
 p.vfx=p.vfx.filter(e=>!['trail','burst','shockwave','afterimage','speed_lines','debris'].includes(e?.type));if(!p.vfx.length)delete p.vfx_frame_time;
 const ids=new Set(),num=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
 for(const e of p.vfx){if(!e||e.type!=='sticker'||!/^vfx_[1-9][0-9]*$/.test(e.id)||ids.has(e.id)||!asset(e.asset)||typeof e.enabled!=='boolean'||!num(e.opacity,0,1)||!num(e.hue,-180,180)||typeof e.mirror_x!=='boolean'||typeof e.mirror_y!=='boolean'||!Number.isInteger(e.z)||!num(e.z,-100,100)||!Array.isArray(e.transform?.position)||e.transform.position.length!==2||!e.transform.position.every(n=>num(n,-5000,5000))||!num(e.transform.rotation,-36000,36000)||!['scale','scale_x','scale_y'].every(k=>num(e.transform[k],.01,100))||!num(e.range?.start,0,600)||!num(e.range.end,e.range.start,600)||!num(e.playback?.fps,.1,120)||!num(e.playback.speed,.01,20)||!Number.isInteger(e.playback.start_frame)||!num(e.playback.start_frame,0,asset(e.asset).frames.length-1)||typeof e.playback.loop!=='boolean'||!(e.playback.frame===null||(Number.isInteger(e.playback.frame)&&num(e.playback.frame,0,asset(e.asset).frames.length-1))))throw Error('Invalid effect sticker.');ids.add(e.id);}
 if(!p.vfx.length)delete p.vfx;
}
function validateSequence(a){const shared=new Map();for(const k of a.keys)for(const e of k.pose.vfx||[]){const spec=JSON.stringify([e.asset,e.range]);if(shared.has(e.id)&&shared.get(e.id)!==spec)throw Error('Sticker asset and lifetime must be shared across keys.');shared.set(e.id,spec);}}
function removeKey(){}
function mirror(out,p){if(!p.vfx)return;out.vfx=clone(p.vfx);for(const e of out.vfx){e.transform.position[0]*=-1;e.transform.rotation*=-1;e.mirror_x=!e.mirror_x;}}
// Exact authored keys, no sample-rate loss; runtime uses the same hold/ease and discrete frame rules.
function runtime(a,actorScale=1){return {type:'sol_effect_sticker_clip',version:1,actor_scale:actorScale,duration:a.keys.at(-1).time,assets:library.assets.filter(v=>a.keys.some(k=>k.pose.vfx?.some(e=>e.asset===v.id))).map(({images,preview,...v})=>v),keys:a.keys.map(k=>({time:k.time,interpolation:k.interpolation,root:k.pose.root,facing:k.pose.facing,stickers:clone(k.pose.vfx||[])}))};}
const API={library,asset,types,create,range,active,frame,origin,size,corners,blend,validatePose,validateSequence,removeKey,mirror,runtime};global.SolVFX=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
