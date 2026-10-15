(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
function handOrientation(p){const side=M().weaponHand(p);return M().projection.lowerAngle(p,side+'_arm')+(p.hand_rotations?.[side]||0);}
function attachment(p){return p.weapon.attachment||{position_locked:true,rotation_locked:false,grip_rotation_offset:0,position_offset:M().sub(p.joints.weapon_socket,p.joints[M().weaponHand(p)+'_hand'])};}
function capture(p){const a=p.weapon.attachment||(p.weapon.attachment={...attachment(p)});a.grip_rotation_offset=p.weapon.rotation-handOrientation(p);a.position_offset=M().sub(p.joints.weapon_socket,p.joints[M().weaponHand(p)+'_hand']);return a;}
function setLocks(p,position,rotation){const a=p.weapon.attachment||(p.weapon.attachment={...attachment(p)}),wasPosition=a.position_locked,wasRotation=a.rotation_locked;if(rotation)position=true;if((position&&!wasPosition)||(rotation&&!wasRotation))capture(p);a.position_locked=position;a.rotation_locked=rotation&&position;}
function constrainTransform(position,rotation,parentPosition,parentRotation,state){return {position:state.position_locked?parentPosition.map((v,i)=>v+state.position_offset[i]):[...position],rotation:state.rotation_locked?parentRotation+state.grip_rotation_offset:rotation};}
function handMode(p,side){return p.hand_grips?.[side]?.mode||(side===M().weaponHand(p)&&attachment(p).position_locked?'grip':'free');}
function gripPoint(p,position){return M().add(p.joints.weapon_socket,M().rotate([0,-position],p.weapon.rotation));}
function gripPosition(p,point){return -M().rotate(M().sub(point,p.joints.weapon_socket),-p.weapon.rotation)[1];}
function handRanges(p,r,side,definitions={},allowCrossing=false){
 const other=side==='left'?'right':'left',min=-3,max=M().projection.length(p,definitions);if(handMode(p,other)==='free')return [[min,max]];
 const otherPosition=p.hand_grips?.[other]?.position??gripPosition(p,p.joints[other+'_hand']),position=p.hand_grips?.[side]?.position??gripPosition(p,p.joints[side+'_hand']),order=p.hand_grips?.[side]?.order??(position<otherPosition-1e-6?-1:position>otherPosition+1e-6?1:(side==='left'?1:-1)),ranges=[];
 if(allowCrossing||order<0)ranges.push([min,Math.min(max,otherPosition)]);
 if(allowCrossing||order>0)ranges.push([Math.max(min,otherPosition),max]);
 return ranges.filter(([a,b])=>a<=b);
}
function nearestHandPosition(p,r,side,wanted,definitions={},allowCrossing=false){const values=handRanges(p,r,side,definitions,allowCrossing).map(([min,max])=>Math.max(min,Math.min(max,wanted)));return values.sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted))[0];}
// Hold physical spans while solving a Slide contact or a shared-scale Grip.
function moveArmAtLengths(p,r,side,target,chainIK=true){
 const m=M(),q=m.clone(p),key=side+'_arm',state=q.limb_modes?.[key]?m.clone(q.limb_modes[key]):null;
 if(state)m.projection.disable(q,key);
 if(m.dist(q.joints[side+'_hand'],target)>1e-5&&!m.chains.move(q,r,side+'_hand',target,chainIK))return false;
 if(m.dist(q.joints[side+'_hand'],target)>3e-5)return false;
 if(state){try{m.projection.capture(q,key);}catch{return false;}const next=q.limb_modes[key];next.vectors=next.vectors.map(v=>v.map(n=>n/state.scale));next.scale=state.scale;if(state.allow_extension!==undefined)next.allow_extension=state.allow_extension;if(state.stretch_segments)next.stretch_segments=true;}
 Object.assign(p,q);return true;
}
function solveHand(p,r,side,position,chainIK=true){
 const m=M(),id=side+'_hand',target=gripPoint(p,position),socket=m.clone(p.joints.weapon_socket),rotation=p.weapon.rotation;
 if(m.dist(p.joints[id],target)>1e-5){if(p.pins?.[id]||!(p.hand_grips?.[side]?.mode==='slide'?moveArmAtLengths(p,r,side,target,chainIK):m.chains.move(p,r,id,target,chainIK))||m.dist(p.joints[id],target)>2e-5)return false;}
 p.joints.weapon_socket=socket;p.weapon.rotation=rotation;p.hand_rotations[side]=m.wrap(rotation-m.projection.lowerAngle(p,side+'_arm'));return true;
}
// Intersect the shaft with the arm's reachable annulus, then try nearest points.
function snapHand(p,r,side,point,definitions={},allowCrossing=false,chainIK=true){
 const m=M(),key=side+'_arm',id=side+'_hand',min=-3,max=m.projection.length(p,definitions),wanted=Math.max(min,Math.min(max,gripPosition(p,point))),root=p.joints[side+(chainIK?'_shoulder':'_elbow')],delta=m.sub(root,p.joints.weapon_socket),axis=m.rotate([0,-1],p.weapon.rotation),along=delta[0]*axis[0]+delta[1]*axis[1],perpendicular=Math.max(0,delta[0]**2+delta[1]**2-along**2),bones=m.projection.bones(p,key),lengths=bones.map(b=>m.dist(...b)),state=p.limb_modes?.[key],reach=state?Math.hypot(...state.vectors[1]):0,reference=state?[Math.hypot(...state.vectors[0]),m.dist(...state.vectors)]:lengths,mode=m.projection.movement(p,key),bounds=!chainIK?(p.hand_grips?.[side]?.mode==='slide'?[lengths[1],lengths[1]]:[m.projection.lowerBounds(p,key).min,m.projection.lowerBounds(p,key).max]):(mode==='normal'||p.hand_grips?.[side]?.mode==='slide')?[Math.abs(lengths[0]-lengths[1]),lengths[0]+lengths[1]]:[reach*.1/Math.min(...reference),mode==='depth'?reach:mode==='stretch'?reach*1000/Math.max(...reference):reach+2000],ranges=handRanges(p,r,side,definitions,allowCrossing),candidates=[wanted,...ranges.flat(),gripPosition(p,p.joints[id])];
 for(const radius of bounds){const square=radius*radius-perpendicular;if(square>=-1e-7){const d=Math.sqrt(Math.max(0,square));candidates.push(along-d,along+d);}}
 if(p.pins?.[side+'_elbow']){const center=p.joints[side+'_elbow'],d=m.sub(center,p.joints.weapon_socket),a=d[0]*axis[0]+d[1]*axis[1],square=lengths[1]**2-Math.max(0,d[0]**2+d[1]**2-a*a);if(square>=-1e-7)candidates.push(a-Math.sqrt(Math.max(0,square)),a+Math.sqrt(Math.max(0,square)));}
 for(const value of candidates.filter(v=>ranges.some(([a,b])=>v>=a-1e-6&&v<=b+1e-6)).sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted))){const q=m.clone(p),position=Math.max(min,Math.min(max,value));if(solveHand(q,r,side,position,chainIK)){q.hand_grips[side].position=position;const other=side==='left'?'right':'left',otherPosition=q.hand_grips?.[other]?.position??gripPosition(q,q.joints[other+'_hand']);if(handMode(q,other)!=='free'){const delta=position-otherPosition;q.hand_grips[side].order=Math.abs(delta)>1e-6?Math.sign(delta):q.hand_grips[side].order??(side==='left'?1:-1);if(q.hand_grips?.[other])q.hand_grips[other].order=-q.hand_grips[side].order;}Object.assign(p,q);return true;}}
 return false;
}
function setHandMode(p,r,side,mode,definitions={}){
 if(!['left','right'].includes(side)||!['grip','slide','free'].includes(mode))throw Error('Invalid hand mode.');
 const m=M(),q=m.clone(p),allowCrossing=handMode(p,side)==='free';if(mode!=='free'&&!m.weapons.enabled(q))return false;
 q.hand_grips??={};q.hand_grips[side]={...q.hand_grips[side],mode,position:q.hand_grips[side]?.position??gripPosition(q,q.joints[side+'_hand'])};
 // An explicitly released/sliding primary hand must no longer drive the weapon.
 if(side===m.weaponHand(q))setLocks(q,false,false);
 if(mode==='free')q.hand_rotations[side]=0;
 if(mode!=='free'&&!snapHand(q,r,side,q.joints[side+'_hand'],definitions,allowCrossing))return false;
 if(!constrainGrips(q,r,definitions)||!m.projection.pinsMatch(q,p))return false;Object.assign(p,q);return true;
}
// Direct Slide-hand input may cross another hand; weapon-driven snapping keeps order.
function moveHand(p,r,side,point,definitions={},chainIK=true){
 if(p.hand_grips?.[side]?.mode!=='slide')return false;const q=M().clone(p);if(!snapHand(q,r,side,point,definitions,true,chainIK)||!constrainGrips(q,r,definitions)||!M().projection.pinsMatch(q,p))return false;Object.assign(p,q);return true;
}
function constrainGrips(p,r,definitions={}){
 if(!p.hand_grips||!M().weapons.enabled(p))return true;const q=M().clone(p);
 for(const side of ['left','right']){const grip=q.hand_grips[side];if(!grip||grip.mode==='free')continue;grip.position=Math.max(-3,Math.min(M().projection.length(q,definitions),grip.position));if(!solveHand(q,r,side,grip.position))return false;}
 Object.assign(p,q);return true;
}
function validateHands(p){
 if(p.hand_grips===undefined)return;if(!p.hand_grips||Array.isArray(p.hand_grips)||typeof p.hand_grips!=='object')throw Error('Invalid hand grips.');
 for(const [side,grip] of Object.entries(p.hand_grips))if(!['left','right'].includes(side)||!grip||!['grip','slide','free'].includes(grip.mode)||!Number.isFinite(grip.position)||Math.abs(grip.position)>10000||(grip.order!==undefined&&![-1,1].includes(grip.order)))throw Error('Invalid hand grip.');
 if(p.hand_grips[M().weaponHand(p)]&&attachment(p).position_locked)throw Error('Explicit hand modes need an independent weapon grip.');
}
// Small transform constraint shared by attachment modes. Rotation is independent
// of the position offset, matching the existing translational socket behavior.
function apply(p,before=null,manualSocket=false){const a=p.weapon.attachment;
 if(a){const hand=p.joints[M().weaponHand(p)+'_hand'];if(manualSocket&&a.position_locked)a.position_offset=M().sub(p.joints.weapon_socket,hand);const result=constrainTransform(p.joints.weapon_socket,p.weapon.rotation,hand,handOrientation(p),a);if(a.position_locked&&!p.pins?.weapon_socket)p.joints.weapon_socket=result.position;
 else if(!a.position_locked&&before&&!manualSocket&&!p.pins?.weapon_socket)p.joints.weapon_socket=[(before.root[0]+before.joints.weapon_socket[0]*before.facing-p.root[0])*p.facing,before.root[1]+before.joints.weapon_socket[1]-p.root[1]];
 if(a.rotation_locked)p.weapon.rotation=result.rotation;
 }return p;
}
function validate(p){const a=p.weapon.attachment;if(a===undefined)return;if(!a||typeof a.position_locked!=='boolean'||typeof a.rotation_locked!=='boolean'||(a.rotation_locked&&!a.position_locked)||!Number.isFinite(a.grip_rotation_offset)||Math.abs(a.grip_rotation_offset)>72000||!Array.isArray(a.position_offset)||a.position_offset.length!==2||!a.position_offset.every(v=>Number.isFinite(v)&&Math.abs(v)<10000))throw Error('Invalid weapon attachment.');apply(p);}
function mirror(out,p){if(p.hand_grips){out.hand_grips={};for(const [side,grip] of Object.entries(p.hand_grips))out.hand_grips[side==='left'?'right':'left']=M().clone(grip);if(out.hand_grips[M().weaponHand(out)])setLocks(out,false,false);}if(!p.weapon.attachment)return;const a=out.weapon.attachment;a.position_offset=[-p.weapon.attachment.position_offset[0],p.weapon.attachment.position_offset[1]];if(a.rotation_locked)a.grip_rotation_offset=out.weapon.rotation-handOrientation(out);else a.grip_rotation_offset=-p.weapon.attachment.grip_rotation_offset;apply(out);}
function compatible(a,b){const aa=attachment(a),ab=attachment(b);if(!a.hand_grips&&!b.hand_grips&&(aa.position_locked!==ab.position_locked||aa.rotation_locked!==ab.rotation_locked))throw Error('Blend needs matching weapon attachment modes.');}
function blend(out,a,b,t,definitions={}){
 const m=M(),aa=attachment(a),ab=attachment(b),chosen=t<.5?a:b,ac=attachment(chosen);compatible(a,b);
 if(a.weapon.attachment||b.weapon.attachment){out.weapon.attachment={position_locked:ac.position_locked,rotation_locked:ac.rotation_locked,grip_rotation_offset:m.blendAngle(aa.grip_rotation_offset,ab.grip_rotation_offset,t),position_offset:aa.position_offset.map((v,i)=>v+(ab.position_offset[i]-v)*t)};apply(out);}
 if(a.hand_grips||b.hand_grips){
  if(chosen.hand_grips)out.hand_grips=m.clone(chosen.hand_grips);else delete out.hand_grips;
  out.joints.weapon_socket=a.joints.weapon_socket.map((v,i)=>v+(b.joints.weapon_socket[i]-v)*t);
  for(const side of ['left','right']){const ga=a.hand_grips?.[side],gb=b.hand_grips?.[side];if(out.hand_grips?.[side]&&ga&&gb&&ga.mode!=='free'&&gb.mode!=='free')out.hand_grips[side].position=ga.position+(gb.position-ga.position)*t;}
  apply(out);if(!constrainGrips(out,{joints:m.clone(out.joints)},definitions))throw Error('Hand grip is unreachable between these keys. Add an intermediate pose.');
 }
}
const API={moveArmAtLengths,handRanges,nearestHandPosition,snapHand,solveHand,handMode,setHandMode,moveHand,constrainGrips,validateHands,gripPoint,gripPosition,constrainTransform,handOrientation,attachment,capture,setLocks,apply,validate,mirror,compatible,blend};global.SolAttachments=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
