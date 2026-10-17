(function(global){
'use strict';
const model=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null),EPS=2e-5,feet=['left_foot','right_foot'];
function validate(p){if(p.floor===undefined)return;const f=p.floor;if(!f||typeof f.enabled!=='boolean'||!Number.isFinite(f.height)||Math.abs(f.height)>5000||!Number.isFinite(f.clearance)||f.clearance<0||f.clearance>100)throw Error('Invalid floor constraint.');}
function settings(p,r){return p.floor||{enabled:false,height:Math.max(...feet.map(id=>p.root[1]+p.joints[id][1]))+r.limb_thickness/2,clearance:r.limb_thickness/2};}
function below(p){return !!p.floor?.enabled&&feet.some(id=>p.root[1]+p.joints[id][1]>p.floor.height-p.floor.clearance+EPS);}
function footTargets(p,r,id,chainIK){
 const M=model(),side=id.split('_')[0],key=side+'_leg',knee=side+'_knee',hip=side+'_hip',lowerOnly=!chainIK||p.pins?.[knee],base=p.joints[lowerOnly?knee:hip],end=p.joints[id],height=p.floor.height-p.floor.clearance-p.root[1],wanted=[end[0],Math.min(end[1],height)],targets=[wanted];
 let min,max;
 if(lowerOnly){const bounds=M.projection.lowerBounds(p,key);min=bounds.min;max=bounds.max;}
 else if(p.limb_modes?.[key]){const state=p.limb_modes[key],reach=Math.hypot(...state.vectors[1]);min=0;max=state.allow_extension===false?reach:state.stretch_segments?2000:reach+2000;}
 else{const upper=M.dist(p.joints[hip],p.joints[knee]),lower=M.dist(p.joints[knee],end);min=Math.abs(upper-lower);max=upper+lower;}
 for(const radius of [min,max]){
  if(radius<1e-8)continue;
  const delta=M.sub(wanted,base),length=Math.hypot(...delta),direction=length>1e-8?delta.map(v=>v/length):[0,-1];targets.push(M.add(base,direction.map(v=>v*radius)),[base[0],base[1]-radius]);
  const dy=height-base[1];if(Math.abs(dy)<=radius+EPS){const dx=Math.sqrt(Math.max(0,radius*radius-dy*dy));for(const sign of [-1,1])targets.push([base[0]+sign*dx,height]);}
 }
 return targets.filter(v=>v[1]<=height+EPS).sort((a,b)=>M.dist(a,wanted)-M.dist(b,wanted));
}
// Solve on a clone so impossible floor/pin combinations never partially edit a pose.
function enforce(p,r,{chainIK=true,sampling=false}={}){
 if(!p.floor?.enabled||!below(p))return true;
 const M=model(),q=M.clone(p),pins=M.clone(q.pins||{});if(sampling)q.pins={};
 for(const id of feet){
  if(q.root[1]+q.joints[id][1]<=q.floor.height-q.floor.clearance+EPS)continue;
  if(q.pins?.[id])return false;
  let solved=null;
  for(const target of footTargets(q,r,id,chainIK)){
   const candidate=M.clone(q),useChain=chainIK&&!candidate.pins?.[id.replace('foot','knee')];
   if(M.chains.move(candidate,r,id,target,useChain)&&candidate.root[1]+candidate.joints[id][1]<=candidate.floor.height-candidate.floor.clearance+EPS&&M.projection.pinsMatch(candidate,q)){solved=candidate;break;}
  }
  if(!solved)return false;Object.assign(q,solved);
 }
 q.pins=pins;if(below(q))return false;Object.assign(p,q);return true;
}
function sample(p){if(p.floor?.enabled&&!enforce(p,model().defaultRig(),{sampling:true}))throw Error('Floor cannot be reached with these leg lengths. Lower the floor or adjust the pose.');return p;}
function inherit(p,source){if(source.floor)p.floor=model().clone(source.floor);else delete p.floor;return p;}
function validateSequence(a){const spec=JSON.stringify(a.keys[0].pose.floor||null);if(a.keys.some(k=>JSON.stringify(k.pose.floor||null)!==spec))throw Error('Floor settings must be shared across animation keys.');}
const API={validate,settings,below,enforce,sample,inherit,validateSequence};global.SolFloor=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
