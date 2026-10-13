'use strict';
// Extend existing controls, rendering, history, imports and local persistence.
let selectedSegment='left_lower_arm',chainSelectionAnchor=null;
function chainControls(){
 M.attachments.apply(pose);const attachment=M.attachments.attachment(pose);$('weapon-position-lock').checked=attachment.position_locked;$('weapon-rotation-lock').checked=attachment.rotation_locked;$('grip-offset').textContent='Grip offset: '+Number(attachment.grip_rotation_offset.toFixed(4))+'°';
 for(const input of $('pose-controls').querySelectorAll('input'))if(input.parentElement.textContent.startsWith('Weapon rotation'))input.disabled=attachment.rotation_locked||$('mode').value!=='pose';
 const p=working(),prior=selected,select=$('selected');
 select.replaceChildren();for(const id of ['pelvis',...Object.keys(p.joints)])select.add(new Option(id.replaceAll('_',' '),id));
 if(prior!=='pelvis'&&!Object.hasOwn(p.joints,prior))selected='left_hand';select.value=selected;
 const edges=M.chains.segments(p,rig);
 if(chainSelectionAnchor!==selected||!edges.some(e=>e.id===selectedSegment)){const e=edges.find(e=>e.end===selected)||edges.find(e=>e.start===selected);selectedSegment=e?.id||edges[0].id;chainSelectionAnchor=selected;}
 $('segment-select').replaceChildren();for(const e of edges)$('segment-select').add(new Option(e.id.replaceAll('_',' '),e.id));$('segment-select').value=selectedSegment;
 const edge=edges.find(e=>e.id===selectedSegment),editable=$('mode').value==='pose';
 $('segment-length').value=Number(edge.current_length.toFixed(5));$('baseline-length').textContent='Rig baseline: '+Number(edge.baseline_length.toFixed(5));
 $('pin-anchor').checked=!!pose.pins?.[selected];$('pin-anchor').disabled=!editable;
 for(const id of ['segment-select','segment-length','reset-segment-length','reset-limb-lengths','reset-all-lengths'])$(id).disabled=!editable;
 $('add-segment').disabled=!editable||selected==='pelvis'||edges.some(e=>e.start===selected);
 $('remove-segment').disabled=!editable||edge.character||edges.some(e=>e.start===edge.end);
 $('remove-branch').disabled=!editable||edge.character||!edges.some(e=>e.start===edge.end);
}
function chainAction(action,message){if($('mode').value!=='pose')return;const before=M.clone(pose);try{snapshot();if(action()===false){pose=before;status('Cannot satisfy these lengths with the pinned anchors. Pose unchanged; unpin or adjust the length.',true);}else status(message);controls();render();}catch(e){pose=before;controls();render();status(e.message,true);}}
for(const id of ['weapon-position-lock','weapon-rotation-lock'])$(id).onchange=()=>chainAction(()=>{let position=$('weapon-position-lock').checked,rotation=$('weapon-rotation-lock').checked;if(id==='weapon-position-lock'&&!position)rotation=false;M.attachments.setLocks(pose,position,rotation);M.attachments.apply(pose);},'Weapon attachment updated; current grip angle preserved.');
$('capture-grip-offset').onclick=()=>chainAction(()=>M.attachments.capture(pose),'Current relative weapon angle stored as the grip offset.');
$('pin-anchor').onchange=()=>chainAction(()=>{pose.pins??={};pose.pins[selected]=$('pin-anchor').checked;},'Anchor lock updated. Green anchors stay fixed in world space.');
$('segment-select').onchange=()=>{selectedSegment=$('segment-select').value;const edge=M.chains.segments(pose,rig).find(e=>e.id===selectedSegment);selected=edge.end;chainSelectionAnchor=selected;controls();render();};
$('segment-length').onchange=()=>chainAction(()=>M.chains.setLengths(pose,rig,{[selectedSegment]:Number($('segment-length').value)}),'Current pose segment length updated. Rig baseline unchanged.');
function resetChainLengths(scope){const edges=scope==='segment'?M.chains.segments(pose,rig).filter(e=>e.id===selectedSegment):scope==='chain'?M.chains.limbSegments(pose,rig,selectedSegment):M.chains.segments(pose,rig);return M.chains.setLengths(pose,rig,Object.fromEntries(edges.map(e=>[e.id,e.baseline_length])));}
for(const [id,scope] of [['reset-segment-length','segment'],['reset-limb-lengths','chain'],['reset-all-lengths','all']])$(id).onclick=()=>chainAction(()=>resetChainLengths(scope),'Lengths restored to rig baseline. Current pose and unrelated limbs preserved.');
$('add-segment').onclick=()=>chainAction(()=>{const added=M.chains.addSegment(pose,rig,selected);selected=added.end;selectedSegment=added.id;chainSelectionAnchor=selected;},'Added a connected segment. Drag its new endpoint or edit its length.');
function removeSelectedSegment(branch){if(branch&&!confirm('Remove this added segment and all its downstream segments and anchors? Undo can restore them.'))return;chainAction(()=>{selected=M.chains.removeSegment(pose,rig,selectedSegment,branch);chainSelectionAnchor=null;},'Added segment removed. Remaining chain preserved.');}
$('remove-segment').onclick=()=>removeSelectedSegment(false);$('remove-branch').onclick=()=>removeSelectedSegment(true);
function paintExtraSegments(p,parent){if(!p.extra_segments?.length)return;const g=elem('g',{'data-extra-segments':'true',transform:`scale(${visualScale()}) translate(${p.root.join(' ')}) scale(${p.facing} 1)`},parent);for(const edge of p.extra_segments){const a=p.joints[edge.start],b=p.joints[edge.end];elem('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#67b8e2','stroke-width':rig.limb_thickness*.45,'stroke-linecap':'round','pointer-events':'none','data-segment':edge.id},g);}}
const renderCharacterBeforeChains=renderCharacter;renderCharacter=function(p,parent,ghost=false){renderCharacterBeforeChains(p,parent,ghost);paintExtraSegments(p,parent);};
const controlsBeforeChains=controls;controls=function(){// Populate dynamic anchors before the existing selected-point controls run.
 chainControls();controlsBeforeChains();chainControls();};
const renderBeforeChains=render;render=function(){renderBeforeChains();if($('mode').value==='pose'&&$('handles').checked&&!$('blend-enabled').checked){const p=pose,g=elem('g',{'data-segment-targets':'true',transform:`scale(${visualScale()}) translate(${p.root.join(' ')}) scale(${p.facing} 1)`},$('points'));$('points').prepend(g);for(const edge of M.chains.segments(p,rig)){const a=p.joints[edge.start],b=p.joints[edge.end],line=elem('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:edge.id===selectedSegment?'#ffb968':'transparent','stroke-width':edge.id===selectedSegment?1:5,'stroke-opacity':.55,'data-select-segment':edge.id,tabindex:0,'aria-label':edge.id},g);line.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectSegment(edge);}};}}};
function selectSegment(edge){selectedSegment=edge.id;selected=edge.end;chainSelectionAnchor=selected;controls();render();}
$('stage').addEventListener('pointerdown',event=>{const id=event.target.dataset.selectSegment;if(!id)return;event.preventDefault();event.stopImmediatePropagation();selectSegment(M.chains.segments(pose,rig).find(e=>e.id===id));},true);
controls();library();render();
