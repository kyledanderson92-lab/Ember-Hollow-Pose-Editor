(function(global){
'use strict';
const K=global.SolScarf||(typeof require==='function'?require('./scarf.js'):null);
const E=global.SolVFX||(typeof require==='function'?require('./vfx.js'):null);
const W=global.SolWeapons||(typeof require==='function'?require('./weapons.js'):null);
const F=global.SolProjection||(typeof require==='function'?require('./projection.js'):null);
const S=global.SolAnimation||(typeof require==='function'?require('./animation.js'):null);
const A=global.SolAttachments||(typeof require==='function'?require('./attachments.js'):null);
const C=global.SolChains||(typeof require==='function'?require('./chains.js'):null);
const R=global.SolReference||(typeof require==='function'?require('./reference.js'):null);
const P=global.SolProportions||(typeof require==='function'?require('./proportions.js'):null);
const clone=o=>JSON.parse(JSON.stringify(o));
const names=['torso','head','left_shoulder','left_elbow','left_hand','right_shoulder','right_elbow','right_hand','left_hip','left_knee','left_foot','right_hip','right_knee','right_foot','scarf_root','weapon_socket'];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dist=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b)=>Math.atan2(b[0]-a[0],b[1]-a[1])* -180/Math.PI;
const endpoint=(a,length,deg)=>add(a,[-Math.sin(deg*Math.PI/180)*length,Math.cos(deg*Math.PI/180)*length]);
const wrap=a=>((a+180)%360+360)%360-180;
function rotate(v,deg){const a=deg*Math.PI/180;return [v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];}
function weaponHand(p){return p.weapon_hand||'right';}
function packBackups(list){return {type:'geometric_sol_backups',version:1,projects:clone(list)};}

function unpackBackups(v){return clone(Array.isArray(v)?v:v.projects||[]);}

function defaultRig(){return clone(global.SolRuntimeRig||(typeof require==='function'?require('./runtime_rig.js'):null));}
function defaultPose(r,name='idle'){return {type:'geometric_sol_pose',version:1,name,scarf:clone(r.neutral_scarf||K.defaults(r)),pins:{},root:clone(r.neutral_root||[0,0]),facing:r.neutral_facing??1,body_facing:r.neutral_body_facing??1,joints:clone(r.joints),weapon_hand:r.weapon_hand||'right',torso_rotation:r.neutral_torso_rotation||0,head_rotation:r.neutral_head_rotation??0,hand_rotations:clone(r.neutral_hand_rotations||{left:0,right:0}),foot_rotations:clone(r.neutral_foot_rotations||{left:0,right:0}),weapon:{...(r.neutral_weapon_visible===false?{visible:false}:{}),kind:r.neutral_weapon_kind||'sword',layer:r.neutral_weapon_layer||'front',rotation:r.weapon_rotation??132,...(r.neutral_weapon_attachment?{attachment:clone(r.neutral_weapon_attachment)}:{})},notes:''};}
function rigFromPose(r,p){const out=clone(r);out.joints=clone(p.joints);out.neutral_root=clone(p.root);out.neutral_facing=p.facing;out.neutral_torso_rotation=p.torso_rotation;out.weapon_hand=weaponHand(p);out.weapon_rotation=p.weapon.rotation;return out;}
function exportPose(p){const o=JSON.parse(JSON.stringify(p,(_,v)=>typeof v==='number'?Math.round(v*1e6)/1e6:v));A.apply(o);o.rotations={};for(const side of ['left','right'])for(const limb of ['arm','leg']){
 const ids=limb==='arm'?[side+'_shoulder',side+'_elbow',side+'_hand']:[side+'_hip',side+'_knee',side+'_foot'];
 const bones=F.bones(o,side+'_'+limb),upper=angle(...bones[0]),lower=angle(...bones[1]);
 o.rotations[side+'_upper_'+limb]=wrap(upper-o.torso_rotation*(limb==='arm'?1:0));o.rotations[side+'_lower_'+limb]=wrap(lower-upper);
 }o.weapon.position=clone(o.joints.weapon_socket);o.scarf_root=clone(o.joints.scarf_root);
 return JSON.parse(JSON.stringify(o,(_,v)=>typeof v==='number'?Math.round(v*1e6)/1e6:v));}
function ik(a,target,l1,l2,old){const delta=sub(target,a),raw=Math.hypot(...delta),d=Math.max(Math.abs(l1-l2)+1e-6,Math.min(l1+l2-1e-6,raw));const u=raw>1e-9?delta.map(v=>v/raw):[0,1],v=[-u[1],u[0]],x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));const candidates=[1,-1].map(sign=>add(a,add(u.map(t=>t*x),v.map(t=>t*h*sign))));const joint=dist(candidates[0],old)<=dist(candidates[1],old)?candidates[0]:candidates[1];return {joint,end:add(a,u.map(t=>t*d))};}
function move(p,r,id,target,lock=true){if(/_(shoulder|hip)$/.test(id))return C.moveBody(p,r,id,target);const j=p.joints,previous=clone(j),old=j[id];if(!old)return;
 if(lock&&/_(hand|foot)$/.test(id)){
 const side=id.split('_')[0],arm=id.endsWith('hand'),base=side+(arm?'_shoulder':'_hip'),mid=side+(arm?'_elbow':'_knee');const result=ik(j[base],target,dist(previous[base],previous[mid]),dist(previous[mid],previous[id]),j[mid]);j[mid]=result.joint;j[id]=result.end;
 }else if(lock&&/_(elbow|knee)$/.test(id)){
 const side=id.split('_')[0],arm=id.endsWith('elbow'),base=side+(arm?'_shoulder':'_hip'),end=side+(arm?'_hand':'_foot');j[id]=endpoint(j[base],dist(previous[base],previous[id]),angle(j[base],target));j[end]=endpoint(j[id],dist(previous[id],previous[end]),angle(old,j[end]));
 }else{
 j[id]=clone(target);const delta=sub(target,old);
 let follow=[];if(id==='torso')follow=['head','left_shoulder','left_elbow','left_hand','right_shoulder','right_elbow','right_hand','scarf_root','weapon_socket'];
 if(id.endsWith('_shoulder'))follow=[id.replace('shoulder','elbow'),id.replace('shoulder','hand')];if(id.endsWith('_hip'))follow=[id.replace('hip','knee'),id.replace('hip','foot')];
 for(const key of follow)j[key]=add(j[key],delta);
 }
 if(id!=='weapon_socket'&&id!=='torso')j.weapon_socket=add(j[weaponHand(p)+'_hand'],sub(previous.weapon_socket,previous[weaponHand(p)+'_hand']));
}
function resizeRig(r,key,value){const before=clone(r),p=defaultPose(r);r[key]=value;for(const side of ['left','right'])for(const limb of ['arm','leg']){const ids=limb==='arm'?['shoulder','elbow','hand']:['hip','knee','foot'];const up='upper_'+limb+'_length',lo='lower_'+limb+'_length';if(key===up||key===lo){const keys=ids.map(id=>side+'_'+id);p.joints[keys[1]]=endpoint(p.joints[keys[0]],r[up],angle(before.joints[keys[0]],before.joints[keys[1]]));p.joints[keys[2]]=endpoint(p.joints[keys[1]],r[lo],angle(before.joints[keys[1]],before.joints[keys[2]]));}}p.joints.weapon_socket=clone(p.joints[weaponHand(p)+'_hand']);r.joints=p.joints;}

