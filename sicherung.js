/* CNC OS automatische Tagessicherung: pro Tag eine Kopie im Browser (IndexedDB), die letzten 7 bleiben. */
(function(root){
'use strict';
const NAME='cncos_backups',STORE='snaps';
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'day'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const wait=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const store=(db,mode)=>db.transaction(STORE,mode).objectStore(STORE);
// Welche Tage müssen weg, damit nur die neuesten "keep" bleiben?
function excess(days,keep=7){return days.slice().sort((a,b)=>String(b).localeCompare(String(a))).slice(Math.max(0,keep))}
const validDay=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''));
async function all(){const db=await open();try{const rows=await wait(store(db,'readonly').getAll());return rows.sort((a,b)=>b.day.localeCompare(a.day))}finally{db.close()}}
// Legt höchstens eine Kopie pro Tag an. Gibt true zurück, wenn eine neue entstanden ist.
async function daily(payload,today,keep=7){
 if(!payload||typeof payload!=='string'||!validDay(today))return false;
 const db=await open();
 try{
  const days=await wait(store(db,'readonly').getAllKeys());
  if(days.includes(today))return false;
  await wait(store(db,'readwrite').put({day:today,at:new Date().toISOString(),size:payload.length,payload}));
  for(const d of excess([...days,today],keep))await wait(store(db,'readwrite').delete(d));
  return true;
 }finally{db.close()}
}
const api={excess,all,daily};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncSicherung=api;
})(typeof window!=='undefined'?window:globalThis);
