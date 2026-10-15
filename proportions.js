(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const ids=['left_upper_arm','left_lower_arm','right_upper_arm','right_lower_arm','left_upper_leg','left_lower_leg','right_upper_leg','right_lower_leg','torso','neck'];
function defaults(r){return {...Object.fromEntries(M().chains.segments(M().defaultPose(r),r).filter(e=>e.character).map(e=>[e.id,e.baseline_length])),torso:Math.hypot(...r.joints.torso),neck:M().dist(r.joints.torso,r.joints.head)};}
function resizeTrunk(j,before,torsoRatio,neckRatio){const next=before.torso.map(v=>v*torsoRatio),delta=M().sub(next,before.torso);j.torso=next;for(const id of ['left_shoulder','right_shoulder','scarf_root'])j[id]=M().add(before[id],delta);j.head=M().add(next,M().sub(before.head,before.torso).map(v=>v*neckRatio));}
function retarget(p,oldRig,newRig,normalizeBody=[]){
 const m=M(),before=m.clone(p),old=defaults(oldRig),next=defaults(newRig),pins=m.clone(p.pins||{});p.pins??={};if(m.weapons.enabled(p))for(const side of ['left','right'])if(p.hand_grips?.[side]&&p.hand_grips[side].mode!=='free')p.pins[side+'_hand']=true;
 const torsoRatio=next.torso/old.torso*(normalizeBody.includes('torso')?Math.min(1,old.torso/Math.hypot(...before.joints.torso)):1),neckRatio=next.neck/old.neck*(normalizeBody.includes('neck')?Math.min(1,old.neck/m.dist(before.joints.torso,before.joints.head)):1);resizeTrunk(p.joints,before.joints,torsoRatio,neckRatio);
 for(const key of ['torso','neck'])if(p.body_modes?.[key])p.body_modes[key].length=normalizeBody.includes(key)?next[key]:p.body_modes[key].length*next[key]/old[key];
 for(const key of m.projection.limbKeys){
  const [side,kind]=key.split('_'),ratio=['upper','lower'].map(part=>next[side+'_'+part+'_'+kind]/old[side+'_'+part+'_'+kind]),[base,mid,end]=m.projection.ids(key),mode=p.limb_modes?.[key];
  if(mode){if(mode.lower_limit!==undefined)mode.lower_limit*=ratio[1];const upper=mode.vectors[0],lower=m.sub(mode.vectors[1],upper);mode.vectors=[upper.map(x=>x*ratio[0]),m.add(upper.map(x=>x*ratio[0]),lower.map(x=>x*ratio[1]))];mode.gaps=m.projection.gaps(mode).map((x,i)=>x*ratio[i]);m.projection.applyGeometry(p,key);}
  else{
   const bones=m.projection.bones(before,key),off=m.projection.offsets(before,key),vectors=bones.map(([a,b],i)=>m.sub(b,a).map(x=>x*ratio[i]));
   const gaps=off.map((v,i)=>m.rotate(v.map(x=>x*ratio[i]),m.angle(before.joints[i?mid:base],before.joints[i?end:mid])));
   p.joints[mid]=m.add(p.joints[base],m.add(vectors[0],gaps[0]));p.joints[end]=m.add(p.joints[mid],m.add(vectors[1],gaps[1]));
   if(p.limb_gaps?.[key])p.limb_gaps[key].offsets=off.map((v,i)=>v.map(x=>x*ratio[i]));
  }
 }
 for(const e of p.extra_segments||[])p.joints[e.end]=M().add(before.joints[e.end],M().sub(p.joints[e.start],before.joints[e.start]));
 const hand=m.weaponHand(p)+'_hand';if(m.attachments.attachment(p).position_locked)p.joints.weapon_socket=m.add(before.joints.weapon_socket,m.sub(p.joints[hand],before.joints[hand]));
 m.attachments.apply(p,before);
 for(const id of ['torso','head','left_shoulder','right_shoulder','scarf_root'])if(p.pins?.[id]&&m.dist(p.joints[id],before.joints[id])>1e-5)throw Error('Pinned '+id.replaceAll('_',' ')+' would move.');
 if(Object.values(p.pins||{}).some(Boolean)&&!m.chains.reconcilePins(p,newRig,before))throw Error('Cannot keep '+Object.entries(p.pins).filter(([,on])=>on).map(([id])=>id.replaceAll('_',' ')).join(', ')+' fixed at these lengths.');
 p.pins=pins;if(!m.attachments.constrainGrips(p,newRig))throw Error('A hand grip cannot reach the weapon at these lengths.');return m.validate(m.exportPose(p));
}
function apply(project,changes){
 const m=M(),out=m.validate(project),old=m.clone(out.rig),known=defaults(old),next={...known,...changes};
 for(const [id,value] of Object.entries(changes))if(!ids.includes(id)||!Number.isFinite(value)||value<.1||value>1000)throw Error('Default segment lengths must be 0.1–1000.');
 const r=out.rig,j=r.joints,previous=m.clone(j);
 resizeTrunk(j,previous,next.torso/known.torso,next.neck/known.neck);
 for(const side of ['left','right'])for(const kind of ['arm','leg']){
  const chain=(kind==='arm'?['shoulder','elbow','hand']:['hip','knee','foot']).map(id=>side+'_'+id);
  j[chain[1]]=m.endpoint(j[chain[0]],next[side+'_upper_'+kind],m.angle(previous[chain[0]],previous[chain[1]]));
  j[chain[2]]=m.endpoint(j[chain[1]],next[side+'_lower_'+kind],m.angle(previous[chain[1]],previous[chain[2]]));
 }
 const hand=(r.weapon_hand||'right')+'_hand';j.weapon_socket=m.add(previous.weapon_socket,m.sub(j[hand],previous[hand]));
 for(const kind of ['arm','leg'])for(const part of ['upper','lower'])r[part+'_'+kind+'_length']=(next['left_'+part+'_'+kind]+next['right_'+part+'_'+kind])/2;
 const failures=[],visit=(p,label,location={})=>{try{return retarget(p,old,r,Object.keys(changes).filter(k=>['torso','neck'].includes(k)));}catch(e){failures.push({label,reason:e.message,pins:Object.entries(p.pins||{}).filter(([,on])=>on).map(([id])=>id),...location});return p;}};
 out.current_pose=visit(out.current_pose,'Current pose');out.poses=out.poses.map(p=>visit(p,'Pose '+p.name));
 for(const a of out.animations||[])for(const key of a.keys)key.pose=visit(key.pose,a.name+' / '+key.id+' ('+key.time+'s)',{animationId:a.id,keyId:key.id});
 if(failures.length){const error=Error('Could not apply default lengths: '+failures.slice(0,8).map(f=>f.label+' — '+f.reason).join('; ')+(failures.length>8?' … ('+failures.length+' total)':'')+' No changes applied. Locks belong to each pose/key; the visible pin panel shows only the current one.');error.proportionConflicts=failures;throw error;}
 return m.validate(out);
}
const api={ids,defaults,retarget,apply};global.SolProportions=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
