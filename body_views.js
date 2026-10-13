(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const H=global.SolHeadHair||(typeof require==='function'?require('./head_hair.js'):null);
const approved=global.SolApprovedTurnaround||(typeof require==='function'?require('./approved_turnaround.js'):null);
const keys=['profile','three_quarter_front','front','three_quarter_back','back'];
const roots=['left_shoulder','right_shoulder','left_hip','right_hip'];
const defaultState=()=>({preset:'three_quarter_front',side:1,shoulders_locked:true,hips_locked:true});
const clone=o=>JSON.parse(JSON.stringify(o)),other=id=>id.replace(/^(left|right)_/,s=>s==='left_'?'right_':'left_');
function curve(points,prefix){return {closed:true,nodes:points.map((point,i)=>({id:prefix+'_'+i,point,in:[0,0],out:[0,0]}))};}
function defaults(r){
 const model=M(),sx=r.torso_size[0]/8,sy=r.torso_size[1]/13,hx=r.hip_size[0]/8,hy=r.hip_size[1]/6;
 const shoulder={};for(const side of ['left','right'])shoulder[side+'_shoulder']=model.rotate(model.sub(r.joints[side+'_shoulder'],r.joints.torso),-(r.neutral_torso_rotation||0));
 const neck=model.rotate(model.sub(r.joints.head,r.joints.torso),-(r.neutral_torso_rotation||0)),scarf=model.rotate(model.sub(r.joints.scarf_root,r.joints.torso),-(r.neutral_torso_rotation||0));
 const shoulderY=(shoulder.left_shoulder[1]+shoulder.right_shoulder[1])/2;
 const chest=points=>curve(points.map(v=>[v[0]*sx,v[1]*sy]),'view_chest'),pelvis=points=>curve(points.map(v=>[v[0]*hx,v[1]*hy]),'view_hip');
 const layers=['right_leg','right_arm','pelvis','torso','left_leg','left_arm','weapon','scarf'];
 function preset(id,width,hipWidth,chestPoints,hipPoints,details,order=layers){return {id,label:id.replaceAll('_',' '),scaffold:{left_shoulder:[-width*sx/2,shoulderY],right_shoulder:[width*sx/2,shoulderY],left_hip:[-hipWidth*hx/2,0],right_hip:[hipWidth*hx/2,0],head:[0,neck[1]],scarf_root:[0,scarf[1]]},outline:{chest:chest(chestPoints),pelvis:pelvis(hipPoints)},waist_anchor_ids:['view_chest_0','view_chest_'+(chestPoints.length-1)],art:{torso_details:details.map(points=>points.map(v=>[v[0]*sx,v[1]*sy])),head_marks:id==='back'?[]:id==='three_quarter_back'?[[[2,-1],[3,0]]]:id==='profile'?[[[2,-1],[4,-1],[4,1],[2,1]]]:[[[-2,-1],[-.8,-1]],[[.8,-1],[2,-1]]],scarf_collar:clone(r.parts?.scarf_collar||[[-2,-2],[4,-2],[4,2],[-2,2]])},layers:clone(order)};}
 const out={};
 out.profile=preset('profile',1.5,1.1,[[-1.5,0],[-1.8,-5],[-2.1,-11],[-1,-13],[1.2,-13],[3,-10],[2.5,-6],[1.7,0]],[[-1.5,-6],[-2,-3],[-1.5,1],[1.4,1],[2,-3],[1.7,-6]],[[[1.8,-10],[1.4,-5],[1.1,-1]]]);
 out.three_quarter_front={id:'three_quarter_front',label:'3/4 front',scaffold:{...shoulder,left_hip:clone(r.joints.left_hip),right_hip:clone(r.joints.right_hip),head:neck,scarf_root:scarf},outline:{chest:clone(r.curves?.chest||curve(r.torso_vertices,'chest')),pelvis:clone(r.curves?.pelvis||curve(r.hip_vertices,'hip'))},waist_anchor_ids:clone(r.waist_anchor_ids||['chest_0','chest_1']),art:{torso_details:[],head_marks:[],scarf_collar:clone(r.parts?.scarf_collar||[])},layers:clone(layers)};
 const wideChest=[[-2.6,0],[-2.9,-5],[-4.5,-9],[-4.1,-12],[0,-13],[4.1,-12],[4.5,-9],[2.9,-5],[2.6,0]],wideHip=[[-2.6,-6],[-4.2,-3.5],[-3.4,.7],[0,1.5],[3.4,.7],[4.2,-3.5],[2.6,-6]];
 out.front=preset('front',8.2,6.2,wideChest,wideHip,[[[-3.7,-9],[-1.5,-7],[0,-8],[1.5,-7],[3.7,-9]],[[0,-8],[0,-2]]],['pelvis','torso','right_leg','left_leg','right_arm','left_arm','weapon','scarf']);
 out.three_quarter_back=preset('three_quarter_back',5.7,3.6,[[-2.4,0],[-2.7,-5],[-3.4,-10],[-2.7,-13],[2.6,-12.5],[3.8,-9],[2.7,-5],[2.3,0]],[[-2.4,-6],[-3.5,-3],[-2.8,1],[.2,1.5],[3,1],[3.4,-3],[2.3,-6]],[[[-1.8,-11],[.3,-8],[2.2,-10]],[[.3,-8],[.3,-1]]],['left_leg','left_arm','pelvis','torso','right_leg','right_arm','scarf','weapon']);
 out.back=preset('back',8.2,6.2,[[-2.6,0],[-3,-5],[-4.5,-10],[-4.1,-12.4],[0,-13],[4.1,-12.4],[4.5,-10],[3,-5],[2.6,0]],wideHip,[[[-3.5,-11],[0,-8],[3.5,-11]],[[0,-11],[0,-1]]],['left_leg','right_leg','left_arm','right_arm','pelvis','torso','scarf','weapon']);
 for(const key of keys)out[key].head_hair=H.defaults(key);return out;
}
function approvedDefaults(r){const out=defaults(r);for(const key of keys)if(approved?.[key]){out[key].outline=clone(approved[key].outline);out[key].scaffold=clone(approved[key].scaffold);out[key].waist_anchor_ids=clone(approved[key].waist_anchor_ids);out[key].art.torso_details=[];out[key].art.head_marks=[];out[key].approved_trace_version=1;}return out;}

function state(p){return p.body_view||{...defaultState(),shoulders_locked:false,hips_locked:false};}
function data(r,p){const s=state(p);return (r.body_views||defaults(r))[s.preset];}
function point(v,side){return [v[0]*side,v[1]];}
function scaffold(r,p,s=state(p)){const d=(r.body_views||defaults(r))[s.preset],out={};for(const id of roots){const v=d.scaffold[s.side===-1?other(id):id],local=point(v,s.side);out[id]=id.endsWith('shoulder')?M().add(p.joints.torso,M().rotate(local,p.torso_rotation)):local;}for(const id of ['head','scarf_root'])out[id]=M().add(p.joints.torso,M().rotate(point(d.scaffold[id],s.side),p.torso_rotation));return out;}
function rootLocked(p,id){return !!p.body_view&&roots.includes(id)&&(id.endsWith('shoulder')?state(p).shoulders_locked:state(p).hips_locked);}
function rootsMatch(p,r){if(!p.body_view)return true;const target=scaffold(r,p);return roots.every(id=>!rootLocked(p,id)||M().dist(p.joints[id],target[id])<2e-5);}
function ensure(r){if(!r.body_views)r.body_views=defaults(r);return r.body_views;}
function retarget(p,r,next,snap=false,previousRig=r){
 if(!keys.includes(next.preset)||![-1,1].includes(next.side))throw Error('Unknown body view.');const before=clone(p),previous=state(before),q=clone(p),oldRoots=scaffold(previousRig,before,previous),target=scaffold(r,q,next);
 q.body_view=clone(next);
 for(const id of roots){const locked=id.endsWith('shoulder')?next.shoulders_locked:next.hips_locked,offset=locked||snap?[0,0]:M().sub(before.joints[id],oldRoots[id]),position=M().add(target[id],offset),delta=M().sub(position,before.joints[id]);q.joints[id]=position;const suffix=id.endsWith('shoulder')?['elbow','hand']:['knee','foot'];for(const part of suffix){const key=id.split('_')[0]+'_'+part;q.joints[key]=M().add(before.joints[key],delta);}}
 for(const id of ['head','scarf_root'])q.joints[id]=M().add(before.joints[id],M().sub(target[id],oldRoots[id]));
 for(const e of q.extra_segments||[])q.joints[e.end]=M().add(before.joints[e.end],M().sub(q.joints[e.start],before.joints[e.start]));
 if(M().attachments.attachment(q).position_locked){const hand=M().weaponHand(q)+'_hand';q.joints.weapon_socket=M().add(before.joints.weapon_socket,M().sub(q.joints[hand],before.joints[hand]));}
 M().attachments.apply(q,before);
 if(!M().enforcePins(q,r,before)||!rootsMatch(q,r)||!M().projection.retargetMatch(before,q)||(snap&&roots.some(id=>M().dist(q.joints[id],target[id])>2e-5)))return false;
 Object.assign(p,q);return true;
}
function displayRig(r,p){if(!p.body_view)return r;const d=data(r,p),s=state(p),mirror=c=>{const out=clone(c);for(const n of out.nodes)for(const field of ['point','in','out'])n[field]=point(n[field],s.side);return out;};return {...r,_view_display:true,curves:{...r.curves,...Object.fromEntries(Object.entries(d.outline).map(([key,c])=>[s.side===-1?other(key):key,mirror(c)]))},waist_anchor_ids:d.waist_anchor_ids,parts:{...r.parts,scarf_collar:d.art.scarf_collar.map(v=>point(v,s.side))}};}
function layers(r,p){const s=state(p),out=data(r,p).layers.map(id=>s.side===-1?other(id):id);out.splice(out.indexOf('torso')+1,0,'head');return out;}
function waistIDs(r,p){return p.body_view?data(r,p).waist_anchor_ids:r.waist_anchor_ids;}
function validateState(p){if(p.body_view===undefined)return;const s=p.body_view;if(!s||!keys.includes(s.preset)||![-1,1].includes(s.side)||typeof s.shoulders_locked!=='boolean'||typeof s.hips_locked!=='boolean')throw Error('Invalid body view state.');}
function validateRig(r){if(r.body_views===undefined)return;const views=r.body_views,vector=v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<10000),allowed=new Set(['left_arm','right_arm','left_leg','right_leg','pelvis','torso','weapon','scarf']);if(!views||Array.isArray(views)||Object.keys(views).length!==5)throw Error('Body views need five categories.');for(const key of keys){const d=views[key];H.validate(d?.head_hair);if(!d||d.id!==key)throw Error('Invalid body view definition.');for(const id of [...roots,'head','scarf_root'])if(!vector(d.scaffold?.[id]))throw Error('Invalid view scaffold.');for(const part of Object.keys(d.outline||{})){const c=d.outline?.[part];if(!c?.closed||!Array.isArray(c.nodes)||c.nodes.length<3||c.nodes.length>32)throw Error('Invalid view outline.');for(const n of c.nodes)for(const field of ['point','in','out'])if(!vector(n[field]))throw Error('Invalid view contour coordinate.');if(part==='chest'){const ids=c.nodes.map(n=>n.id);if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length||!Array.isArray(d.waist_anchor_ids)||d.waist_anchor_ids.length!==2||d.waist_anchor_ids[0]===d.waist_anchor_ids[1]||d.waist_anchor_ids.some(id=>!ids.includes(id)))throw Error('Invalid view waist anchors.');}}if(!Array.isArray(d.layers)||d.layers.length!==allowed.size||new Set(d.layers).size!==allowed.size||d.layers.some(id=>!allowed.has(id)))throw Error('Invalid view layers.');for(const field of ['torso_details','head_marks','scarf_collar']){const entries=d.art?.[field];if(!Array.isArray(entries)||entries.length>32)throw Error('Invalid view artwork.');if(field==='scarf_collar'){if(entries.some(v=>!vector(v)))throw Error('Invalid collar art.');}else for(const points of entries)if(!Array.isArray(points)||points.length<2||points.length>32||points.some(v=>!vector(v)))throw Error('Invalid body artwork.');}}}
function mirror(p){if(p.body_view)p.body_view.side*=-1;}
function blend(out,a,b,t){if(a.body_view||b.body_view)out.body_view={...clone(state(t<.5?a:b)),shoulders_locked:false,hips_locked:false};}
const API={approvedDefaults,approved,keys,roots,defaultState,defaults,state,data,scaffold,rootLocked,rootsMatch,ensure,retarget,displayRig,layers,waistIDs,validateState,validateRig,mirror,blend};global.SolBodyViews=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