function validate(input){const o=clone(input);
 if(!o||typeof o!=='object')throw Error('Expected a Sol project, animation, rig or pose.');
 if(o.type==='geometric_sol_animation')return S.validate(o);
 if(o.type==='geometric_sol_project'){if(o.version!==1||!Array.isArray(o.poses)||o.poses.length>500)throw Error('Invalid version 1 project.');o.rig=validate(o.rig);o.current_pose=validate(o.current_pose);o.poses=o.poses.map(validate);if(o.rig.type!=='geometric_sol_rig'||o.current_pose.type!=='geometric_sol_pose'||o.poses.some(p=>p.type!=='geometric_sol_pose'))throw Error('Project needs a rig and poses.');if(new Set(o.poses.map(p=>p.name)).size!==o.poses.length)throw Error('Duplicate pose names.');if(o.reference!==undefined)o.reference=R.validate(o.reference);if(o.alignment!==undefined)o.alignment=R.alignment(o.alignment);S.validateWorkspace(o);return o;}
 if(o.version!==1||!['geometric_sol_rig','geometric_sol_pose'].includes(o.type))throw Error('Expected a version 1 rig or pose.');
 const vector=(v,label)=>{if(!Array.isArray(v)||v.length!==2||!v.every(n=>Number.isFinite(n)&&Math.abs(n)<10000))throw Error('Invalid '+label+' coordinates.');};
 const number=(v,label,min=-36000)=>{if(!Number.isFinite(v)||v<min||v>10000)throw Error('Invalid '+label+'.');};
 if(o.type==='geometric_sol_rig'){
  if(o.presentation_style!=='neon_stick')throw Error('This editor uses the neon stick rig. Import the new stick action project.');
  for(const key of ['head_radius','upper_arm_length','lower_arm_length','upper_leg_length','lower_leg_length','limb_thickness','overall_scale'])number(o[key],key,.1);
  for(const key of ['body_fill','line','rear','energy','scarf'])if(!/^#[0-9a-f]{6}$/i.test(o.colors?.[key]))throw Error('Invalid '+key+' color.');
  vector(o.neutral_root||[0,0],'neutral root');
 }else{
  if(typeof o.name!=='string'||!o.name.trim()||o.name.length>100)throw Error('Pose needs a name (1–100 characters).');
  vector(o.root,'root');if(![1,-1].includes(o.facing))throw Error('Facing must be 1 or -1.');
  if(o.weapon_hand!==undefined&&!['left','right'].includes(o.weapon_hand))throw Error('Invalid weapon hand.');
  number(o.torso_rotation,'torso rotation');number(o.head_rotation??0,'head rotation');
  if(!['baton','sword','hammer'].includes(o.weapon?.kind))throw Error('Invalid weapon kind.');number(o.weapon.rotation,'weapon rotation');
  o.weapon.layer??='front';if(!['front','behind'].includes(o.weapon.layer))throw Error('Invalid weapon layer.');
  o.head_rotation??=0;o.hand_rotations??={left:0,right:0};o.foot_rotations??={left:0,right:0};for(const side of ['left','right']){number(o.hand_rotations[side],'hand angle');number(o.foot_rotations[side],'foot angle');}
  o.notes=typeof o.notes==='string'?o.notes:'';o.pins??={};if(!o.pins||typeof o.pins!=='object'||Array.isArray(o.pins))throw Error('Invalid pins.');for(const [id,v] of Object.entries(o.pins))if(!(id==='pelvis'||Object.hasOwn(o.joints||{},id))||typeof v!=='boolean')throw Error('Invalid pin.');
  if(o.hand_scales!==undefined){if(!o.hand_scales||typeof o.hand_scales!=='object'||Array.isArray(o.hand_scales)||Object.entries(o.hand_scales).some(([side,v])=>!['left','right'].includes(side)||!Number.isFinite(v)||v<=0||v>10000))throw Error('Invalid hand scales.');}C.validate(o);A.validate(o);A.validateHands(o);W.validate(o);E.validatePose(o);K.validate(o);F.validate(o);
 }
 for(const id of names)vector(o.joints?.[id],id);
 C.attachRoots(o);
 for(const key of ['parts','curves','body_views','body_view','reference','head_hair','waist_anchor_ids','outline_thickness','template','definition_version','part_dimensions','torso_vertices','hip_vertices','body_layout'])delete o[key];
 return o;
}
function exportRig(r){const out=clone(r);out.bone_lengths={};for(const side of ['left','right'])for(const limb of ['arm','leg']){const ids=limb==='arm'?[side+'_shoulder',side+'_elbow',side+'_hand']:[side+'_hip',side+'_knee',side+'_foot'];out.bone_lengths[side+'_upper_'+limb]=dist(r.joints[ids[0]],r.joints[ids[1]]);out.bone_lengths[side+'_lower_'+limb]=dist(r.joints[ids[1]],r.joints[ids[2]]);}return out;}
function mirrorPose(p){const o=clone(p),flip=v=>[-v[0],v[1]];for(const [id,v] of Object.entries(p.joints)){const opposite=id.startsWith('left_')?id.replace('left_','right_'):id.startsWith('right_')?id.replace('right_','left_'):id;o.joints[opposite]=flip(v);}if(A.attachment(p).position_locked)o.joints.weapon_socket=add(o.joints[weaponHand(p)+'_hand'],flip(sub(p.joints.weapon_socket,p.joints[weaponHand(p)+'_hand'])));o.body_facing=-(p.body_facing??1);o.root=flip(p.root);o.torso_rotation=-p.torso_rotation;o.head_rotation=-p.head_rotation;o.weapon.rotation=-p.weapon.rotation;o.foot_rotations={left:-p.foot_rotations.right,right:-p.foot_rotations.left};if(p.hand_scales)o.hand_scales={left:p.hand_scales.right??1,right:p.hand_scales.left??1};o.hand_rotations={left:-(p.hand_rotations?.right||0)||0,right:-(p.hand_rotations?.left||0)||0};o.pins={};for(const [id,v] of Object.entries(p.pins||{}))o.pins[id.startsWith('left_')?id.replace('left_','right_'):id.replace('right_','left_')]=v;C.mirror(o,p);F.mirror(o,p);E.mirror(o,p);K.mirror(o,p);A.mirror(o,p);return o;}
function copyLimb(p,source,side,limb){const ids=limb==='arm'?[side+'_shoulder',side+'_elbow',side+'_hand']:[side+'_hip',side+'_knee',side+'_foot'];const offset=sub(p.joints[ids[0]],source.joints[ids[0]]);const before=clone(p.joints[weaponHand(p)+'_hand']);for(const id of ids.slice(1))p.joints[id]=add(source.joints[id],offset);if(limb==='leg')p.foot_rotations[side]=source.foot_rotations[side];else{p.hand_rotations??={left:0,right:0};p.hand_rotations[side]=source.hand_rotations?.[side]||0;}if(limb==='arm'){if(source.hand_scales){p.hand_scales??={};p.hand_scales[side]=source.hand_scales[side]??1;}else if(p.hand_scales)delete p.hand_scales[side];if(source.hand_grips?.[side]){p.hand_grips??={};p.hand_grips[side]=clone(source.hand_grips[side]);if(side===weaponHand(p))A.setLocks(p,false,false);}else if(p.hand_grips)delete p.hand_grips[side];}F.clearGaps(p,side+'_'+limb);if(source.limb_gaps?.[side+'_'+limb]){p.limb_gaps??={};p.limb_gaps[side+'_'+limb]=clone(source.limb_gaps[side+'_'+limb]);}if(source.limb_modes?.[side+'_'+limb]){p.limb_modes??={};p.limb_modes[side+'_'+limb]=clone(source.limb_modes[side+'_'+limb]);}else F.removeMode(p,side+'_'+limb);if(side===weaponHand(p)&&limb==='arm')p.joints.weapon_socket=add(p.joints[weaponHand(p)+'_hand'],sub(p.joints.weapon_socket,before));}
function swapLimbs(p,kind='all',r=null){if(!['all','arm','leg'].includes(kind))throw Error('Choose arms, legs or all limbs.');const before=clone(p);C.swap(p,kind);F.swap(p,before,kind);if(kind!=='leg'&&before.hand_scales)p.hand_scales={left:before.hand_scales.right??1,right:before.hand_scales.left??1};if(kind!=='leg'&&before.hand_grips){p.hand_grips={};for(const side of ['left','right']){const source=side==='left'?'right':'left';if(before.hand_grips[source])p.hand_grips[side]=clone(before.hand_grips[source]);}if(p.hand_grips[weaponHand(p)])A.setLocks(p,false,false);}for(const limb of kind==='all'?['arm','leg']:[kind])for(const side of ['left','right']){const other=side==='left'?'right':'left',ids=limb==='arm'?['shoulder','elbow','hand']:['hip','knee','foot'];for(const id of ids)p.joints[side+'_'+id]=clone(before.joints[other+'_'+id]);if(limb==='leg')p.foot_rotations[side]=before.foot_rotations[other];else{p.hand_rotations??={left:0,right:0};p.hand_rotations[side]=before.hand_rotations?.[other]||0;}}if(kind!=='leg'&&A.attachment(p).position_locked)p.joints.weapon_socket=add(before.joints.weapon_socket,sub(p.joints[weaponHand(p)+'_hand'],before.joints[weaponHand(p)+'_hand']));}
function flipBend(p,side,limb){const ids=limb==='arm'?[side+'_shoulder',side+'_elbow',side+'_hand']:[side+'_hip',side+'_knee',side+'_foot'];const a=p.joints[ids[0]],b=p.joints[ids[2]],mid=p.joints[ids[1]],d=sub(b,a),len=Math.hypot(...d);if(len<1e-8)return false;const u=d.map(v=>v/len),v=sub(mid,a),projection=add(a,u.map(t=>t*(v[0]*u[0]+v[1]*u[1])));p.joints[ids[1]]=sub(projection.map(t=>2*t),mid);if(p.limb_gaps?.[side+'_'+limb])p.limb_gaps[side+'_'+limb].offsets=p.limb_gaps[side+'_'+limb].offsets.map(v=>[-v[0],v[1]]);if(p.limb_modes?.[side+'_'+limb])F.capture(p,side+'_'+limb);return true;}
function enforcePins(p,r,before){return C.enforcePins(p,r,before)&&A.constrainGrips(p,r);}
function exportProject(r,p,saved,reference=null,workspace=null){return {...(reference?{reference:R.validate(reference)}:{}),...(workspace?.alignment?.character_offset?.some(v=>v!==0)?{alignment:R.alignment(workspace.alignment)}:{}),...(workspace&&(Object.keys(workspace.animations||{}).length||Object.keys(workspace.weaponDefinitions||{}).length)?{animations:Object.values(workspace.animations||{}).map(a=>({...clone(a),keys:a.keys.map(k=>({...clone(k),pose:exportPose(k.pose)}))})),weapon_definitions:Object.values(workspace.weaponDefinitions||{}).map(clone)}:{}),type:'geometric_sol_project',version:1,rig:exportRig(r),current_pose:exportPose(p),poses:Object.keys(saved).sort().map(name=>exportPose(saved[name]))};}
function blendAngle(a,b,t){return a+wrap(b-a)*t;}
function blendPose(a,b,t,options={}){
 C.compatible(a,b);A.compatible(a,b);if(!Number.isFinite(t))throw Error('Blend amount must be finite.');t=Math.max(0,Math.min(1,t));
 if(a.facing!==b.facing)throw Error('Choose two poses with the same facing.');
 if(weaponHand(a)!==weaponHand(b))throw Error('Choose poses with the same weapon hand.');
 if(a.weapon.kind!==b.weapon.kind)throw Error('Choose two poses with the same weapon proxy.');
 const chains=[];for(const side of ['left','right'])for(const limb of ['arm','leg']){const ids=limb==='arm'?[side+'_shoulder',side+'_elbow',side+'_hand']:[side+'_hip',side+'_knee',side+'_foot'];const lengths=[0,1].map(i=>{const from=dist(a.joints[ids[i]],a.joints[ids[i+1]]),to=dist(b.joints[ids[i]],b.joints[ids[i+1]]);return from+(to-from)*t;});chains.push({ids,lengths,limb});}
 if(t===0)return clone(a);if(t===1)return clone(b);
 const lerp=(a,b)=>a+(b-a)*t,mix=(a,b)=>a.map((v,i)=>lerp(v,b[i]));
 const rotate=(v,deg)=>{const rad=deg*Math.PI/180;return [v[0]*Math.cos(rad)-v[1]*Math.sin(rad),v[0]*Math.sin(rad)+v[1]*Math.cos(rad)];};
 const out=clone(a);out.name='blend_preview';out.body_facing=(t<.5?a.body_facing:b.body_facing)??1;out.root=mix(a.root,b.root);out.pins={};out.torso_rotation=blendAngle(a.torso_rotation,b.torso_rotation,t);out.head_rotation=blendAngle(a.head_rotation,b.head_rotation,t);out.joints.torso=mix(a.joints.torso,b.joints.torso);
 for(const id of ['head','left_shoulder','right_shoulder','scarf_root']){const localA=rotate(sub(a.joints[id],a.joints.torso),-a.torso_rotation),localB=rotate(sub(b.joints[id],b.joints.torso),-b.torso_rotation);out.joints[id]=add(out.joints.torso,rotate(mix(localA,localB),out.torso_rotation));}
 for(const id of ['left_hip','right_hip'])out.joints[id]=mix(a.joints[id],b.joints[id]);
 for(const {ids,lengths,limb} of chains){const ua=angle(a.joints[ids[0]],a.joints[ids[1]]),ub=angle(b.joints[ids[0]],b.joints[ids[1]]),la=angle(a.joints[ids[1]],a.joints[ids[2]])-ua,lb=angle(b.joints[ids[1]],b.joints[ids[2]])-ub;const upper=limb==='arm'?blendAngle(ua-a.torso_rotation,ub-b.torso_rotation,t)+out.torso_rotation:blendAngle(ua,ub,t);const lower=upper+blendAngle(la,lb,t);out.joints[ids[1]]=endpoint(out.joints[ids[0]],lengths[0],upper);out.joints[ids[2]]=endpoint(out.joints[ids[1]],lengths[1],lower);}
 const foreA=angle(a.joints[weaponHand(a)+'_elbow'],a.joints[weaponHand(a)+'_hand']),foreB=angle(b.joints[weaponHand(b)+'_elbow'],b.joints[weaponHand(b)+'_hand']),foreOut=angle(out.joints[weaponHand(out)+'_elbow'],out.joints[weaponHand(out)+'_hand']);
 out.joints.weapon_socket=add(out.joints[weaponHand(out)+'_hand'],rotate(mix(rotate(sub(a.joints.weapon_socket,a.joints[weaponHand(a)+'_hand']),-foreA),rotate(sub(b.joints.weapon_socket,b.joints[weaponHand(b)+'_hand']),-foreB)),foreOut));
 out.hand_rotations={};for(const side of ['left','right'])out.hand_rotations[side]=blendAngle(a.hand_rotations?.[side]||0,b.hand_rotations?.[side]||0,t);out.weapon.layer=(t<.5?a.weapon.layer:b.weapon.layer)||'front';if((t<.5?a:b).weapon.visible===false)out.weapon.visible=false;else delete out.weapon.visible;out.weapon.rotation=blendAngle(a.weapon.rotation,b.weapon.rotation,t);for(const side of ['left','right'])out.foot_rotations[side]=blendAngle(a.foot_rotations[side],b.foot_rotations[side],t);
 if(a.hand_scales||b.hand_scales)out.hand_scales=Object.fromEntries(['left','right'].map(side=>[side,(a.hand_scales?.[side]??1)+((b.hand_scales?.[side]??1)-(a.hand_scales?.[side]??1))*t]));F.blend(out,a,b,t,options.weaponDefinitions||{});C.blend(out,a,b,t);A.blend(out,a,b,t,options.weaponDefinitions||{});E.blend(out,a,b,t);K.blend(out,a,b,t);delete out.rotations;delete out.weapon.position;delete out.scarf_root;return out;
}
const API={reference:R,proportions:P,scarf:K,vfx:E,weapons:W,animation:S,projection:F,attachments:A,chains:C,packBackups,unpackBackups,rigFromPose,rotate,weaponHand,blendAngle,blendPose,mirrorPose,swapLimbs,copyLimb,flipBend,enforcePins,exportProject,exportRig,clone,names,add,sub,dist,angle,endpoint,wrap,defaultRig,defaultPose,exportPose,ik,move,resizeRig,validate};global.SolModel=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
