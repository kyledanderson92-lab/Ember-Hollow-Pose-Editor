(function(global){
'use strict';
const model=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const RAD=Math.PI/180,cache=new WeakMap();
function attachmentFrame(p,anchor){
	if(anchor==='grid')return {position:[0,0],matrix:[1,0,0,1]};
	const r=anchor==='weapon'?p.weapon.rotation*RAD:0,c=Math.cos(r),s=Math.sin(r),socket=anchor==='weapon'?p.joints.weapon_socket:[0,0];
	return {position:[p.root[0]+socket[0]*p.facing,p.root[1]+socket[1]],matrix:[c*p.facing,s,-s*p.facing,c]};
}
function defaultSweep(){return {enabled:true,mode:'character_ray'};}
function characterCenter(p){return [p.root[0]+p.joints.torso[0]*p.facing,p.root[1]+p.joints.torso[1]];}
function characterRay(p,definitions={}){
 const M=model(),origin=characterCenter(p);if(!M.weapons.enabled(p)||p.weapon.kind==='none')return {origin,direction:[0,0],valid:false};
 const local=M.weapons.tip(p,definitions),tip=[p.root[0]+local[0]*p.facing,p.root[1]+local[1]],delta=tip.map((v,i)=>v-origin[i]),length=Math.hypot(...delta);
 return {origin,tip,direction:length>1e-7?delta.map(v=>v/length):[0,0],valid:length>1e-7};
}
function sampleTimes(a,start=0,end=a.keys.at(-1).time){
	const S=model().animation,times=[start,end];for(let n=Math.ceil(start*120);n<end*120;n++)times.push(n/120);
	for(let i=0;i<a.keys.length;i++){const key=a.keys[i],next=a.keys[i+1];if(key.time>=start&&key.time<=end)times.push(key.time);
		if(next&&key.interpolation==='hold'&&next.time>start&&next.time<=end)times.push(Math.max(start,next.time-1e-7));
		if(next&&(key.pose.facing!==next.pose.facing||model().weapons.enabled(key.pose)!==model().weapons.enabled(next.pose)||key.pose.weapon.kind!==next.pose.weapon.kind)&&key.interpolation!=='hold'){let lo=0,hi=1;for(let n=0;n<30;n++){const mid=(lo+hi)/2;if(S.easing(key.interpolation,mid)<.5)lo=mid;else hi=mid;}const t=key.time+(next.time-key.time)*hi;if(t>=start&&t<=end)times.push(Math.max(start,t-1e-7),t);}
	}return [...new Set(times)].sort((a,b)=>a-b);
}
function context(animation,definitions={}){
	if(!animation)return null;const signature=JSON.stringify([animation.keys,definitions]),prior=cache.get(animation);if(prior?.signature===signature)return prior;
	const out={animation,definitions,signature,sweeps:new Map()};cache.set(animation,out);return out;
}
function sweepTrack(e,ctx){
 const key=JSON.stringify(e.range),prior=ctx.sweeps.get(key);if(prior)return prior;
 const S=model().animation,start=e.range.start,end=Math.max(start,Math.min(e.range.end,ctx.animation.keys.at(-1).time)),track=[];
 for(const time of sampleTimes(ctx.animation,start,end)){const ray=characterRay(S.sample(ctx.animation,time,ctx.definitions),ctx.definitions),last=track.at(-1);track.push({time,...ray,break_before:!!last&&(time-last.time<1e-6||!last.valid||!ray.valid)});}
 ctx.sweeps.set(key,track);return track;
}
function sweptRays(p,e,time,ctx=null){
 if(!e.sweep?.enabled||!ctx||time<=e.range.start)return [];
 const track=sweepTrack(e,ctx),end=Math.min(time,e.range.end),out=[];
 for(const ray of track){if(ray.time>end)break;out.push(ray);}
 const last=out.at(-1);if(last&&end-last.time>1e-8){const current=end===time?characterRay(p,ctx.definitions):characterRay(model().animation.sample(ctx.animation,end,ctx.definitions),ctx.definitions);out.push({time:end,...current,break_before:end-last.time<1e-6||!last.valid||!current.valid});}
 return out;
}
function extentFor(e,rays){const corners=model().vfx.corners(e);return Math.max(1,...corners.map(p=>Math.hypot(...p)))+Math.max(0,...rays.map(r=>Math.hypot(...r.origin)))+64;}
function trianglesFor(rays,extent){
 const triangles=[],add=(a,b,c)=>{const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(cross)>1e-8)triangles.push(cross>0?[a,b,c]:[a,c,b]);};
 for(let i=1;i<rays.length;i++){const a=rays[i-1],b=rays[i];if(!a.valid||!b.valid||b.break_before)continue;const far=r=>r.origin.map((v,j)=>v+r.direction[j]*extent),aa=far(a),bb=far(b);add(a.origin,aa,bb);add(a.origin,bb,b.origin);}
 return triangles;
}
function mask(p,source,time,ctx=null){const e=model().vfx.toGrid(p,source),rays=sweptRays(p,source,time,ctx),extent=extentFor(e,rays);return {triangles:trianglesFor(rays,extent),ray:characterRay(p,ctx?.definitions||{}),extent};}
function trianglePath(triangles){return triangles.map(points=>'M '+points.map(p=>p.join(' ')).join(' L ')+' Z').join(' ')||'M 0 0';}
function advanced(a){return a.keys.some(k=>k.pose.vfx?.some(e=>e.anchor==='weapon'||e.sweep?.enabled));}
function bakeRuntime(a,actorScale=1,definitions={}){
	const M=model(),E=M.vfx,ctx=context(a,definitions),times=sampleTimes(a);for(const k of a.keys)for(const e of k.pose.vfx||[])for(const t of E.frameBoundaries(e))if(t>=0&&t<=a.keys.at(-1).time)times.push(t);
	const unique=[...new Set(times)].sort((a,b)=>a-b),count=Math.max(1,...a.keys.map(k=>k.pose.vfx?.length||0));if(unique.length>80000||unique.length*count>200000)throw Error('Effects export is too large. Shorten the clip or export fewer stickers.');
	const tracks={};for(const k of a.keys)for(const e of k.pose.vfx||[])if(e.sweep?.enabled&&!tracks[e.id]){const track=sweepTrack(e,ctx);if(track.length>2048)throw Error('Ray reveal is too long for native export. Keep each reveal interval under about 17 seconds.');tracks[e.id]=track;}
 return {type:'sol_effect_sticker_clip',version:a.keys.some(k=>k.pose.vfx?.some(e=>e.sequence?.weights))?9:a.keys.some(k=>k.pose.vfx?.some(e=>e.sequence?.reverse))?8:a.keys.some(k=>k.pose.vfx?.some(e=>e.sequence))?7:6,sweep_tracks:tracks,actor_scale:actorScale,sample_rate:120,duration:a.keys.at(-1).time,assets:E.library.assets.filter(v=>a.keys.some(k=>k.pose.vfx?.some(e=>e.asset===v.id))).map(({images,preview,...v})=>v),keys:unique.map(time=>{const p=M.animation.sample(a,time,definitions);return {time,interpolation:'linear',root:[0,0],facing:1,stickers:(p.vfx||[]).map(source=>{const e=E.toGrid(p,source);e.anchor='grid';if(e.sweep?.enabled)e.sweep_ray=characterRay(p,definitions);return e;})};})};
}
const API={attachmentFrame,defaultSweep,characterCenter,characterRay,sampleTimes,context,sweepTrack,sweptRays,extentFor,trianglesFor,mask,trianglePath,advanced,bakeRuntime};global.SolStickerMotion=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
