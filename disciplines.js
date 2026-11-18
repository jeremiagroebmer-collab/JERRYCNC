(function(root){'use strict';
const names={cnc:'CNC-Fertigung',printing:'3D-Druck'};
function active(db){return names[db._discipline]?db._discipline:'cnc'}
function bare(db,keys){return Object.fromEntries(keys.map(k=>[k,db[k]||[]]))}
function switchTo(db,target,keys){if(!names[target])throw Error('Unbekannte Fachrichtung.');const from=active(db);if(target===from)return db;const others={...(db._disciplines||{})};const next=others[target]||Object.fromEntries(keys.map(k=>[k,[]]));delete others[target];others[from]=bare(db,keys);return {...bare(next,keys),_discipline:target,_disciplines:others}}
function scopeFromCode(raw,base){if(String(raw).startsWith('#'))return activeFromUrl(base);try{return activeFromUrl(new URL(raw,base).href)}catch{return 'cnc'}}
function activeFromUrl(url){const v=new URL(url).searchParams.get('fachrichtung');return names[v]?v:'cnc'}
function safePhoto(s){return typeof s==='string'&&s.length<900000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)?s:''}
const api={names,active,bare,switchTo,scopeFromCode,activeFromUrl,safePhoto};if(typeof module!=='undefined')module.exports=api;root.CncDisciplines=api;
})(typeof window!=='undefined'?window:globalThis);
