'use strict';
let spaceDown=false,panGesture=null;
function viewBox(){return $('stage').getAttribute('viewBox').split(/\s+/).map(Number);}
function setView(b){$('stage').setAttribute('viewBox',b.join(' '));$('zoom-value').textContent=Math.round(130/b[2]*100)+'%';}
function stagePoint(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform($('stage').getScreenCTM().inverse());}
function zoomView(factor,e=null){const b=viewBox(),p=e?stagePoint(e):{x:b[0]+b[2]/2,y:b[1]+b[3]/2},width=Math.max(8,Math.min(2000,b[2]/factor)),ratio=width/b[2];setView([p.x-(p.x-b[0])*ratio,p.y-(p.y-b[1])*ratio,width,b[3]*ratio]);}
$('zoom-in').onclick=()=>zoomView(1.25);$('zoom-out').onclick=()=>zoomView(.8);$('view-reset').onclick=()=>setView([-65,-90,130,130]);
$('stage').addEventListener('wheel',e=>{e.preventDefault();zoomView(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.003),e);},{passive:false});
const fitZoom=$('fit').onclick;$('fit').onclick=()=>{fitZoom();setView(viewBox());};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.matches('input,textarea,select')){spaceDown=true;e.preventDefault();}});
document.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});window.addEventListener('blur',()=>{spaceDown=false;panGesture=null;});
$('stage').addEventListener('pointerdown',e=>{if(e.button!==1&&!spaceDown)return;e.preventDefault();e.stopImmediatePropagation();drag=null;panGesture={id:e.pointerId,x:e.clientX,y:e.clientY,box:viewBox(),scale:$('stage').getScreenCTM().a};$('stage').setPointerCapture(e.pointerId);},true);
$('stage').addEventListener('pointermove',e=>{if(!panGesture||panGesture.id!==e.pointerId)return;e.stopImmediatePropagation();const p=panGesture;setView([p.box[0]-(e.clientX-p.x)/p.scale,p.box[1]-(e.clientY-p.y)/p.scale,p.box[2],p.box[3]]);},true);
for(const type of ['pointerup','pointercancel'])$('stage').addEventListener(type,()=>panGesture=null);
$('pose-to-rig').onclick=()=>{snapshot();rig=M.rigFromPose(rig,pose);controls();render();status('Current pose is the new starting rig.');};
function authorPoint(e){const p=working(),pt=stagePoint(e);return [(pt.x/visualScale()-p.root[0])*p.facing,pt.y/visualScale()-p.root[1]];}
