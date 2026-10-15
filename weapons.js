(function(global){
'use strict';
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const gripCenter=2.5;
function enabled(p){return p.weapon.visible!==false;}
// All vector artwork shares a five-unit grip. The origin is its midpoint.
function tipLocal(p,definitions={}){const length=M().projection.length(p,definitions),start=p.weapon.kind==='sword'?3:p.weapon.kind==='baton'?2:7.8;return [0,-length-start-gripCenter];}
function tip(p,definitions={}){return M().add(p.joints.weapon_socket,M().rotate(tipLocal(p,definitions),p.weapon.rotation));}
function setAngle(p,angle,gripOffset=null){if(!Number.isFinite(angle))throw Error('Weapon angle must be finite.');const a=M().attachments.attachment(p);if(enabled(p)&&a.position_locked){const side=M().weaponHand(p),grip=gripOffset??(a.rotation_locked?a.grip_rotation_offset:p.weapon.rotation-M().attachments.handOrientation(p));p.hand_rotations[side]=M().wrap(angle-M().projection.lowerAngle(p,side+'_arm')-grip);}p.weapon.rotation=angle;M().attachments.apply(p);return p;}
function movement(p){return p.weapon.movement||'normal';}
function setMovement(p,value,definitions={}){if(!['normal','depth','free','stretch'].includes(value))throw Error('Invalid weapon movement mode.');p.weapon.movement=value;if(value==='depth')p.weapon.projected_length=Math.min(M().projection.length(p,definitions),M().projection.baseline(p,definitions));return true;}
// The displayed base control sits behind the physical grip, away from the hand.
const baseControlDistance=11;
function baseControl(p){return M().add(p.joints.weapon_socket,M().rotate([0,baseControlDistance],p.weapon.rotation));}
function bindings(p){
 const m=M(),a=m.attachments,items=[];for(const side of ['left','right']){const grip=p.hand_grips?.[side];if(grip&&grip.mode!=='free')items.push({side,mode:grip.mode,local:[0,-grip.position]});else if(!grip&&side===m.weaponHand(p)&&a.attachment(p).position_locked)items.push({side,mode:'grip',local:m.rotate(m.sub(p.joints[side+'_hand'],p.joints.weapon_socket),-p.weapon.rotation),legacy:true});}return items;
}
function armLimit(p,binding,chainIK,handsOnly=false){
 const m=M(),side=binding.side,id=side+'_hand';if((!chainIK&&!handsOnly)||p.pins?.[id])return {center:p.joints[id],min:0,max:0};
 if(handsOnly)return {center:p.joints[side+'_elbow'],...m.projection.lowerBounds(p,side+'_arm')};
 const bones=m.projection.bones(p,side+'_arm'),lengths=bones.map(b=>m.dist(...b));
 if(p.pins?.[side+'_elbow'])return {center:p.joints[side+'_elbow'],min:lengths[1],max:lengths[1]};
 const state=p.limb_modes?.[side+'_arm'];if(!state)return {center:p.joints[side+'_shoulder'],min:Math.abs(lengths[0]-lengths[1]),max:lengths[0]+lengths[1]};
 const reach=Math.hypot(...state.vectors[1]),reference=[Math.hypot(...state.vectors[0]),m.dist(...state.vectors)],mode=m.projection.movement(p,side+'_arm');return {center:p.joints[side+'_shoulder'],min:reach*.1/Math.min(...reference),max:mode==='depth'?reach:mode==='stretch'?reach*1000/Math.max(...reference):reach+2000};
}
function sharedScale(p,projectedLength,definitions={}){
 if(projectedLength===undefined)return 1;const m=M(),grips=bindings(p).filter(b=>b.mode==='grip');if(!grips.length)return 1;
 let min=.1/m.projection.length(p,definitions),max=Infinity;for(const grip of grips){const key=grip.side+'_arm',bones=m.projection.bones(p,key),state=p.limb_modes?.[key];min=Math.max(min,...bones.map(b=>.1/m.dist(...b)));max=Math.min(max,...bones.map(b=>1000/m.dist(...b)));if(state&&!state.stretch_segments)max=Math.min(max,1/state.scale);}
 return Math.max(min,Math.min(max,projectedLength/m.projection.length(p,definitions)));
}
function scaleGrips(p,r,factor,sourceItems=bindings(p)){
 if(Math.abs(factor-1)<1e-9)return true;const m=M(),items=sourceItems.filter(b=>b.mode==='grip'),states={},changes={};
 for(const item of items){const key=item.side+'_arm';states[key]=p.limb_modes?.[key]?m.clone(p.limb_modes[key]):null;for(const e of m.chains.limbSegments(p,r,item.side+'_lower_arm'))changes[e.id]=e.current_length*factor;m.projection.removeMode(p,key);m.projection.clearGaps(p,key);if(!item.legacy)p.hand_grips[item.side].position*=factor;p.hand_scales??={};p.hand_scales[item.side]=(p.hand_scales[item.side]??1)*factor;}
 if(!m.chains.setLengths(p,r,changes))return false;
 for(const [key,state] of Object.entries(states))if(state){try{m.projection.capture(p,key);}catch{return false;}const next=p.limb_modes[key],scale=state.scale*factor;next.vectors=next.vectors.map(v=>v.map(n=>n/scale));next.scale=scale;if(state.allow_extension!==undefined)next.allow_extension=state.allow_extension;if(state.stretch_segments)next.stretch_segments=true;}
 return true;
}
function moveGripArm(p,r,side,target,holdLengths,freeGaps){
 const m=M(),key=side+'_arm',state=p.limb_modes?.[key];
 if(freeGaps&&m.projection.movement(p,key)==='free'){const reach=Math.hypot(...state.vectors[1])*state.scale;if(m.dist(p.joints[side+'_shoulder'],target)>=reach-1e-6){const scale=state.scale;state.vectors=state.vectors.map(v=>v.map(n=>n*scale));state.scale=1;if(!m.chains.move(p,r,side+'_hand',target,true))return false;const next=p.limb_modes[key];next.vectors=next.vectors.map(v=>v.map(n=>n/scale));next.scale=scale;return true;}state.gaps=[0,0];m.projection.applyGeometry(p,key);return m.attachments.moveArmAtLengths(p,r,side,target);}
 return holdLengths?m.attachments.moveArmAtLengths(p,r,side,target):m.chains.move(p,r,side+'_hand',target,true);
}
function dragCandidate(before,r,socket,rotation,projectedLength,chainIK,definitions,coupled=false,fixedLengths=false,handsOnly=false){
 const m=M(),a=m.attachments,q=m.clone(before),items=bindings(before),originalAttachment=before.weapon.attachment?m.clone(before.weapon.attachment):null,factor=coupled?sharedScale(before,projectedLength,definitions):1;
 q.weapon.rotation=rotation;if(coupled&&projectedLength!==undefined)projectedLength=m.projection.length(before,definitions)*factor;if(projectedLength!==undefined)q.weapon.projected_length=projectedLength;q.joints.weapon_socket=[...socket];
 if(coupled){q.weapon.attachment={...a.attachment(q),position_locked:false,rotation_locked:false};if(!scaleGrips(q,r,factor,items))return null;for(const item of items)if(item.mode==='grip')item.local=item.local.map(n=>n*factor);q.joints.weapon_socket=[...socket];}
 // The weapon is the driven object during this solve, including legacy grips.
 q.weapon.attachment={...a.attachment(q),position_locked:false,rotation_locked:false};for(const item of items)if(item.legacy){q.hand_grips??={};q.hand_grips[item.side]={mode:'grip',position:-item.local[1]};}
 for(let pass=0;pass<3;pass++){
  const limits=[];for(const item of items){let local=item.local;
   if(item.mode==='slide'){const wanted=a.gripPosition(q,before.joints[item.side+'_hand']),position=a.nearestHandPosition(q,r,item.side,wanted,definitions);if(position===undefined)return null;q.hand_grips[item.side].position=position;local=[0,-position];}
   let bound=armLimit(before,item,chainIK,handsOnly);if(chainIK&&!handsOnly&&!before.pins?.[item.side+'_hand']&&(item.mode==='slide'||coupled||fixedLengths)){const bones=m.projection.bones(q,item.side+'_arm'),lengths=bones.map(b=>m.dist(...b));bound=before.pins?.[item.side+'_elbow']?{center:before.joints[item.side+'_elbow'],min:lengths[1],max:lengths[1]}:{center:q.joints[item.side+'_shoulder'],min:Math.abs(lengths[0]-lengths[1]),max:lengths[0]+lengths[1]};}if(chainIK&&!handsOnly&&!before.pins?.[item.side+'_hand']&&!before.pins?.[item.side+'_elbow']&&!fixedLengths&&movement(before)==='free'&&item.mode==='grip'&&m.projection.movement(q,item.side+'_arm')==='free'){bound={...bound,max:Math.hypot(...q.limb_modes[item.side+'_arm'].vectors[1])*q.limb_modes[item.side+'_arm'].scale+2000};}limits.push({...bound,center:m.sub(bound.center,m.rotate(local,rotation))});
  }
  if(before.pins?.weapon_socket)limits.push({center:before.joints.weapon_socket,min:0,max:0});
  const projected=m.chains.nearestReach(socket,limits);if(!projected)return null;q.joints.weapon_socket=projected;
 }
 const solvedSocket=[...q.joints.weapon_socket];
 for(const item of items){const id=item.side+'_hand';
  if(item.mode==='slide'){
   if(!chainIK&&!handsOnly&&!q.pins?.[id]){q.pins??={};q.pins[id]=true;}
   if(!a.snapHand(q,r,item.side,before.joints[id],definitions,false,!handsOnly))return null;
   q.pins=m.clone(before.pins||{});
  }else{
   const target=m.add(solvedSocket,m.rotate(item.local,rotation));if(m.dist(q.joints[id],target)>1e-5){if((!chainIK&&!handsOnly)||q.pins?.[id]||!(handsOnly?m.projection.moveLower(q,r,id,target):moveGripArm(q,r,item.side,target,coupled||fixedLengths||movement(before)==='free',movement(before)==='free'&&!fixedLengths))||m.dist(q.joints[id],target)>3e-5)return null;}
   q.hand_rotations[item.side]=m.wrap(rotation-m.projection.lowerAngle(q,item.side+'_arm'));
  }
  q.joints.weapon_socket=[...solvedSocket];q.weapon.rotation=rotation;
 }
 for(const item of items)if(item.legacy)delete q.hand_grips[item.side];if(!before.hand_grips)delete q.hand_grips;
 if(originalAttachment){q.weapon.attachment=originalAttachment;if(originalAttachment.position_locked)q.weapon.attachment.position_offset=m.sub(solvedSocket,q.joints[m.weaponHand(q)+'_hand']);}else delete q.weapon.attachment;
 setAngle(q,rotation);if(m.dist(q.joints.weapon_socket,solvedSocket)>3e-5||!m.projection.pinsMatch(q,before))return null;
 for(const item of items)if(!item.legacy){const grip=q.hand_grips[item.side];if(m.dist(q.joints[item.side+'_hand'],a.gripPoint(q,grip.position))>3e-5)return null;if(item.mode==='slide'&&!a.handRanges(q,r,item.side,definitions).some(([min,max])=>grip.position>=min-1e-5&&grip.position<=max+1e-5))return null;}
 return q;
}
function moveSocket(p,r,target,definitions={},chainIK=true,options={}){
 if(!enabled(p)||target.some(n=>!Number.isFinite(n)))return false;const m=M(),driver=bindings(p).find(b=>b.mode==='grip'),state=driver&&p.limb_modes?.[driver.side+'_arm'];let projected=p.weapon.projected_length,coupled=false;
 if(state&&!options.fixedLengths&&!options.handsOnly&&chainIK){const side=driver.side,root=p.joints[side+'_shoulder'],reach=m.projection.movement(p,side+'_arm')==='free'?Math.hypot(...state.vectors[1])*state.scale:m.dist(root,p.joints[side+'_hand']),aim=m.add(target,m.rotate(driver.local,p.weapon.rotation)),ratio=reach>1e-6?m.dist(root,aim)/reach:1;if(ratio<1-1e-6||state.stretch_segments||(state.scale<1-1e-6&&ratio>1)){projected=m.projection.length(p,definitions)*sharedScale(p,m.projection.length(p,definitions)*ratio,definitions);coupled=true;}}
 const q=dragCandidate(p,r,target,p.weapon.rotation,projected,chainIK,definitions,coupled,!!options.fixedLengths,!!options.handsOnly);if(!q)return false;Object.assign(p,q);return true;
}
function moveGrippedHand(p,r,side,target,definitions={},chainIK=true){
 const m=M(),binding=bindings(p).find(b=>b.side===side&&b.mode==='grip');if(!binding)return false;
 if(!chainIK){const q=dragCandidate(p,r,m.sub(target,m.rotate(binding.local,p.weapon.rotation)),p.weapon.rotation,p.weapon.projected_length,false,definitions,false,false,true);if(!q)return false;Object.assign(p,q);return true;}
 const state=p.limb_modes?.[side+'_arm'],root=p.joints[side+'_shoulder'],reach=state&&m.projection.movement(p,side+'_arm')==='free'?Math.hypot(...state.vectors[1])*state.scale:m.dist(root,p.joints[side+'_hand']),ratio=reach>1e-6?m.dist(root,target)/reach:1,shortening=state&&(ratio<1-1e-6||(state.scale<1-1e-6&&ratio>1)||m.projection.movement(p,side+'_arm')==='stretch');
 if(!shortening)return moveSocket(p,r,m.sub(target,m.rotate(binding.local,p.weapon.rotation)),definitions,chainIK);
 const projectedLength=m.projection.length(p,definitions)*sharedScale(p,m.projection.length(p,definitions)*ratio,definitions),factor=projectedLength/m.projection.length(p,definitions),socket=m.sub(target,m.rotate(binding.local.map(n=>n*factor),p.weapon.rotation)),q=dragCandidate(p,r,socket,p.weapon.rotation,projectedLength,chainIK,definitions,true);if(!q)return false;Object.assign(p,q);return true;
}
function moveTip(p,r,target,definitions={},chainIK=true,options={}){
 if(!enabled(p)||target.some(n=>!Number.isFinite(n)))return false;
 const m=M(),before=m.clone(p),distance=m.dist(before.joints.weapon_socket,target),mode=movement(before),items=bindings(before),hasGrip=items.some(b=>b.mode==='grip'),slideOnly=items.length>0&&!hasGrip,oldLength=m.projection.length(before,definitions),offset=Math.hypot(...tipLocal(before,definitions))-oldLength,limit=mode==='depth'?m.projection.baseline(before,definitions):mode==='free'&&hasGrip?Math.max(oldLength,m.projection.baseline(before,definitions)):1000,requested=mode==='normal'||slideOnly?oldLength:Math.max(.1,Math.min(limit,distance-offset)),coupled=mode!=='normal'&&hasGrip&&chainIK;
 let best=null,bestScore=Infinity,bestAngle=before.weapon.rotation;const stable=Number.isFinite(options.preferredRotation),preferred=stable?options.preferredRotation:before.weapon.rotation,desired=m.wrap(m.angle(before.joints.weapon_socket,target)-180);
 const solveLength=length=>{
  const projectedLength=coupled?oldLength*sharedScale(before,length,definitions):length,shape=m.clone(before);shape.weapon.projected_length=projectedLength;const localTip=tipLocal(shape,definitions),shares=coupled&&Math.abs(projectedLength-oldLength)>1e-8;
  const evaluate=rotation=>{const socket=m.sub(target,m.rotate(localTip,rotation)),q=dragCandidate(before,r,socket,rotation,projectedLength,chainIK,definitions,shares);if(!q)return false;const error=m.dist(tip(q,definitions),target),gap=mode==='free'&&hasGrip&&chainIK?items.filter(b=>b.mode==='grip').reduce((sum,b)=>sum+m.projection.gaps(q.limb_modes?.[b.side+'_arm']).reduce((a,v)=>a+v,0),0):0,score=stable?error*error*1000+gap*gap*1e-6+m.wrap(rotation-preferred)**2*1e-4+m.wrap(rotation-desired)**2*5e-5:error*error+gap*gap*1e-4+(mode==='free'?1e-9:1e-7)*m.wrap(rotation-desired)**2;if(score<bestScore){best=q;bestScore=score;bestAngle=rotation;}return true;};
  let found=evaluate(desired);if(best&&m.dist(tip(best,definitions),target)<1e-5&&!(mode==='free'&&hasGrip&&chainIK)&&!stable)return true;
  found=evaluate(preferred)||found;found=evaluate(before.weapon.rotation)||found;if(stable)for(const delta of [-48,-24,-12,-4,4,12,24,48])found=evaluate(m.wrap(preferred+delta))||found;if(!stable||!best||m.dist(tip(best,definitions),target)>1e-4)for(let angle=-180;angle<180;angle+=10)found=evaluate(angle)||found;
  for(const step of [2,0.4,0.08]){const center=bestAngle,radius=stable?3:5;for(let i=-radius;i<=radius;i++)found=evaluate(m.wrap(center+i*step))||found;}return found;
 };
 if(!solveLength(requested)&&coupled&&Math.abs(requested-oldLength)>1e-7){if(solveLength(oldLength)){let valid=oldLength,invalid=requested;for(let i=0;i<9;i++){const mid=(valid+invalid)/2;if(solveLength(mid))valid=mid;else invalid=mid;}}}
 if(!best)return false;Object.assign(p,best);return true;
}
function validate(p){if(p.weapon.movement!==undefined&&!['normal','depth','free','stretch'].includes(p.weapon.movement))throw Error('Invalid weapon movement mode.');if(p.weapon.visible!==undefined&&typeof p.weapon.visible!=='boolean')throw Error('Weapon visibility must be true or false.');}
const API={baseControl,baseControlDistance,bindings,moveGrippedHand,moveSocket,movement,setMovement,setAngle,gripCenter,enabled,tipLocal,tip,moveTip,validate};global.SolWeapons=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
