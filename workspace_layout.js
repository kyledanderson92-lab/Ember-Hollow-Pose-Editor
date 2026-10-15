// Static workspace structure lives in index.html; shared navigation lives here.
'use strict';
function setLibraryTab(tab){for(const b of document.querySelectorAll('[data-library]'))b.setAttribute('aria-selected',String(b.dataset.library===tab));document.getElementById('sequence-library').hidden=tab!=='animations';document.getElementById('pose-library-panel').hidden=tab!=='poses';}
function setAnimatorTab(tab){for(const b of document.querySelectorAll('[data-animator]'))b.setAttribute('aria-selected',String(b.dataset.animator===tab));for(const [key,id] of Object.entries({keys:'animator-keys',ghosts:'animation-review',clip:'animator-clip'}))document.getElementById(id).hidden=key!==tab;}
function setCharacterPage(page){for(const b of document.querySelectorAll('[data-character-page]'))b.setAttribute('aria-selected',String(b.dataset.characterPage===page));document.getElementById('rig-tools').hidden=page!=='proportions';document.getElementById('runtime-rig').hidden=page!=='proportions';document.getElementById('appearance-page').hidden=page!=='appearance';}
function openEditorDialog(id){const dialog=document.getElementById(id);if(!dialog.open)dialog.showModal();}
for(const b of document.querySelectorAll('[data-library]'))b.onclick=()=>setLibraryTab(b.dataset.library);
for(const b of document.querySelectorAll('[data-animator]'))b.onclick=()=>setAnimatorTab(b.dataset.animator);
for(const b of document.querySelectorAll('[data-character-page]'))b.onclick=()=>setCharacterPage(b.dataset.characterPage);
for(const b of document.querySelectorAll('[data-close-dialog]'))b.onclick=()=>document.getElementById(b.dataset.closeDialog).close();
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.getElementById('open-help').onclick=()=>openEditorDialog('help-dialog');
setLibraryTab('animations');setAnimatorTab('keys');setCharacterPage('proportions');
window.SolWorkspaceLayout={dialog:document.getElementById('sprite-export-dialog'),spriteOpen:document.getElementById('open-sprite-export'),close:document.getElementById('close-sprite-export')};
