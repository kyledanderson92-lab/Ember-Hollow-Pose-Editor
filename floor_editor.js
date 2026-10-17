'use strict';
const floorModel=M.floor;
let floorSafePose=null,floorSafeContext='';
function floorContext(){return animationSelection+':'+selectedKeyId+':'+pose.name;}
function prepareFloorPose(){
 if(pose.floor?.enabled&&!floorModel.enforce(pose,rig)){
  const fallback=floorSafeContext===floorContext()?floorSafePose:currentKey()?.pose;
  if(fallback)pose=M.clone(fallback);
  status('Floor conflicts with a pinned foot, knee or leg reach. Move less, lower the floor, or adjust the pins.',true);
 }
 if(!floorModel.below(pose)){floorSafePose=M.clone(pose);floorSafeContext=floorContext();}
}
function floorControls(){const f=floorModel.settings(pose,rig);$('floor-enabled').checked=f.enabled;$('floor-height').value=Number(f.height.toFixed(4));for(const id of ['floor-enabled','floor-height','floor-below-feet'])$(id).disabled=animationExporting;}
function configureFloor(patch){
 animationAction(()=>{
  const f={...floorModel.settings(pose,rig),...patch,clearance:rig.limb_thickness/2};floorModel.validate({floor:f});
  const targets=[pose,...(currentAnimation()?.keys.map(k=>k.pose)||[])],copies=targets.map(p=>{const q=M.clone(p);q.floor=M.clone(f);if(!floorModel.enforce(q,rig))throw Error('Floor conflicts with a pinned foot, knee or leg reach. Lower the floor or adjust the pins.');return q;});
  targets.forEach((p,i)=>Object.assign(p,copies[i]));
 },patch.enabled===false?'Floor constraint off.':'Floor updated for '+(currentAnimation()?'this animation.':'this pose.'));
}
$('floor-enabled').onchange=()=>configureFloor({enabled:$('floor-enabled').checked});
$('floor-height').onchange=()=>configureFloor({height:Number($('floor-height').value)});
$('floor-below-feet').onclick=()=>configureFloor({height:Math.max(...['left_foot','right_foot'].map(id=>pose.root[1]+pose.joints[id][1]))+rig.limb_thickness/2});
const applyMoveBeforeFloor=applyMove;
applyMove=function(id,target,options={}){
 if(!pose.floor?.enabled)return applyMoveBeforeFloor(id,target,options);
 const before=M.clone(pose),aim=[...target];if(/^(left|right)_foot$/.test(id))aim[1]=Math.min(aim[1],pose.floor.height-pose.floor.clearance-pose.root[1]);
 const result=applyMoveBeforeFloor(id,aim,options);
 if(result===false||!floorModel.enforce(pose,rig,{chainIK:$('lock').checked})){pose=before;status('Floor or pinned anchors limit this move.',true);return false;}
 return result;
};
const syncBeforeFloor=syncAnimationDraft;
syncAnimationDraft=function(){const a=currentAnimation();if(a&&currentKey())floorModel.inherit(pose,a.keys[0].pose);prepareFloorPose();return syncBeforeFloor();};
function paintFloor(){
 let g=$('floor-guide');if(!g){g=elem('g',{id:'floor-guide','pointer-events':'none'},$('stage'));$('stage').insertBefore(g,$('ghost'));}g.replaceChildren();
 const f=pose.floor;if(!f?.enabled)return;const y=f.height*visualScale()+alignment.character_offset[1];
 elem('rect',{x:-1000000,y,width:2000000,height:2000000,fill:'#658987',opacity:.08},g);
 elem('line',{x1:-1000000,y1:y,x2:1000000,y2:y,stroke:'#a1d3ad','stroke-width':.45,'data-floor-height':f.height},g);
}
const controlsBeforeFloor=controls;controls=function(){controlsBeforeFloor();floorControls();};
const renderBeforeFloor=render;render=function(){prepareFloorPose();renderBeforeFloor();paintFloor();floorControls();};
controls();render();
