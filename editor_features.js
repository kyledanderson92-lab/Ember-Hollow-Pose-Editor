'use strict';

// View state is independent of rig/pose coordinates and authoring history.
let spaceDown=false,panGesture=null,contourDrag=null,contourIndex=0;
const contourKeys=['chest','pelvis',...['left','right'].flatMap(side=>['upper_arm','lower_arm','upper_leg','lower_leg','hand','foot'].map(part=>side+'_'+part))];
for(const key of contourKeys)$('outline-part').add(new Option(key.replaceAll('_',' '),key));
function viewBox(){return $('stage').getAttribute('viewBox').split(/\s+/).map(Number);}
function setView(box){$('stage').setAttribute('viewBox',box.join(' '));$('zoom-value').value=Math.round(130/box[2]*100)+'%';paintContours();}
function stagePoint(event){return new DOMPoint(event.clientX,event.clientY).matrixTransform($('stage').getScreenCTM().inverse());}
function zoomView(factor,event=null){const b=viewBox(),p=event?stagePoint(event):{x:b[0]+b[2]/2,y:b[1]+b[3]/2},width=Math.max(8,Math.min(2000,b[2]/factor)),ratio=width/b[2];setView([p.x-(p.x-b[0])*ratio,p.y-(p.y-b[1])*ratio,width,b[3]*ratio]);}
$('zoom-in').onclick=()=>zoomView(1.25);$('zoom-out').onclick=()=>zoomView(.8);$('view-reset').onclick=()=>setView([-65,-65,130,130]);
$('stage').addEventListener('wheel',event=>{event.preventDefault();zoomView(Math.exp(-Math.max(-100,Math.min(100,event.deltaY))*.003),event);},{passive:false});
const fitWithFeatures=$('fit').onclick;$('fit').onclick=()=>{fitWithFeatures();setView(viewBox());};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.matches('input,textarea,select')){spaceDown=true;e.preventDefault();$('stage').classList.add('pan-ready');}});
document.addEventListener('keyup',e=>{if(e.code==='Space'){spaceDown=false;$('stage').classList.remove('pan-ready');}});
window.addEventListener('blur',()=>{spaceDown=false;panGesture=null;$('stage').classList.remove('pan-ready');});
function authorPoint(event){const pt=stagePoint(event),p=working();return [(pt.x/visualScale()-p.root[0])*p.facing,pt.y/visualScale()-p.root[1]];}
$('stage').addEventListener('pointerdown',event=>{
 if(event.button===1||spaceDown){event.preventDefault();event.stopImmediatePropagation();drag=null;panGesture={id:event.pointerId,x:event.clientX,y:event.clientY,box:viewBox(),scale:$('stage').getScreenCTM().a};$('stage').setPointerCapture(event.pointerId);return;}
 const tag=event.target.dataset.contour;if(!tag)return;
 event.preventDefault();event.stopImmediatePropagation();snapshot();const [index,field]=tag.split(':');contourIndex=Number(index);contourDrag={id:event.pointerId,field};$('stage').setPointerCapture(event.pointerId);featureControls();
},true);
$('stage').addEventListener('pointermove',event=>{
 if(panGesture?.id===event.pointerId){event.preventDefault();event.stopImmediatePropagation();const p=panGesture;setView([p.box[0]-(event.clientX-p.x)/p.scale,p.box[1]-(event.clientY-p.y)/p.scale,p.box[2],p.box[3]]);return;}
 if(contourDrag?.id!==event.pointerId)return;
 event.preventDefault();event.stopImmediatePropagation();const key=$('outline-part').value,node=M.ensureCurve(rig,key).nodes[contourIndex],local=M.localContourPoint(rig,working(),key,authorPoint(event));node[contourDrag.field]=contourDrag.field==='point'?local:M.sub(local,node.point);render();
},true);
for(const type of ['pointerup','pointercancel'])$('stage').addEventListener(type,event=>{if(panGesture?.id===event.pointerId||contourDrag?.id===event.pointerId){event.stopImmediatePropagation();panGesture=null;contourDrag=null;featureControls();status('View or contour updated. Bones remain independent of outlines.');}},true);
$('stage').addEventListener('keydown',event=>{const tag=event.target.dataset.contour;if(!tag||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();snapshot();const [index,field]=tag.split(':');contourIndex=Number(index);const node=M.ensureCurve(rig,$('outline-part').value).nodes[contourIndex];node[field][event.key.includes('Left')||event.key.includes('Right')?0:1]+=(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)*(event.shiftKey?1:.1);render();featureControls();},true);

function featureNumber(parent,label,value,change){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='number';input.step='.1';input.value=Number(value.toFixed(5));l.append(input);parent.append(l);input.onchange=()=>{const value=Number(input.value);if(!Number.isFinite(value)||Math.abs(value)>10000){status('Use a finite value within ±10000.',true);featureControls();return;}snapshot();change(value);render();featureControls();};}
function featureControls(){
 for(const section of document.querySelectorAll('aside [data-modes]'))section.hidden=!section.dataset.modes.split(' ').includes($('mode').value);const editable=$('mode').value==='outline'&&!!rig.curves;$('outline-panel').hidden=!editable;$('outline-controls').replaceChildren();
 if(editable){const curve=M.partCurve(rig,$('outline-part').value);contourIndex=Math.min(contourIndex,curve.nodes.length-1);$('outline-node').replaceChildren();curve.nodes.forEach((_,i)=>$('outline-node').add(new Option('Anchor '+(i+1),String(i))));$('outline-node').value=String(contourIndex);for(const field of ['point','in','out'])for(let axis=0;axis<2;axis++)featureNumber($('outline-controls'),(field==='point'?'Anchor':field==='in'?'Incoming tangent':'Outgoing tangent')+(axis?' Y':' X'),curve.nodes[contourIndex][field][axis],v=>M.ensureCurve(rig,$('outline-part').value).nodes[contourIndex][field][axis]=v);}
 $('reference-controls').replaceChildren();const ref=referenceState||defaultReference();$('reference-visible').checked=ref.visible;$('reference-opacity').value=ref.opacity;$('actor-opacity').value=ref.actor_opacity;
 for(const [label,key] of [['Image X','x'],['Image Y','y'],['Image units per pixel','unit']])featureNumber($('reference-controls'),label,ref[key],v=>{if(key==='unit'&&v<=0){status('Image scale must be positive.',true);return;}ensureReference()[key]=v;});
}
function paintContours(){
 $('contour-points').replaceChildren();if($('mode').value!=='outline'||!rig.curves||$('blend-enabled').checked)return;
 const key=$('outline-part').value,curve=M.partCurve(rig,key),p=working(),group=elem('g',{transform:`scale(${visualScale()}) translate(${p.root.join(' ')}) scale(${p.facing} 1)`},$('contour-points'));
 const radius=5/(Math.abs($('stage').getScreenCTM().a)*visualScale());
 curve.nodes.forEach((node,i)=>{const center=M.contourPoint(rig,p,key,node.point);for(const field of ['in','out','point']){const v=field==='point'?center:M.contourPoint(rig,p,key,M.add(node.point,node[field]));if(field!=='point')elem('line',{x1:center[0],y1:center[1],x2:v[0],y2:v[1],stroke:'#b67eff','stroke-width':1,'vector-effect':'non-scaling-stroke'},group);const handle=elem('circle',{cx:v[0],cy:v[1],r:radius*(field==='point'?1.25:1),fill:field==='point'?(i===contourIndex?'#ffb968':'#b67eff'):'#101a24',stroke:'#e0c4ff','stroke-width':1,'vector-effect':'non-scaling-stroke','data-contour':i+':'+field,tabindex:0,'aria-label':key+' anchor '+(i+1)+' '+field},group);handle.onfocus=()=>{contourIndex=i;featureControls();};}});
}
$('outline-part').onchange=()=>{contourIndex=0;featureControls();render();};$('outline-node').onchange=()=>{contourIndex=Number($('outline-node').value);featureControls();render();};
$('outline-split').onclick=()=>{const curve=M.partCurve(rig,$('outline-part').value);if(curve.nodes.length>=32){status('Maximum 32 anchors per contour.',true);return;}snapshot();const edited=M.ensureCurve(rig,$('outline-part').value),i=Math.min(contourIndex,edited.closed?edited.nodes.length-1:edited.nodes.length-2),a=edited.nodes[i],b=edited.nodes[(i+1)%edited.nodes.length],mix=(a,b)=>a.map((v,i)=>(v+b[i])/2),q0=mix(a.point,M.add(a.point,a.out)),q1=mix(M.add(a.point,a.out),M.add(b.point,b.in)),q2=mix(M.add(b.point,b.in),b.point),r0=mix(q0,q1),r1=mix(q1,q2),center=mix(r0,r1);a.out=M.sub(q0,a.point);b.in=M.sub(q2,b.point);const ids=new Set(edited.nodes.map(n=>n.id));let id='anchor_'+edited.nodes.length;while(ids.has(id))id+='x';edited.nodes.splice(i+1,0,{id,point:center,in:M.sub(r0,center),out:M.sub(r1,center)});contourIndex=i+1;featureControls();render();};
$('outline-remove').onclick=()=>{const curve=M.partCurve(rig,$('outline-part').value);if($('outline-part').value==='chest'&&rig.waist_anchor_ids.includes(curve.nodes[contourIndex].id)){status('This anchor holds the waist line. Move it or edit the anchors between the waist endpoints.',true);return;}if(curve.nodes.length<=(curve.closed?3:2)){status('Contour needs its remaining anchors.',true);return;}snapshot();M.ensureCurve(rig,$('outline-part').value).nodes.splice(contourIndex,1);featureControls();render();};

function defaultReference(){const source=rig.reference||M.defaultRig().reference,unit=rig.head_radius/source.head_radius;return {image:source.image,width:source.width,height:source.height,x:-source.origin[0]*unit,y:-source.origin[1]*unit,unit,opacity:.4,actor_opacity:1,visible:false};}
function ensureReference(){referenceState??=defaultReference();return referenceState;}
function paintReference(){const layer=$('reference-layer');layer.replaceChildren();const ref=referenceState;if(ref?.visible)elem('image',{href:ref.image,x:ref.x*visualScale(),y:ref.y*visualScale(),width:ref.width*ref.unit*visualScale(),height:ref.height*ref.unit*visualScale(),opacity:ref.opacity,preserveAspectRatio:'none'},layer);$('character').setAttribute('opacity',ref?.actor_opacity??1);$('blend-layer').setAttribute('opacity',ref?.actor_opacity??1);}
for(const [id,key] of [['reference-visible','visible'],['reference-opacity','opacity'],['actor-opacity','actor_opacity']])$(id).oninput=()=>{snapshot();ensureReference()[key]=id==='reference-visible'?$(id).checked:Number($(id).value);render();};
$('reference-align').onclick=()=>{snapshot();const ref=ensureReference(),source=rig.reference||M.defaultRig().reference;ref.unit=rig.head_radius/source.head_radius;ref.x=working().joints.head[0]-source.head_center[0]*ref.unit;ref.y=working().joints.head[1]-source.head_center[1]*ref.unit;ref.visible=true;render();featureControls();};
$('reference-pose').onclick=()=>{if(!confirmDiscard())return;snapshot();pose=M.referencePose(rig);pose.name=unique('reference_trace');referenceState=defaultReference();referenceState.visible=true;$('lock').checked=false;$('mode').value='pose';controls();render();featureControls();status('Reference landmarks loaded. Projected limb lengths are unlocked; left-hand carry is preserved.');};
$('reference-image').onclick=()=>$('reference-file').click();$('reference-file').onchange=async()=>{
 try{const file=$('reference-file').files[0];if(!file)return;if(file.size>2000000||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose PNG/JPEG/WebP up to 2 MB.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const image=new Image();image.src=data;await image.decode();snapshot();const ref=ensureReference();ref.image=data;ref.width=image.naturalWidth;ref.height=image.naturalHeight;ref.visible=true;render();featureControls();}
 catch(e){status('Reference image could not load: '+e.message,true);}finally{$('reference-file').value='';}
};
$('export-character').onclick=()=>{try{download(M.exportCharacter(rig),'sol_character_definition');status('Exported shared character. Replace actors/player/visuals/sol_character_definition.json, sync the browser wrapper, and restart Godot.');}catch(e){status(e.message,true);}};
$('pose-to-rig').onclick=()=>{try{if($('mode').value!=='pose')throw Error('Switch to Pose mode and load the pose you want as your starting rig.');const next=M.rigFromPose(rig,pose);const backupStored=backupCurrentProject(true);snapshot();rig=next;$('mode').value='rig';backupOptions();if(backupStored)editorNotice('');controls();render();status('Current pose is now the starting rig, including chest and weapon positions/angles. Previous project '+(backupStored?'backed up in browser':'downloaded for safekeeping')+'.');}catch(e){editorNotice('Could not update the starting rig: '+e.message);status(e.message,true);}};
const renderBeforeFeatures=render;render=function(){renderBeforeFeatures();paintReference();paintContours();};
const controlsBeforeFeatures=controls;controls=function(){controlsBeforeFeatures();featureControls();};
$('mode').addEventListener('change',()=>{featureControls();paintContours();});
featureControls();render();
