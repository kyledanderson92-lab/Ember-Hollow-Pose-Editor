(function(global){
'use strict';
function validate(value){
 if(value===null||value===undefined)return null;
 const r=JSON.parse(JSON.stringify(value));
 if(r.version!==1||typeof r.name!=='string'||r.name.length>200||typeof r.data_url!=='string'||r.data_url.length>5000000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(r.data_url))throw Error('Invalid raster reference image.');
 for(const key of ['x','y','width','height','scale','opacity'])if(!Number.isFinite(r[key]))throw Error('Invalid reference transform.');
 if(Math.abs(r.x)>100000||Math.abs(r.y)>100000||r.width<=0||r.height<=0||r.width>2000||r.height>2000||r.scale<.01||r.scale>100||r.opacity<0||r.opacity>1||typeof r.locked!=='boolean'||typeof r.visible!=='boolean')throw Error('Invalid reference settings.');
 if(r.flip_x!==undefined&&typeof r.flip_x!=='boolean')throw Error('Invalid reference flip setting.');
 return r;
}
function alignment(v){if(v===null||v===undefined)return null;if(!Array.isArray(v.character_offset)||v.character_offset.length!==2||v.character_offset.some(n=>!Number.isFinite(n)||Math.abs(n)>100000))throw Error('Invalid character alignment.');return {character_offset:[...v.character_offset]};}
const api={validate,alignment};global.SolReference=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
