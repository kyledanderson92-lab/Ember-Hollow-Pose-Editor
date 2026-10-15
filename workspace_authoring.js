'use strict';
// One posing workspace. Proportions are project data; alignment is view metadata.
function uiNode(tag,id,parent,text){const n=document.createElement(tag);if(id)n.id=id;if(text)n.textContent=text;if(parent)parent.append(n);return n;}
const proportionsPanel=$('rig-tools');
$('rig-settings-panel').querySelector('h2').textContent='Default segment lengths';
const proportionsOpen=uiNode('button','open-proportions',$('setup-menu-content'),'Default proportions…');
proportionsOpen.onclick=()=>{setCharacterPage('proportions');openEditorDialog('character-dialog');};
const linkedLabel=uiNode('label',null,$('rig-settings-panel')),linkedLengths=uiNode('input','link-default-lengths',linkedLabel);linkedLengths.type='checkbox';linkedLengths.checked=true;linkedLabel.append(' Match left/right lengths');
$('rig-controls').classList.add('proportions-grid');
const applyLengths=uiNode('button','apply-default-lengths',$('rig-settings-panel'),'Save defaults & update all poses');
$('runtime-rig').textContent='Fill original Sol lengths';
const proportionConflicts=uiNode('div','proportion-conflicts',$('rig-settings-panel'));proportionConflicts.hidden=true;
let proportionsSignature='';
function fillProportionFields(values){for(const id of M.proportions.ids)$('default-'+id).value=Number(values[id].toFixed(5));}
const proportionFieldOrder=['left_upper_arm','right_upper_arm','left_lower_arm','right_lower_arm','left_upper_leg','right_upper_leg','left_lower_leg','right_lower_leg','torso','neck'];
for(const id of proportionFieldOrder){
 const label=uiNode('label',null,$('rig-controls'),id==='neck'?'Neck / head spacing':friendly(id)),input=uiNode('input','default-'+id,label);input.type='number';input.min='.1';input.max='1000';input.step='.1';
 input.oninput=()=>{if(linkedLengths.checked&&/^(left|right)_/.test(id))$('default-'+id.replace(/^(left|right)_/,v=>v==='left_'?'right_':'left_')).value=input.value;};
}
const appearance=$('appearance-page');
for(const [key,label] of [['head_radius','Head radius'],['limb_thickness','Line width'],['overall_scale','Overall character scale']]){
 const row=uiNode('label',null,appearance,label),input=uiNode('input','appearance-'+key,row);input.type='number';input.min='.1';input.max='1000';input.step='.1';
 input.onchange=()=>{const v=Number(input.value);if(!Number.isFinite(v)||v<.1||v>1000){status('Use a value from 0.1 to 1000.',true);return;}snapshot();rig[key]=v;controls();library();render();};
}
$('runtime-rig').onclick=()=>{fillProportionFields(M.proportions.defaults(M.defaultRig()));status('Original lengths filled. Save defaults to keep them and update all poses.');};
applyLengths.onclick=()=>{
 proportionConflicts.replaceChildren();proportionConflicts.hidden=true;finishPreview();syncAnimationDraft();
 try{
  const changes=Object.fromEntries(M.proportions.ids.map(id=>[id,Number($('default-'+id).value)])),updated=M.proportions.apply(projectData(),changes);
  snapshot();rig=updated.rig;pose=updated.current_pose;saved=Object.assign(Object.create(null),Object.fromEntries(updated.poses.map(p=>[p.name,p])));animations=Object.assign(Object.create(null),Object.fromEntries((updated.animations||[]).map(a=>[a.id,a])));
  proportionsSignature='';library();controls();render();status(workspaceStorageHealthy?'Default lengths saved for this project and applied to every pose and animation key. One Undo restores the whole change.':'Default lengths updated in this tab. Browser storage is unavailable; export a project backup to keep them.',!workspaceStorageHealthy);
 }catch(e){status(e.message,true);if(e.proportionConflicts?.length){proportionConflicts.hidden=false;uiNode('p',null,proportionConflicts,'Each key has its own locks. Review the failing keys below; the visible pin panel only shows the selected key.');for(const failure of e.proportionConflicts){const row=uiNode('p',null,proportionConflicts,failure.label+': '+failure.reason);if(failure.animationId){const button=uiNode('button',null,row,'Review this key');button.onclick=()=>{$('character-dialog').close();syncAnimationDraft();animationSelection=failure.animationId;selectedKeyId=null;chooseKey(failure.keyId);setLibraryTab('animations');selectInspector('body');};}}}}
};
// Reference controls and the alignment tool are always independent from keys.
const referencePanel=uiNode('section','reference-panel',$('reference-dialog'));
const referenceOpen=uiNode('button','open-reference',$('setup-menu-content'),'Reference image…');referenceOpen.onclick=()=>{openEditorDialog('reference-dialog');};
const loadReference=uiNode('button','load-reference',referencePanel,'Load reference image…'),referenceFile=uiNode('input','reference-file',referencePanel);referenceFile.type='file';referenceFile.accept='image/png,image/jpeg,image/webp';referenceFile.hidden=true;
const referenceName=uiNode('p','reference-name',referencePanel,'No reference loaded');
const referenceOptions=uiNode('div','reference-options',referencePanel);
function referenceCheckbox(id,text,key){const label=uiNode('label',null,referenceOptions),input=uiNode('input',id,label);input.type='checkbox';label.append(text);input.onchange=()=>{if(!reference)return;snapshot();reference[key]=input.checked;controls();render();};}
referenceCheckbox('reference-visible',' Show image','visible');referenceCheckbox('reference-locked',' Lock image position','locked');
for(const [id,text,key,min,max,step] of [['reference-opacity','Opacity','opacity',0,1,.05],['reference-scale','Image scale','scale',.01,100,.05]]){
 const label=uiNode('label',null,referenceOptions,text),input=uiNode('input',id,label);input.type='number';input.min=min;input.max=max;input.step=step;
 input.onchange=()=>{if(!reference)return;try{const next=M.reference.validate({...reference,[key]:Number(input.value)});snapshot();reference=next;controls();render();}catch(e){status(e.message,true);controls();}};
}
const fitAlignment=uiNode('button','fit-reference',referencePanel,'Fit image & character'),clearReference=uiNode('button','remove-reference',referenceOptions,'Remove image'),resetCharacter=uiNode('button','reset-character-alignment',referencePanel,'Reset character alignment');
uiNode('p',null,referencePanel,'Choose Move reference or Move character above the canvas, then drag anywhere. Alignment does not change poses, pins, animation keys or baked sprites. Middle-drag / Space-drag pans both. Images are stored in the project backup.').className='hint';
const toolLabel=uiNode('label',null,$('view-tools'),'Tool'),canvasTool=uiNode('select','canvas-tool',toolLabel);canvasTool.setAttribute('aria-label','Canvas tool');
for(const [value,text] of [['pose','Pose joints'],['character','Move character'],['reference','Move reference']])canvasTool.add(new Option(text,value));
const alignmentHint=uiNode('span','alignment-hint',$('view-tools'));
const referenceLayer=elem('g',{id:'reference-layer','pointer-events':'none'},$('stage'));$('stage').insertBefore(referenceLayer,$('ghost'));
function paintReferenceAlignment(){
 const offset=alignment.character_offset,transform='translate('+offset.join(' ')+')';
 for(const id of ['ghost','character','points','scarf-points','animation-layer','vfx-points'])$(id).setAttribute('transform',transform);
 if(!reference){referenceLayer.replaceChildren();return;}
 let image=$('reference-image');if(!image)image=elem('image',{id:'reference-image','pointer-events':'none',preserveAspectRatio:'none'},referenceLayer);
 for(const [key,value] of Object.entries({x:reference.x,y:reference.y,width:reference.width*reference.scale,height:reference.height*reference.scale,opacity:reference.opacity,visibility:reference.visible?'visible':'hidden'}))image.setAttribute(key,value);
 if(image.getAttribute('href')!==reference.data_url)image.setAttribute('href',reference.data_url);
}
function authoringWorkspaceControls(){
 const values=M.proportions.defaults(rig),signature=JSON.stringify(values);if(signature!==proportionsSignature){fillProportionFields(values);proportionsSignature=signature;}
 for(const key of ['head_radius','limb_thickness','overall_scale'])$('appearance-'+key).value=rig[key];
 referenceName.textContent=reference?reference.name:'No reference loaded';referenceOptions.hidden=!reference;fitAlignment.disabled=!reference;
 if(reference){$('reference-visible').checked=reference.visible;$('reference-locked').checked=reference.locked;for(const key of ['scale','opacity']){$('reference-'+key).value=Number(reference[key].toFixed(5));$('reference-'+key).disabled=key!=='opacity'&&reference.locked;}}
 alignmentHint.textContent=canvasTool.value==='pose'?'':canvasTool.value==='character'?'Drag to align character; keys stay unchanged':reference?.locked?'Image locked — unlock to drag':'Drag to align reference image';
 $('stage').classList.toggle('alignment-active',canvasTool.value!=='pose');
}
const renderBeforeAuthoring=render;render=function(){renderBeforeAuthoring();paintReferenceAlignment();authoringWorkspaceControls();};
const controlsBeforeAuthoring=controls;controls=function(){controlsBeforeAuthoring();authoringWorkspaceControls();};
canvasTool.onchange=()=>{drag=null;scarfDrag=null;controls();render();};
loadReference.onclick=()=>referenceFile.click();
referenceFile.onchange=async()=>{
 const file=referenceFile.files[0];if(!file)return;
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12000000)throw Error('Choose a PNG, JPEG or WebP image smaller than 12 MB.');
  const url=URL.createObjectURL(file);let image;
  try{image=new Image();image.src=url;await image.decode();}finally{URL.revokeObjectURL(url);}
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>16384||image.naturalHeight>16384)throw Error('Image dimensions must be at most 16384 pixels.');
  const ratio=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const dimension=Math.max(image.naturalWidth,image.naturalHeight),width=100*image.naturalWidth/dimension,height=100*image.naturalHeight/dimension;
  const next=M.reference.validate({version:1,name:file.name.slice(0,200),data_url:canvas.toDataURL('image/webp',.9),x:alignment.character_offset[0]-width/2,y:alignment.character_offset[1]-80,width,height,scale:1,opacity:.5,visible:true,locked:false});
  snapshot();reference=next;canvasTool.value='reference';$('reference-dialog').close();controls();render();status('Reference loaded. Drag anywhere on the canvas to position it.');
 }catch(e){status('Reference image: '+e.message,true);}finally{referenceFile.value='';}
};
clearReference.onclick=()=>{snapshot();reference=null;if(canvasTool.value==='reference')canvasTool.value='pose';controls();render();};
resetCharacter.onclick=()=>{snapshot();alignment={character_offset:[0,0]};controls();render();};
fitAlignment.onclick=()=>{
 $('fit').click();const b=viewBox(),minX=Math.min(b[0],reference.x),minY=Math.min(b[1],reference.y),maxX=Math.max(b[0]+b[2],reference.x+reference.width*reference.scale),maxY=Math.max(b[1]+b[3],reference.y+reference.height*reference.scale),size=Math.max(maxX-minX,maxY-minY)+12;setView([(minX+maxX-size)/2,(minY+maxY-size)/2,size,size]);
};
let alignmentGesture=null;
function finishAlignment(cancel=false){
 if(!alignmentGesture)return;const g=alignmentGesture;alignmentGesture=null;
 if(cancel){alignment.character_offset=g.offset;if(reference&&g.reference){reference.x=g.reference.x;reference.y=g.reference.y;}if(history.length===g.historySize){history.pop();future=g.future;}render();}
 if($('stage').hasPointerCapture(g.pointer))$('stage').releasePointerCapture(g.pointer);
 controls();status(cancel?'Alignment drag cancelled.':'Alignment saved; pose and animation geometry unchanged.');
}
$('stage').addEventListener('pointerdown',e=>{
 if(!alignmentToolActive()||e.button!==0||spaceDown)return;e.preventDefault();e.stopImmediatePropagation();
 if(canvasTool.value==='reference'&&(!reference||reference.locked)){status(reference?'Unlock the reference image to move it.':'Load a reference image first.',true);return;}
 const oldFuture=[...future];snapshot();drag=null;scarfDrag=null;alignmentGesture={pointer:e.pointerId,target:canvasTool.value,start:stagePoint(e),offset:[...alignment.character_offset],reference:reference?{x:reference.x,y:reference.y}:null,historySize:history.length,future:oldFuture};$('stage').setPointerCapture(e.pointerId);
},true);
$('stage').addEventListener('pointermove',e=>{
 if(alignmentGesture?.pointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const g=alignmentGesture,pt=stagePoint(e),delta=[pt.x-g.start.x,pt.y-g.start.y];
 if(g.target==='character')alignment.character_offset=g.offset.map((v,i)=>v+delta[i]);else{reference.x=g.reference.x+delta[0];reference.y=g.reference.y+delta[1];}
 render();
},true);
for(const type of ['pointerup','pointercancel'])$('stage').addEventListener(type,e=>{if(alignmentGesture?.pointer!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();finishAlignment(type==='pointercancel');},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&alignmentGesture){e.preventDefault();finishAlignment(true);}});
window.addEventListener('blur',()=>finishAlignment(true));
$('stage').addEventListener('keydown',e=>{
 if(!alignmentToolActive()||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();
 if(canvasTool.value==='reference'&&(!reference||reference.locked))return;snapshot();const axis=e.key.includes('Left')||e.key.includes('Right')?0:1,step=(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)*(e.shiftKey?1:.1);
 if(canvasTool.value==='character')alignment.character_offset[axis]+=step;else reference[axis?'y':'x']+=step;controls();render();
},true);
controls();render();

const starterActions=uiNode('button','load-starter-animations',$('sequence-library'),'Add original 28 animations');
starterActions.title='Add missing original animations to this project. Existing animations and current pose edits are preserved.';
starterActions.onclick=()=>{let added=0;animationAction(()=>{
 const originals=M.proportions.apply(SolStarterActions,M.proportions.defaults(rig)),scope=a=>[a.weapon_type,a.weapon_id||'',a.name].join('/'),known=new Set(Object.values(animations).map(scope));
 for(const a of originals.animations){if(animations[a.id]||known.has(scope(a)))continue;animations[a.id]=a;known.add(scope(a));added++;}
 M.animation.validateWorkspace({animations:Object.values(animations),weapon_definitions:Object.values(weaponDefinitions),current_pose:pose,poses:Object.values(saved)});
 $('animation-panel').open=true;status(added?'Added '+added+' original animations. Choose one in the Library.':'All original animations are already in this project.');
},'Original animation library available.');if(!$('status').classList.contains('error'))status(added?'Added '+added+' original animations. Choose one in the Library.':'All original animations are already in this project.');};
