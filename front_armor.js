(function(g){
'use strict';const assets=g.SolFrontArmorAssets||(typeof require==='function'?require('./front_armor_assets.js'):{}),keys=Object.keys(assets);
function active(r,p){return p.body_view?.preset==='front'&&r.front_armor?.enabled!==false;}
function adjustment(r,key){return r.front_armor?.adjustments?.[key]||{offset:[0,0],scale:[1,1]};}
function ensure(r){return r.front_armor??={enabled:true,adjustments:{}};}
function validate(r){const s=r.front_armor;if(s===undefined)return;if(!s||typeof s.enabled!=='boolean'||!s.adjustments||Array.isArray(s.adjustments))throw Error('Invalid front armor settings.');for(const [key,a] of Object.entries(s.adjustments)){if(!keys.includes(key)||!a||!Array.isArray(a.offset)||a.offset.length!==2||a.offset.some(n=>!Number.isFinite(n)||Math.abs(n)>100)||!Array.isArray(a.scale)||a.scale.length!==2||a.scale.some(n=>!Number.isFinite(n)||n<.1||n>3))throw Error('Invalid front armor alignment.');}}
const API={assets,keys,active,adjustment,ensure,validate};g.SolFrontArmor=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
