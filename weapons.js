(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const gripCenter=2.5;
function enabled(p){return p.weapon.visible!==false;}
// All vector artwork shares a five-unit grip. The origin is its midpoint.
function tipLocal(p,definitions={}){const length=M().projection.length(p,definitions),start=p.weapon.kind==='sword'?3:p.weapon.kind==='baton'?2:7.8;return [0,-length-start-gripCenter];}
function tip(p,definitions={}){return M().add(p.joints.weapon_socket,M().rotate(tipLocal(p,definitions),p.weapon.rotation));}
function setAngle(p,angle,gripOffset=null){if(!Number.isFinite(angle))throw Error('Weapon angle must be finite.');const a=M().attachments.attachment(p);if(enabled(p)&&a.position_locked){const side=M().weaponHand(p),grip=gripOffset??(a.rotation_locked?a.grip_rotation_offset:p.weapon.rotation-M().attachments.handOrientation(p));p.hand_rotations[side]=M().wrap(angle-M().projection.lowerAngle(p,side+'_arm')-grip);}p.weapon.rotation=angle;M().attachments.apply(p);return p;}
function moveTip(p,r,target,definitions={},moveArm=true){if(!enabled(p)||target.some(n=>!Number.isFinite(n)))return false;const before=M().clone(p),q=M().clone(p),socket=before.joints.weapon_socket,vector=M().sub(target,socket);if(Math.hypot(...vector)<.001)return false;let angle=M().wrap(M().angle(socket,target)-180);const attachment=M().attachments.attachment(q),grip=attachment.rotation_locked?attachment.grip_rotation_offset:before.weapon.rotation-M().attachments.handOrientation(before),hand=M().weaponHand(q)+'_hand';
 if(moveArm&&attachment.position_locked){const desiredSocket=M().sub(target,M().rotate(tipLocal(q,definitions),angle)),delta=M().sub(desiredSocket,socket);if(Math.hypot(...delta)>1e-7&&!M().chains.move(q,r,hand,M().add(q.joints[hand],delta),true))return false;M().attachments.apply(q,before);}
 // A locked grip is aimed by changing the wrist, preserving its authored offset.
 angle=M().wrap(M().angle(q.joints.weapon_socket,target)-180);setAngle(q,angle,grip);
 if(!M().enforcePins(q,r,before)||!M().projection.pinsMatch(q,before))return false;Object.assign(p,q);return true;
}
function validate(p){if(p.weapon.visible!==undefined&&typeof p.weapon.visible!=='boolean')throw Error('Weapon visibility must be true or false.');}
const API={setAngle,gripCenter,enabled,tipLocal,tip,moveTip,validate};global.SolWeapons=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
