(function(global){
'use strict';
// A directed forest augments the existing character joints. Geometry remains the
// source of anchor spans; projected physical bones provide displayed lengths.
// Rig coordinates remain the baseline source.
const copy=o=>JSON.parse(JSON.stringify(o)),add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),distance=(a,b)=>Math.hypot(...sub(a,b));
const M=()=>global.SolModel||(typeof require==='function'?require('./model.js'):null);
const EPS=1e-5;
function trunkTarget(p,id,target){
 if(id.endsWith('_shoulder'))return {id:'torso',target:add(p.joints.torso,sub(target,p.joints[id]))};
 if(id.endsWith('_hip')){const d=sub(target,p.joints[id]);return {id:'pelvis',target:add(p.root,[d[0]*p.facing,d[1]])};}
 return {id,target};
}
// Reattach legacy detached limbs as a unit, retaining bone shapes and gaps.
function attachRoots(p){
 const before=copy(p),extra=p.extra_segments||[];
 for(const side of ['left','right'])for(const limb of ['arm','leg']){
  const ids=(limb==='arm'?['shoulder','elbow','hand']:['hip','knee','foot']).map(id=>side+'_'+id),anchor=limb==='arm'?p.joints.torso:[0,0],delta=sub(anchor,p.joints[ids[0]]),moving=new Set([...ids,...ids.flatMap(id=>descendants(extra,id))]);
  for(const id of moving)p.joints[id]=add(p.joints[id],delta);
  p.joints[ids[0]]=copy(anchor);
 }
 const hand=(p.weapon_hand||'right')+'_hand';
 if(p.type==='geometric_sol_rig'||M().attachments.attachment(p).position_locked)p.joints.weapon_socket=add(before.joints.weapon_socket,sub(p.joints[hand],before.joints[hand]));
 return p;
}
function segments(p,r){const out=[];for(const side of ['left','right'])for(const limb of ['arm','leg']){const ids=limb==='arm'?['shoulder','elbow','hand']:['hip','knee','foot'];for(let i=0;i<2;i++){const start=side+'_'+ids[i],end=side+'_'+ids[i+1];out.push({id:side+'_'+(i?'lower':'upper')+'_'+limb,start,end,baseline_length:distance(r.joints[start],r.joints[end]),character:true});}}for(const s of p.extra_segments||[])out.push({...s,character:false});return out.map(s=>({...s,current_length:s.character?distance(...M().projection.bones(p,s.id.split('_')[0]+'_'+s.id.split('_')[2])[s.id.includes('_upper_')?0:1]):distance(p.joints[s.start],p.joints[s.end]),anchor_span:distance(p.joints[s.start],p.joints[s.end])}));}
function paths(edges){const children=new Map(),incoming=new Map();for(const e of edges){if(!children.has(e.start))children.set(e.start,[]);children.get(e.start).push(e);incoming.set(e.end,e);}const out=[];function walk(id,path){const next=children.get(id)||[];if(!next.length){out.push(path);return;}for(const e of next)walk(e.end,[...path,e]);}for(const id of children.keys())if(!incoming.has(id))walk(id,[]);return out;}
function endpoint(a,b,length){const d=sub(b,a),n=Math.hypot(...d);return add(a,(n>1e-10?d.map(v=>v/n):[0,1]).map(v=>v*length));}
function solve(points,lengths,target){const start=copy(points[0]),total=lengths.reduce((a,b)=>a+b,0),min=Math.max(0,2*Math.max(...lengths)-total),d=distance(start,target);if(d>total+EPS||d<min-EPS)return null;if(lengths.length===1)return Math.abs(d-lengths[0])>EPS?null:[start,copy(target)];if(Math.abs(d-total)<EPS){const out=[start];for(const length of lengths)out.push(endpoint(out.at(-1),add(out.at(-1),sub(target,start)),length));out[out.length-1]=copy(target);return out;}if(min>EPS&&Math.abs(d-min)<EPS){const out=[start],longest=lengths.indexOf(Math.max(...lengths)),direction=sub(target,start);lengths.forEach((length,i)=>out.push(endpoint(out.at(-1),add(out.at(-1),direction.map(v=>v*(i===longest?1:-1))),length)));out[out.length-1]=copy(target);return out;}if(lengths.length===2){const q=M().ik(start,target,...lengths,points[1]);return [start,q.joint,copy(target)];}
 let q=copy(points);if(d<total-EPS&&q.every(v=>Math.abs((v[0]-start[0])*(target[1]-start[1])-(v[1]-start[1])*(target[0]-start[0]))<1e-8))q[1][0]+=.01;
 for(let iteration=0;iteration<600;iteration++){q[q.length-1]=copy(target);for(let i=q.length-2;i>=0;i--)q[i]=endpoint(q[i+1],q[i],lengths[i]);q[0]=copy(start);for(let i=0;i<lengths.length;i++)q[i+1]=endpoint(q[i],q[i+1],lengths[i]);if(distance(q.at(-1),target)<EPS){q[q.length-1]=copy(target);return q;}}return null;
}
function worldTarget(p,before,id){return [(before.root[0]+before.joints[id][0]*before.facing-p.root[0])*p.facing,before.root[1]+before.joints[id][1]-p.root[1]];}
function socket(p,before){if(p.pins?.weapon_socket)return;const hand=M().weaponHand(p)+'_hand';p.joints.weapon_socket=add(p.joints[hand],sub(before.joints.weapon_socket,before.joints[hand]));}
function reconcile(p,r,before,lengths){const q=copy(p),edges=segments(q,r),fixed={};if(q.pins?.pelvis)q.root=copy(before.root);for(const [id,pin] of Object.entries(q.pins||{}))if(pin&&id!=='pelvis')fixed[id]=worldTarget(q,before,id);if(q.pins?.weapon_socket&&M().attachments.attachment(q).position_locked){const hand=M().weaponHand(q)+'_hand';fixed[hand]=worldTarget(q,before,hand);}for(const [id,v] of Object.entries(fixed))q.joints[id]=copy(v);
 const routes=paths(edges);for(let pass=0;pass<12;pass++)for(const route of routes){const ids=[route[0].start,...route.map(e=>e.end)];let begin=0;for(let i=1;i<ids.length;i++){if(!fixed[ids[i]]&&i!==ids.length-1)continue;const nodes=ids.slice(begin,i+1),lens=route.slice(begin,i).map(e=>lengths[e.id]);let solved;if(fixed[ids[i]])solved=solve(nodes.map(id=>q.joints[id]),lens,fixed[ids[i]]);else{solved=[copy(q.joints[nodes[0]])];for(let n=0;n<lens.length;n++)solved.push(endpoint(solved[n],add(solved[n],sub(q.joints[nodes[n+1]],q.joints[nodes[n]])),lens[n]));}if(!solved)return false;nodes.forEach((id,n)=>q.joints[id]=solved[n]);begin=i;}}
 if(edges.some(e=>Math.abs(distance(q.joints[e.start],q.joints[e.end])-lengths[e.id])>EPS*2)||Object.entries(fixed).some(([id,v])=>distance(q.joints[id],v)>EPS))return false;
 if(['left','right'].some(side=>distance(q.joints[side+'_shoulder'],q.joints.torso)>EPS||distance(q.joints[side+'_hip'],[0,0])>EPS))return false;
 const neck=M().projection.bodyBounds(p,'neck'),neckLength=distance(q.joints.torso,q.joints.head);if(neckLength<neck.min-EPS||neckLength>neck.max+EPS)return false;
 if(!M().projection.retargetMatch(p,q))return false;socket(q,p);M().attachments.apply(q,p);Object.assign(p,q);return true;
}
function lengths(p,r){return Object.fromEntries(segments(p,r).map(s=>[s.id,s.anchor_span]));}
function enforcePins(p,r,before){for(const e of p.extra_segments||[]){if(before.joints[e.end]&&distance(p.joints[e.end],before.joints[e.end])<1e-10&&!p.pins?.[e.end])p.joints[e.end]=add(before.joints[e.end],sub(p.joints[e.start],before.joints[e.start]));}if(!Object.values(p.pins||{}).some(Boolean)){const manualSocket=distance(p.joints.weapon_socket,before.joints.weapon_socket)>1e-10&&distance(p.joints[M().weaponHand(p)+'_hand'],before.joints[M().weaponHand(before)+'_hand'])<1e-10&&distance(p.root,before.root)<1e-10&&p.facing===before.facing;M().attachments.apply(p,before,manualSocket);return true;}const wanted=lengths(before,r),current=lengths(p,r);for(const key of Object.keys(p.limb_modes||{}))if(before.limb_modes?.[key])for(const e of segments(p,r))if(e.id.startsWith(key.split('_')[0]+'_')&&e.id.endsWith('_'+key.split('_')[1]))wanted[e.id]=current[e.id];return reconcile(p,r,before,wanted);}
function descendants(edges,id){const out=[];for(const e of edges.filter(e=>e.start===id)){out.push(e.end,...descendants(edges,e.end));}return out;}
// Body/root drags project the cursor onto the feasible anchored-chain region.
// In 2D its closest point is the cursor, a radial circle projection, or a pair
// of reach-circle intersections. Unlike rejecting a move, this keeps following
// cursor direction around the boundary, including the intersection of two feet.
function nearestReach(target,limits){
 const valid=v=>limits.every(c=>{const d=distance(v,c.center);return d<=c.max+EPS*.1&&d>=c.min-EPS*.1;}),candidates=[copy(target),[0,0]],circles=[];
 for(const c of limits)for(const radius of c.min>0?[c.min,c.max]:[c.max]){
  circles.push({center:c.center,radius});
  const axis=sub(target,c.center),n=Math.hypot(...axis),fallback=sub([0,0],c.center),fn=Math.hypot(...fallback),u=n>1e-10?axis.map(x=>x/n):fn>1e-10?fallback.map(x=>x/fn):[0,1];
  candidates.push(add(c.center,u.map(x=>x*radius)));
 }
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
  const a=circles[i],b=circles[j],delta=sub(b.center,a.center),d=Math.hypot(...delta);
  if(d<1e-10||d>a.radius+b.radius+EPS||d<Math.abs(a.radius-b.radius)-EPS)continue;
  const along=(a.radius*a.radius-b.radius*b.radius+d*d)/(2*d),height=Math.sqrt(Math.max(0,a.radius*a.radius-along*along)),u=delta.map(x=>x/d),base=add(a.center,u.map(x=>x*along));
  for(const sign of [-1,1])candidates.push(add(base,[-u[1]*height*sign,u[0]*height*sign]));
 }
 return candidates.filter(valid).sort((a,b)=>distance(a,target)-distance(b,target))[0]||null;
}
function moveBody(p,r,id,target){
 const mapped=trunkTarget(p,id,target);id=mapped.id;target=mapped.target;
 if(id==='head')target=M().projection.constrainBody(p,'neck',target);
 const before=copy(p),edges=segments(before,r),routes=paths(edges),moving=new Set(id==='pelvis'?Object.keys(before.joints):id==='torso'?['head','left_shoulder','right_shoulder','scarf_root','weapon_socket']: [id]);
 const requested=id==='pelvis'?[(target[0]-before.root[0])*before.facing,target[1]-before.root[1]]:sub(target,before.joints[id]),limits=[],pins={...before.pins};
 if(id==='pelvis'&&pins.pelvis)return true;
 if(pins.weapon_socket&&M().attachments.attachment(before).position_locked)pins[M().weaponHand(before)+'_hand']=true;
 for(const route of routes){
  const start=route[0].start;if(!moving.has(start))continue;
  const ids=[start,...route.map(e=>e.end)],index=ids.findIndex(key=>pins[key]);if(index<0)continue;
  const lens=route.slice(0,index).map(e=>e.anchor_span),total=lens.reduce((a,b)=>a+b,0),min=lens.length?Math.max(0,2*Math.max(...lens)-total):0;
  limits.push({center:sub(before.joints[ids[index]],before.joints[start]),min,max:total});
 }
 if(id==='torso'){const b=M().projection.bodyBounds(before,'torso');limits.push({center:sub([0,0],before.joints.torso),min:b.min,max:b.max});}
 const delta=nearestReach(requested,limits);if(!delta)return false;
 if(id==='pelvis')p.root=add(before.root,[delta[0]*before.facing,delta[1]]);
 else M().move(p,r,id,add(before.joints[id],delta),false);
 if(!enforcePins(p,r,before)){Object.assign(p,before);return false;}return true;
}
function move(p,r,id,target,chainIK=true){if(id==='torso'||id==='head'||/_(shoulder|hip)$/.test(id))return moveBody(p,r,id,target);if(p.pins?.[id])return false;if(/_(elbow|knee)$/.test(id)&&p.limb_modes?.[id.split('_')[0]+(id.endsWith('elbow')?'_arm':'_leg')])return false;if(M().projection.mode(p,id))return chainIK?M().projection.move(p,r,id,target):M().projection.moveLower(p,r,id,target);const before=copy(p),edges=segments(p,r),incoming=new Map(edges.map(e=>[e.end,e]));let edge=incoming.get(id);
 if(!edge){M().move(p,r,id,target,false);for(const e of edges.filter(e=>!e.character))p.joints[e.end]=add(before.joints[e.end],sub(p.joints[e.start],before.joints[e.start]));}
 else{const route=[edge];while(chainIK&&!p.pins?.[edge.start]&&incoming.has(edge.start)){edge=incoming.get(edge.start);route.unshift(edge);}const ids=[route[0].start,...route.map(e=>e.end)],lens=route.map(e=>e.anchor_span),base=p.joints[ids[0]],total=lens.reduce((a,b)=>a+b,0),min=Math.max(0,2*Math.max(...lens)-total),d=distance(base,target);let aim=target;if(d>total||d<min)aim=endpoint(base,target,Math.max(min,Math.min(total,d)));let solution=solve(ids.map(id=>p.joints[id]),lens,aim);if(!solution)return false;ids.forEach((key,i)=>p.joints[key]=solution[i]);const changed=new Set(ids);for(const key of ids.slice(1)){const delta=sub(p.joints[key],before.joints[key]);for(const child of descendants(edges,key))if(!changed.has(child))p.joints[child]=add(before.joints[child],delta);}}
 if(id!=='weapon_socket')socket(p,before);M().attachments.apply(p,before,id==='weapon_socket');if(!reconcile(p,r,before,lengths(before,r))){Object.assign(p,before);return false;}return true;
}
function setLengths(p,r,changes){const before=copy(p),known=new Set(segments(p,r).map(e=>e.id));if(Object.entries(changes).some(([id,v])=>!known.has(id)||!Number.isFinite(v)||v<.1||v>1000))return false;for(const key of new Set([...Object.keys(p.limb_modes||{}),...Object.keys(p.limb_gaps||{})]))if(Object.keys(changes).some(id=>id.startsWith(key.split('_')[0]+'_')&&id.endsWith('_'+key.split('_')[1]))){if(!M().projection.reconnect(p,key)){Object.assign(p,before);return false;}}const desired=lengths(p,r);for(const [id,value] of Object.entries(changes)){if(!(id in desired)||!Number.isFinite(value)||value<.1||value>1000)return false;desired[id]=value;}const ok=reconcile(p,r,before,desired);if(ok){for(const key of Object.keys(before.limb_modes||{}))if(!p.limb_modes?.[key]){try{M().projection.capture(p,key);if(before.limb_modes[key].allow_extension===false)p.limb_modes[key].allow_extension=false;if(before.limb_modes[key].stretch_segments)p.limb_modes[key].stretch_segments=true;}catch{}}}else Object.assign(p,before);return ok;}
function limbSegments(p,r,id){const edges=segments(p,r),edge=edges.find(e=>e.id===id);if(!edge)return [];let start=edge.start,parent;while((parent=edges.find(e=>e.end===start)))start=parent.start;return edges.filter(e=>e.start===start||descendants(edges,start).includes(e.start));}
function validate(p){const extra=p.extra_segments===undefined?[]:p.extra_segments;if(!Array.isArray(extra)||extra.length>64)throw Error('Invalid extra segments.');const known=new Set(M().names),ids=new Set();for(const s of extra){if(!s||!/^extra_segment_[1-9][0-9]*$/.test(s.id)||ids.has(s.id)||!/^extra_anchor_[1-9][0-9]*$/.test(s.end)||known.has(s.end)||!known.has(s.start)||!Number.isFinite(s.baseline_length)||s.baseline_length<.1||s.baseline_length>1000)throw Error('Invalid connected segment (parent must precede child).');const v=p.joints[s.end];if(!Array.isArray(v)||v.length!==2||!v.every(n=>Number.isFinite(n)&&Math.abs(n)<10000)||distance(p.joints[s.start],v)<.1- EPS)throw Error('Invalid segment endpoint.');ids.add(s.id);known.add(s.end);}for(const id of Object.keys(p.joints))if(!known.has(id))throw Error('Orphaned anchor.');}
const other=id=>id.startsWith('left_')?id.replace('left_','right_'):id.startsWith('right_')?id.replace('right_','left_'):id;
function mirror(out,p){if(p.extra_segments)out.extra_segments=p.extra_segments.map(e=>({...e,start:other(e.start)}));}
function swap(p,kind){const affected=id=>/_(shoulder|elbow|hand|hip|knee|foot)$/.test(id)&&(kind==='all'||(kind==='arm'?/_(shoulder|elbow|hand)$/.test(id):/_(hip|knee|foot)$/.test(id))),released=new Set(),before=copy(p);for(const e of p.extra_segments||[])if(M().names.includes(e.start)&&affected(e.start)){const ids=[e.end,...descendants(p.extra_segments,e.end)],delta=sub(before.joints[other(e.start)],before.joints[e.start]);e.start=other(e.start);for(const id of ids){p.joints[id]=add(before.joints[id],delta);released.add(id);}}for(const id of Object.keys(p.pins||{}))if(affected(id)||released.has(id))delete p.pins[id];}
function compatible(a,b){if(JSON.stringify(a.extra_segments||[])!==JSON.stringify(b.extra_segments||[]))throw Error('Blend needs matching added segment topology and baselines.');}
function blend(out,a,b,t){for(const e of out.extra_segments||[]){const aa=M().angle(a.joints[e.start],a.joints[e.end]),ab=M().angle(b.joints[e.start],b.joints[e.end]),l=distance(a.joints[e.start],a.joints[e.end])*(1-t)+distance(b.joints[e.start],b.joints[e.end])*t;out.joints[e.end]=M().endpoint(out.joints[e.start],l,M().blendAngle(aa,ab,t));}}
function reconcilePins(p,r,before){return reconcile(p,r,before,lengths(p,r));}
const API={trunkTarget,attachRoots,segments,paths,move,moveBody,setLengths,limbSegments,nearestReach,enforcePins,reconcilePins,validate,mirror,swap,compatible,blend};global.SolChains=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
