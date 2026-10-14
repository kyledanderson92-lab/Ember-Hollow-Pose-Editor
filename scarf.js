(function(global){
'use strict';
const clone=o=>JSON.parse(JSON.stringify(o)),layers=['behind_body','between_body_front','in_front_body'];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function rotate(v,d){const a=d*Math.PI/180;return [v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];}
function defaults(r){const length=r?.scarf_length||32,width=r?.scarf_width||5.5;return {version:1,visible:true,tails:{a:{points:[[-length*.3,length*.15],[-length*.6,length*.3],[-length*.91,length*.43]],width,layer:'in_front_body'},b:{points:[[-length*.2,length*.18],[-length*.4,length*.43],[-length*.62,length*.63]],width:width*.9,layer:'in_front_body'}}};}
function state(p,r){return p.scarf||defaults(r);}
function ensure(p,r){return p.scarf??=defaults(r);}
function validate(p){if(p.scarf===undefined)return;const s=p.scarf,vector=v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<10000);if(!s||s.version!==1||typeof s.visible!=='boolean'||!s.tails||Array.isArray(s.tails)||Object.keys(s.tails).length!==2)throw Error('Invalid scarf state.');for(const id of ['a','b']){const t=s.tails[id];if(!t||!Array.isArray(t.points)||t.points.length!==3||t.points.some(v=>!vector(v))||!Number.isFinite(t.width)||t.width<=0||t.width>100||!layers.includes(t.layer))throw Error('Invalid scarf tail controls, width or layer.');}}
// Root follows the authored head's displacement from its view scaffold, while
// retaining independently authored scarf-root displacement. Head rotation does
// not rotate the neck attachment; torso rotation carries the local tail shapes.
function root(p,r){const expected=add(p.joints.torso,rotate(r.scarf_head_reference||rotate(sub(r.joints.head,r.joints.torso),-(r.neutral_torso_rotation||0)),p.torso_rotation));return add(p.joints.scarf_root,sub(p.joints.head,expected));}
function world(p,r,point){return add(root(p,r),rotate(point,p.torso_rotation));}
function local(p,r,point){return rotate(sub(point,root(p,r)),-p.torso_rotation);}
// A short Catmull-Rom centerline, sampled deterministically into a tapered broad
// polygon. Coincident controls use the nearest useful tangent; no simulation.
function ribbon(tail){const controls=[[0,0],...tail.points],samples=[];for(let i=0;i<3;i++){const a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(3,i+2)];for(let j=0;j<8;j++){const t=j/8;samples.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}samples.push(controls[3]);const left=[],right=[];let normal=[0,1];for(let i=0;i<samples.length;i++){const delta=sub(samples[Math.min(i+1,samples.length-1)],samples[Math.max(0,i-1)]),length=Math.hypot(...delta);if(length>1e-6)normal=[-delta[1]/length,delta[0]/length];const t=i/(samples.length-1),half=tail.width*.5*(t<.65?1:Math.max(0,(1-t)/.35));left.push(add(samples[i],normal.map(v=>v*half)));right.push(sub(samples[i],normal.map(v=>v*half)));}return [...left,...right.reverse()];}
function blend(out,a,b,t){if(!a.scarf&&!b.scarf){delete out.scarf;return;}const aa=state(a),bb=state(b),s=clone(t<.5?aa:bb);for(const id of ['a','b']){s.tails[id].points=aa.tails[id].points.map((v,i)=>v.map((n,k)=>n+(bb.tails[id].points[i][k]-n)*t));s.tails[id].width=aa.tails[id].width+(bb.tails[id].width-aa.tails[id].width)*t;}out.scarf=s;}
function mirror(out,p){if(!p.scarf)return;out.scarf=clone(p.scarf);for(const t of Object.values(out.scarf.tails))t.points=t.points.map(v=>[-v[0],v[1]]);}
const API={layers,defaults,state,ensure,validate,root,world,local,ribbon,blend,mirror};global.SolScarf=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
