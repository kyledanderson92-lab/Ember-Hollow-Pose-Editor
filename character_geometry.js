(function(global){
'use strict';
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],distance=(a,b)=>Math.hypot(...sub(a,b));
function rotate(p,degrees){const a=degrees*Math.PI/180;return [p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];}
function cubic(a,b,c,d,t){const u=1-t;return [0,1].map(i=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]);}
function sampleCurve(curve,steps=8){const points=[curve.nodes[0].point.slice()],count=curve.closed?curve.nodes.length:curve.nodes.length-1;for(let i=0;i<count;i++){const a=curve.nodes[i],b=curve.nodes[(i+1)%curve.nodes.length];for(let j=1;j<=steps;j++)points.push(cubic(a.point,add(a.point,a.out),add(b.point,b.in),b.point,j/steps));}if(curve.closed)points.pop();return points;}
function isSimple(points){const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];for(let j=i+2;j<points.length;j++){if(i===0&&j===points.length-1)continue;const c=points[j],d=points[(j+1)%points.length];if(cross(a,b,c)*cross(a,b,d)<-1e-12&&cross(c,d,a)*cross(c,d,b)<-1e-12)return false;}}return true;}
const API={sampleCurve,cubic,isSimple,rotate,add,sub};global.SolGeometry=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
