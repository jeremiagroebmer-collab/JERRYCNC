const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=new Map([['cncos_demo_cleanup_v1','1']]);const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},append(){},appendChild(){},insertAdjacentHTML(){},querySelectorAll(){return []}});return elements.get(id)};
let confirmAnswer=true,alerts=[];
const sandbox={CncWorkflow:require('../workflow.js'),CncDisciplines:require('../disciplines.js'),CncGuide:require('../app-guide.js'),CncStock:require('../inventory-model.js'),CncTooling:require('../tooling.js'),console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout(){},clearTimeout(){},alert:m=>alerts.push(m),confirm:()=>confirmAnswer,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:element,createElement:()=>({style:{}}),addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:'https://example.com/'}};
vm.createContext(sandbox);
let undo=null;sandbox.__capture=fn=>{undo=fn};
const boot=source.slice(0,source.indexOf('// Workspace enhancements share'))+`
globalThis.t={deleteRecord,setDB(data){db=Object.fromEntries(keys.map(k=>[k,data[k]||[]]))},getDB(){return db},setToast(f){toast=f;render=()=>{}}};})();`;
vm.runInContext(boot,sandbox);const a=sandbox.t;
a.setToast((msg,fn)=>{undo=fn});
const seed=()=>({
 materials:[{id:'m',title:'Alu',qty:10,reserved:3}],
 machines:[{id:'ma',title:'Fräse'}],
 orders:[{id:'o',number:'CNC-1',title:'Platte',reservations:[{materialId:'m',qty:3,unit:'Stk.'}]},{id:'o2',number:'CNC-2',title:'Andere'}],
 planning:[{id:'p1',order:'CNC-1',machine:'Fräse',status:'Geplant'},{id:'p2',order:'CNC-2',machine:'Fräse',status:'Abgeschlossen'}],
 quality:[{id:'q1',order:'CNC-1'}],time:[],inventory:[]
});
// 1) Auftrag löschen: Arbeitsgänge/Prüfungen weg, Reservierung freigegeben, fremde Daten unberührt
a.setDB(seed());a.deleteRecord('orders','o');let db=a.getDB();
assert.deepEqual(db.orders.map(o=>o.id),['o2']);assert.deepEqual(db.planning.map(p=>p.id),['p2']);assert.equal(db.quality.length,0);assert.equal(db.materials[0].reserved,0);
// 2) Rückgängig stellt alles wieder her
assert.equal(typeof undo,'function');undo();db=a.getDB();
assert.deepEqual(db.orders.map(o=>o.id).sort(),['o','o2']);assert.equal(db.planning.length,2);assert.equal(db.quality.length,1);assert.equal(db.materials[0].reserved,3);
// 3) Abbrechen im Dialog löscht nichts
a.setDB(seed());confirmAnswer=false;a.deleteRecord('orders','o');assert.equal(a.getDB().orders.length,2);confirmAnswer=true;
// 4) Auftrag mit Buchungen wird blockiert
const s4=seed();s4.time=[{id:'t1',order:'CNC-1',hours:2}];a.setDB(s4);alerts=[];a.deleteRecord('orders','o');assert.equal(a.getDB().orders.length,2);assert.equal(alerts.length,1);
// 5) Reserviertes Material und Maschine mit offenen Arbeitsgängen sind geschützt
a.setDB(seed());alerts=[];a.deleteRecord('materials','m');assert.equal(a.getDB().materials.length,1);
a.deleteRecord('machines','ma');assert.equal(a.getDB().machines.length,1);assert.equal(alerts.length,2);
// 6) Freie Einträge lassen sich löschen
a.setDB({customers:[{id:'c',title:'Kunde'}]});a.deleteRecord('customers','c');assert.equal(a.getDB().customers.length,0);
console.log('PASS: delete with confirmation, undo, cascading plans/quality, reservation release and blocking rules.');
