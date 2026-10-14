// Public workspace adapted to the stick-only editor; no artwork/view/outline API.
'use strict';
let inspectorCategory='body',inspectorLastPoint=selected,inspectorLastLimb=null,workspaceLastMode=null,workspaceStorageHealthy=false;
const friendly=id=>String(id||'').replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
function selectInspector(category){inspectorCategory=category;if($('mode').value==='pose'&&category==='weapon')selected='weapon_socket';else if(category==='body'&&selected.startsWith('weapon_'))selected='left_hand';inspectorLastPoint=selected;if(category!=='scarf')scarfTail=null;controls();render();}
function workspaceControls(){
 const mode=$('mode').value,point=selected,limb=limbSelection(),key=currentKey(),sequence=currentAnimation(),view='Stick Sol';
 if(point!==inspectorLastPoint){inspectorCategory=point.startsWith('weapon_')?'weapon':'body';inspectorLastPoint=point;scarfTail=null;$('scarf-points').replaceChildren();}
 if(limb&&limb.side+'_'+limb.limb!==inspectorLastLimb){inspectorLastLimb=limb.side+'_'+limb.limb;$('projection-limb').value=inspectorLastLimb;animationControls();}
 $('inspector-category').value=inspectorCategory;$('inspector-category').disabled=mode!=='pose';
 const show=(id,value)=>{$(id).hidden=!value;};
 show('joint-panel',mode==='rig'||(mode==='pose'&&['body','weapon'].includes(inspectorCategory)));show('all-pose-angles',mode==='pose');
 show('segment-panel',mode==='pose'&&inspectorCategory==='body');show('projection-panel',mode==='pose'&&inspectorCategory==='body');show('body-advanced',mode==='pose'&&inspectorCategory==='body');
 show('weapon-inspector',mode==='pose'&&inspectorCategory==='weapon');show('scarf-inspector',mode==='pose'&&inspectorCategory==='scarf');show('pose-settings-panel',mode==='pose'&&inspectorCategory==='pose');show('vfx-panel',mode==='pose'&&inspectorCategory==='vfx');
 show('rig-tools',mode!=='pose');if(mode!==workspaceLastMode){$('rig-tools').open=mode==='rig';workspaceLastMode=mode;}
 for(const label of $('pose-controls').querySelectorAll('label')){const text=label.textContent.toLowerCase(),all=$('all-pose-angles').checked,relevant=inspectorCategory==='weapon'?text.startsWith('Weapon rotation'.toLowerCase()):point==='head'?text.startsWith('head rotation'):point==='torso'||point==='pelvis'?text.startsWith('torso rotation'):point.startsWith('weapon_')||inspectorCategory==='weapon'?text.startsWith('weapon rotation'):text.startsWith(point.replaceAll('_',' ')+(point.endsWith('_foot')?' rotation':' angle'));label.hidden=!all&&!relevant;}
 const title=mode==='rig'?friendly(point)+' · default rig':inspectorCategory==='scarf'?(scarfTail?'Editing Tail '+scarfTail.toUpperCase():'Scarf'):inspectorCategory==='weapon'?'Weapon':inspectorCategory==='vfx'?(effectNames[pose.vfx?.find(e=>e.id===vfxSelected)?.type]||'Effects'):inspectorCategory==='pose'?'Pose settings':friendly(point);
 $('inspector-title').textContent=title;$('inspector-scope').textContent=mode==='rig'?view+' · default geometry':key?'Key '+(sequence.keys.indexOf(key)+1)+' · '+key.time.toFixed(3)+' s':'Current pose draft';
 $('editing-context-text').textContent=mode==='rig'?'Default rig · '+view:key?'Animation: '+sequence.name+' · Key '+(sequence.keys.indexOf(key)+1)+' · '+key.time.toFixed(3)+' s · '+view:'Pose: '+pose.name+' · '+view;
 const local=workspaceStorageHealthy;
 if($('animation-preview').checked&&sequence)$('editing-context-text').textContent='Preview · '+sequence.name+' · '+Number($('animation-scrub').value).toFixed(3)+' s · read-only';else if($('blend-enabled').checked)$('editing-context-text').textContent='Compare two poses · '+$('blend-percent').value+' · read-only';
 $('local-save-state').textContent=(local?(key&&mode==='pose'?'Key changes saved locally':'Changes saved locally'):'Export Project Backup to keep changes');$('local-save-state').classList.toggle('unsaved',!local);
 if(key&&mode==='pose')$('dirty').textContent='';else if(mode==='pose'&&$('dirty').textContent==='Unsaved pose')$('dirty').textContent=saved[pose.name]?'Library copy differs':'Not in Pose Library';else if(mode!=='pose')$('dirty').textContent='';
 if(!$('animation-preview').checked){$('animation-message').textContent=key?'Editing key · changes save locally':sequence?'Select a key to edit':'Choose an animation in the Library';if(key)$('animation-time').value='Key: '+key.time.toFixed(3)+' s';}
 $('save').title='Save the current draft to the Pose Library. Animation keys already save locally as you edit.';
 $('open-sprite-export').disabled=!sequence||animationExporting;
 for(const effect of $('character').querySelectorAll('[data-vfx]'))effect.setAttribute('pointer-events',mode==='pose'?'visiblePainted':'none');
 for(const id of ['scarf-edit-a','scarf-edit-b'])$(id).classList.toggle('active-tool',$(id).getAttribute('aria-pressed')==='true');
}
const persistBeforeWorkspace=persist;persist=function(){workspaceStorageHealthy=persistBeforeWorkspace()===true;};
const controlsBeforeWorkspace=controls;controls=function(){controlsBeforeWorkspace();workspaceControls();};
const paintBlendBeforeWorkspace=paintBlend;paintBlend=function(){paintBlendBeforeWorkspace();workspaceControls();};
const paintAnimationBeforeWorkspace=paintAnimation;paintAnimation=function(){paintAnimationBeforeWorkspace();workspaceControls();};
const renderBeforeWorkspace=render;render=function(){renderBeforeWorkspace();workspaceControls();for(const handle of $('points').querySelectorAll('[data-point]'))if(handle.dataset.point===selected)handle.parentNode.append(handle);};
$('all-pose-angles').onchange=workspaceControls;
$('inspector-category').onchange=()=>selectInspector($('inspector-category').value);
// Selection of a visible object exposes its inspector without changing the pose.
$('stage').addEventListener('pointerdown',e=>{if(e.button!==0||spaceDown||$('animation-preview').checked)return;const target=e.target.closest('[data-vfx]')||e.target.closest('[data-scarf-tail],[data-part="weapon"]');if(target?.dataset.scarfTail){scarfTail=target.dataset.scarfTail;selectInspector('scarf');render();}else if(target?.dataset.vfx){vfxSelected=target.dataset.vfx;inspectorCategory='vfx';$('vfx-panel').open=true;controls();}else if(target?.dataset.part==='weapon')selectInspector('weapon');},true);
for(const id of ['a','b'])$('scarf-edit-'+id).addEventListener('click',()=>selectInspector('scarf'));
$('stage').addEventListener('pointerdown',e=>{if(e.target.dataset.scarfControl!==undefined)inspectorCategory='scarf';},true);
$('projection-limb').addEventListener('change',()=>{const [side,kind]=$('projection-limb').value.split('_');selected=side+(kind==='arm'?'_hand':'_foot');inspectorCategory='body';inspectorLastPoint=selected;controls();render();});
$('vfx-select').addEventListener('change',workspaceControls);
$('animation-select').addEventListener('change',()=>{$('animation-panel').open=true;});$('animation-new').addEventListener('click',()=>{$('animation-panel').open=true;});
for(const button of $('thumbnails').querySelectorAll('button'))button.addEventListener('click',()=>{$('animation-panel').open=false;});
const {dialog,spriteOpen,close}=SolWorkspaceLayout;spriteOpen.onclick=()=>{dialog.showModal();};close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
for(const menu of document.querySelectorAll('.action-menu')){menu.addEventListener('toggle',()=>{if(menu.open)for(const other of document.querySelectorAll('.action-menu'))if(other!==menu)other.open=false;});menu.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});}
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const menu of document.querySelectorAll('.action-menu'))menu.open=false;});document.addEventListener('pointerdown',e=>{for(const menu of document.querySelectorAll('.action-menu'))if(!menu.contains(e.target))menu.open=false;});
controls();render();
