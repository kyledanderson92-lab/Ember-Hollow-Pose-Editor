(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
function handOrientation(p){const side=M().weaponHand(p);return M().projection.lowerAngle(p,side+'_arm')+(p.hand_rotations?.[side]||0);}
function attachment(p){return p.weapon.attachment||{position_locked:true,rotation_locked:false,grip_rotation_offset:0,position_offset:M().sub(p.joints.weapon_socket,p.joints[M().weaponHand(p)+'_hand'])};}
function capture(p){const a=p.weapon.attachment||(p.weapon.attachment={...attachment(p)});a.grip_rotation_offset=p.weapon.rotation-handOrientation(p);a.position_offset=M().sub(p.joints.weapon_socket,p.joints[M().weaponHand(p)+'_hand']);return a;}
function setLocks(p,position,rotation){const a=p.weapon.attachment||(p.weapon.attachment={...attachment(p)}),wasPosition=a.position_locked,wasRotation=a.rotation_locked;if(rotation)position=true;if((position&&!wasPosition)||(rotation&&!wasRotation))capture(p);a.position_locked=position;a.rotation_locked=rotation&&position;}
function constrainTransform(position,rotation,parentPosition,parentRotation,state){return {position:state.position_locked?parentPosition.map((v,i)=>v+state.position_offset[i]):[...position],rotation:state.rotation_locked?parentRotation+state.grip_rotation_offset:rotation};}
// Small transform constraint shared by attachment modes. Rotation is independent
// of the position offset, matching the existing translational socket behavior.
function apply(p,before=null,manualSocket=false){const a=p.weapon.attachment;
 if(a){const hand=p.joints[M().weaponHand(p)+'_hand'];if(manualSocket&&a.position_locked)a.position_offset=M().sub(p.joints.weapon_socket,hand);const result=constrainTransform(p.joints.weapon_socket,p.weapon.rotation,hand,handOrientation(p),a);if(a.position_locked&&!p.pins?.weapon_socket)p.joints.weapon_socket=result.position;
 else if(!a.position_locked&&before&&!manualSocket&&!p.pins?.weapon_socket)p.joints.weapon_socket=[(before.root[0]+before.joints.weapon_socket[0]*before.facing-p.root[0])*p.facing,before.root[1]+before.joints.weapon_socket[1]-p.root[1]];
 if(a.rotation_locked)p.weapon.rotation=result.rotation;
 }return p;
}
function validate(p){const a=p.weapon.attachment;if(a===undefined)return;if(!a||typeof a.position_locked!=='boolean'||typeof a.rotation_locked!=='boolean'||(a.rotation_locked&&!a.position_locked)||!Number.isFinite(a.grip_rotation_offset)||Math.abs(a.grip_rotation_offset)>72000||!Array.isArray(a.position_offset)||a.position_offset.length!==2||!a.position_offset.every(v=>Number.isFinite(v)&&Math.abs(v)<10000))throw Error('Invalid weapon attachment.');apply(p);}
function mirror(out,p){if(!p.weapon.attachment)return;const a=out.weapon.attachment;a.position_offset=[-p.weapon.attachment.position_offset[0],p.weapon.attachment.position_offset[1]];if(a.rotation_locked)a.grip_rotation_offset=out.weapon.rotation-handOrientation(out);else a.grip_rotation_offset=-p.weapon.attachment.grip_rotation_offset;apply(out);}
function compatible(a,b){const aa=attachment(a),ab=attachment(b);if(aa.position_locked!==ab.position_locked||aa.rotation_locked!==ab.rotation_locked)throw Error('Blend needs matching weapon attachment modes.');}
function blend(out,a,b,t){const aa=attachment(a),ab=attachment(b);compatible(a,b);if(a.weapon.attachment||b.weapon.attachment){out.weapon.attachment={position_locked:aa.position_locked,rotation_locked:aa.rotation_locked,grip_rotation_offset:M().blendAngle(aa.grip_rotation_offset,ab.grip_rotation_offset,t),position_offset:aa.position_offset.map((v,i)=>v+(ab.position_offset[i]-v)*t)};apply(out);}}
const API={constrainTransform,handOrientation,attachment,capture,setLocks,apply,validate,mirror,compatible,blend};global.SolAttachments=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
