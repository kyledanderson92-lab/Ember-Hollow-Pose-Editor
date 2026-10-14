// Adapted from public 3b19d32 / workspace commit 08d864b; retain Stick Sol.
// Move existing controls into the workspace before their authoring handlers bind.
(function(){
'use strict';
const get=id=>document.getElementById(id),make=(tag,id,parent,text)=>{const n=document.createElement(tag);if(id)n.id=id;if(text)n.textContent=text;if(parent)parent.append(n);return n;},move=(ids,parent)=>ids.forEach(id=>parent.append(get(id)));
const main=document.querySelector('main'),work=document.querySelector('.workspace'),inspector=document.querySelector('aside'),header=document.querySelector('header'),nav=document.querySelector('header nav');
const menus=make('div','workspace-menus',nav);
function menu(id,label){const d=make('details',id,menus);d.className='action-menu';make('summary',null,d,label);return make('div',id+'-content',d);}
const file=menu('file-menu','File'),setup=menu('setup-menu','Setup'),exports=menu('export-menu','Export');
move(['new','save'],nav);move(['duplicate','reset','import','backup-select','previous-project'],file);move(['runtime-rig','pose-to-rig'],setup);move(['export-project','export-pose','export-rig','animation-export'],exports);
get('save').textContent='Save to Pose Library';get('export-project').textContent='Export Project Backup';get('pose-to-rig').textContent='Use pose as default rig';get('runtime-rig').textContent='Restore current Sol rig';
const spriteOpen=make('button','open-sprite-export',exports,'Bake sprite frames…');spriteOpen.type='button';
const context=make('div','editing-context',header),contextText=make('span','editing-context-text',context,'Pose'),saveState=make('span','local-save-state',context,'Saved locally');context.setAttribute('aria-live','polite');
const tools=work.querySelector('.bar'),actions=tools.nextElementSibling,blend=work.querySelector('.blend-bar'),view=make('div',null);view.className='bar';work.insertBefore(view,actions);make('span','character-presentation',view,'Stick Sol');view.append(get('facing').closest('label'));tools.id='canvas-tools';view.id='view-tools';actions.id='pose-tools';
move(['undo','redo'],nav);move(['mirror'],view);
const more=make('details','pose-tools-menu',view);more.className='action-menu';make('summary',null,more,'Pose tools');const moreBody=make('div',null,more);while(actions.firstChild)moreBody.append(actions.firstChild);moreBody.append(get('duplicate'));moreBody.append(get('reset'));actions.remove();context.append(get('dirty'));
const compare=make('details','comparison-panel');make('summary',null,compare,'Compare two poses');compare.append(blend);
const dock=make('div','bottom-dock',work);dock.append(get('animation-panel'));dock.append(compare);work.append(work.querySelector('footer'));get('animation-panel').querySelector('summary').textContent='Animation timeline';
const drawer=make('div','library-drawer');main.prepend(drawer);make('h2',null,drawer,'Library');drawer.append(get('pose-library-panel'));const sequences=make('section','sequence-library',drawer);make('h2',null,sequences,'Animations');
const sequenceRow=get('animation-panel').querySelector('.row');sequences.append(sequenceRow);sequenceRow.className='sequence-controls';get('animation-select').setAttribute('aria-label','Animation sequence');
// Move animation JSON export into Export menu; move baking parameters to a dialog.
const bakeRow=get('sprite-export').closest('.row'),dialog=make('dialog','sprite-export-dialog',document.body);make('h2',null,dialog,'Bake sprite frames');const close=make('button','close-sprite-export',dialog,'Close');close.type='button';dialog.append(bakeRow);make('p',null,dialog,'PNG frames include the authored scarf, weapons and VFX. Export Project Backup keeps the editable source.');dialog.setAttribute('aria-label','Bake sprite frames');
// Show point/chain/depth controls together; keep weapon projection with weapon controls.
const toolbar=make('div','inspector-toolbar');inspector.prepend(toolbar);const label=make('label',null,toolbar,'Inspect');const category=make('select','inspector-category',label);for(const [value,text] of [['body','Body / selected point'],['weapon','Weapon'],['scarf','Scarf'],['vfx','Effects'],['pose','Pose settings']]){const option=make('option',null,category,text);option.value=value;}
make('h2','inspector-title',toolbar,'Left hand');make('p','inspector-scope',toolbar,'Current pose');
const settings=get('pose-settings-panel'),weapon=make('section','weapon-inspector',inspector);make('h2',null,weapon,'Weapon');
for(const id of ['weapon','weapon-layer','weapon-tip-arm'])weapon.append(get(id).closest('label'));move(['weapon-attachment'],weapon);
const projection=get('projection-panel');for(const id of ['weapon-length','pose-weapon-definition'])weapon.append(get(id).closest('label'));move(['weapon-baseline','weapon-length-reset'],weapon);
const scarf=make('section','scarf-inspector',inspector);scarf.append(get('scarf-panel'));
get('joint-panel').append(get('pose-controls'));const weaponAngles=make('div','weapon-angles',weapon);
const rigTools=make('details','rig-tools',inspector);make('summary',null,rigTools,'Rig settings');move(['rig-settings-panel','color-panel'],rigTools);
const advanced=make('details','body-advanced',inspector);make('summary',null,advanced,'Advanced body tools');advanced.append(get('pins'));
const vfx=get('vfx-panel');inspector.append(vfx);
inspector.append(get('joint-panel'),get('segment-panel'),projection,advanced,weapon,scarf,settings,rigTools);
const ghost=get('ghost-select').closest('label');compare.append(ghost);
get('segment-panel').querySelector('h2').textContent='Selected chain & length';get('reset-segment-length').textContent='Restore default length';get('projection-panel').querySelector('h2').textContent='Selected limb depth';
// Everyday controls stay near the selection; specialist tools are collapsed.
const movementLabel=make('label',null,view,'Movement'),movement=make('select','movement-mode',movementLabel);
for(const [value,text] of [['2d','2D movement'],['3d','3d movement'],['stretch','stretch']]){const option=make('option',null,movement,text);option.value=value;}
const movementStatus=make('span','movement-status',view);movementStatus.setAttribute('role','status');

const allLabel=make('label',null,advanced,'All limbs'),allMovement=make('select','all-movement-mode',allLabel);for(const [value,text] of [['','Apply movement mode…'],['2d','2D movement'],['3d','3d movement'],['stretch','stretch']]){const o=make('option',null,allMovement,text);o.value=value;}advanced.append(projection);
for(const id of ['segment-select','segment-length'])advanced.append(get(id).closest('label'));
move(['baseline-length','reset-segment-length','reset-all-lengths','add-segment','remove-segment','remove-branch'],advanced);
get('segment-panel').querySelector('h2').textContent='Selected limb';get('reset-limb-lengths').textContent='Restore limb proportions';get('projection-panel').querySelector('h2').textContent='Limb movement details';
get('reset-projection-limb').remove();get('limb-solver').replaceChildren();for(const [value,text] of [['2d','2D movement'],['3d','3d movement'],['stretch','stretch']]){const o=make('option',null,get('limb-solver'),text);o.value=value;}get('capture-bend').textContent='Use current bend';
const weaponAdvanced=make('details','weapon-advanced',weapon);make('summary',null,weaponAdvanced,'Advanced weapon settings');
weaponAdvanced.append(get('weapon-attachment'));weaponAdvanced.append(get('pose-weapon-definition').closest('label'));
const animationAdvanced=make('details','animation-advanced',sequences);make('summary',null,animationAdvanced,'Advanced animation settings');
for(const id of ['animation-family','animation-owner'])animationAdvanced.append(get(id).closest('label'));animationAdvanced.append(get('weapon-new'));
const accessories=make('details','accessory-tools',setup);make('summary',null,accessories,'Optional accessories');accessories.append(get('scarf-visible').closest('label'));
category.querySelector('option[value="scarf"]').textContent='Scarf (optional)';
get('pose-weapon-definition').options[0].textContent='Default weapon';

// Collapsible explanatory text lives near its controls but no longer dominates.
for(const hint of document.querySelectorAll('.hint')){const d=make('details',null);d.className='help-note';make('summary',null,d,'Help');hint.replaceWith(d);d.append(hint);}
for(const note of inspector.querySelectorAll(':scope > .help-note'))file.append(note);
window.SolWorkspaceLayout={dialog,spriteOpen,close};
})();
