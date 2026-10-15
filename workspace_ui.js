// Context navigation never creates parallel pose editors.
'use strict';
let inspectorCategory='body',inspectorLastPoint=selected,workspaceStorageHealthy=false;
const friendly=id=>String(id||'').replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
function selectInspector(category){inspectorCategory=category;if(category==='weapon'&&!selected.startsWith('weapon_'))selected='weapon_socket';else if(category==='body'&&selected.startsWith('weapon_'))selected='left_hand';inspectorLastPoint=selected;if(category!=='scarf')scarfTail=null;controls();render();}
function workspaceControls(){
 const key=currentKey(),sequence=currentAnimation();if(selected!==inspectorLastPoint){inspectorCategory=selected.startsWith('weapon_')?'weapon':'body';inspectorLastPoint=selected;scarfTail=null;}
 for(const [category,id] of Object.entries({body:'body-inspector',weapon:'weapon-inspector',scarf:'scarf-inspector',vfx:'vfx-panel',pose:'pose-settings-panel'}))$(id).hidden=category!==inspectorCategory;
 for(const b of document.querySelectorAll('[data-inspector]'))b.setAttribute('aria-selected',String(b.dataset.inspector===inspectorCategory));
 const hand=/^(left|right)_hand$/.test(selected)?selected.split('_')[0]:null;$('hand-grip-panel').hidden=inspectorCategory!=='body'||!hand;$('hand-grip-mode').value=hand?M.attachments.handMode(pose,hand):'free';$('hand-grip-mode').disabled=!hand;for(const option of $('hand-grip-mode').options)option.disabled=option.value!=='free'&&!M.weapons.enabled(pose);$('weapon-attachment').hidden=!!pose.hand_grips?.[M.weaponHand(pose)];
 $('vfx-tracks').hidden=!currentAnimation();$('projection-panel').hidden=inspectorCategory!=='body'||!currentProjectionPart;
 const title=inspectorCategory==='body'?friendly(selected):inspectorCategory==='vfx'?(selectedStickers().length>1?selectedStickers().length+' stickers':M.vfx.asset(selectedEffect()?.asset)?.name||'Effects'):inspectorCategory==='pose'?'Pose information':friendly(inspectorCategory);
 const anchorSelect=$('anchor-select');anchorSelect.replaceChildren();for(const id of ['pelvis',...Object.keys(pose.joints),...(M.weapons.enabled(pose)?['weapon_tip']:[])])anchorSelect.add(new Option(friendly(id),id));anchorSelect.value=selected;anchorSelect.hidden=!['body','weapon'].includes(inspectorCategory);$('inspector-title').hidden=!anchorSelect.hidden;
 $('inspector-title').textContent=title;$('inspector-scope').textContent=key?'Key '+(sequence.keys.indexOf(key)+1)+' · '+key.time.toFixed(3)+' s':'Current pose';
 $('editing-context-text').textContent=key?sequence.name+' · Key '+(sequence.keys.indexOf(key)+1)+' · '+key.time.toFixed(3)+' s':pose.name;
 if($('animation-preview').checked&&sequence)$('editing-context-text').textContent=sequence.name+' · Preview '+Number($('animation-scrub').value).toFixed(3)+' s';
 $('local-save-state').textContent=workspaceStorageHealthy?(key?'Key saved locally':'Changes saved locally'):'Export a backup to keep changes';$('local-save-state').classList.toggle('unsaved',!workspaceStorageHealthy);
 if(key)$('dirty').textContent='';else $('dirty').textContent=saved[pose.name]?(JSON.stringify(M.exportPose(saved[pose.name]))===JSON.stringify(M.exportPose(pose))?'Saved pose':'Library copy differs'):'Not in Pose Library';
 $('open-sprite-export').disabled=!sequence||animationExporting;
 for(const effect of $('character').querySelectorAll('[data-vfx]'))effect.setAttribute('pointer-events','visiblePainted');
 for(const id of ['a','b'])$('scarf-edit-'+id).setAttribute('aria-pressed',String(scarfTail===id));
}
const persistBeforeWorkspace=persist;persist=function(){workspaceStorageHealthy=persistBeforeWorkspace()===true;};
const controlsBeforeWorkspace=controls;controls=function(){controlsBeforeWorkspace();workspaceControls();};
const paintAnimationBeforeWorkspace=paintAnimation;paintAnimation=function(){paintAnimationBeforeWorkspace();workspaceControls();};
const renderBeforeWorkspace=render;render=function(){renderBeforeWorkspace();workspaceControls();for(const h of $('points').querySelectorAll('[data-point]'))if(h.dataset.point===selected)h.parentNode.append(h);};
for(const b of document.querySelectorAll('[data-inspector]'))b.onclick=()=>selectInspector(b.dataset.inspector);
$('anchor-select').onchange=()=>{selected=$('anchor-select').value;controls();render();};
$('clear-pins').onclick=()=>chainAction(()=>{pose.pins={};},'All anchor locks cleared.');
$('stage').addEventListener('pointerdown',e=>{if(alignmentToolActive()||e.button!==0||spaceDown||$('animation-preview').checked)return;const target=e.target.closest('[data-vfx]')||e.target.closest('[data-scarf-tail],[data-part="weapon"]');if(target?.dataset.scarfTail){selectInspector('scarf');scarfTail=target.dataset.scarfTail;controls();render();}else if(target?.dataset.vfx){return;}else if(target?.dataset.part==='weapon')selectInspector('weapon');},true);
for(const id of ['a','b'])$('scarf-edit-'+id).addEventListener('click',()=>{inspectorCategory='scarf';workspaceControls();});
$('stage').addEventListener('pointerdown',e=>{if(e.target.dataset.scarfControl!==undefined)inspectorCategory='scarf';},true);
$('animation-select').addEventListener('change',()=>setLibraryTab('animations'));
const {dialog,spriteOpen,close}=SolWorkspaceLayout;spriteOpen.onclick=()=>openEditorDialog('sprite-export-dialog');close.onclick=()=>dialog.close();
for(const menu of document.querySelectorAll('.action-menu')){menu.addEventListener('toggle',()=>{if(menu.open)for(const other of document.querySelectorAll('.action-menu'))if(other!==menu)other.open=false;});menu.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});}
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const menu of document.querySelectorAll('.action-menu'))menu.open=false;});document.addEventListener('pointerdown',e=>{for(const menu of document.querySelectorAll('.action-menu'))if(!menu.contains(e.target))menu.open=false;});
controls();render();
