const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=new Map([['cncos_demo_cleanup_v1','1']]);const toasts=[];
const el={innerHTML:'',textContent:'',style:{},append(){},insertAdjacentHTML(){},insertAdjacentElement(_,p){this.child=p},querySelectorAll(){return []}};
const sandbox={CncWorkflow:require('../workflow.js'),CncDisciplines:require('../disciplines.js'),CncGuide:require('../app-guide.js'),CncStock:require('../inventory-model.js'),CncTooling:require('../tooling.js'),console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout(){},clearTimeout(){},alert(){},confirm(){return true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:()=>el,createElement:()=>({style:{},setAttribute(){}}),addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:'https://example.com/'}};
vm.createContext(sandbox);
const boot=source.slice(0,source.indexOf('// Workspace enhancements share'))+`globalThis.t={changeOrderStatus,wfAction,validateBackup,fieldsInFormOrder,formError,defs,setDB(d){db=Object.fromEntries(keys.map(k=>[k,d[k]||[]]))},getDB(){return db},hook(){render=()=>{};toast=m=>{globalThis.lastToast=m}}};})();`;
vm.runInContext(boot,sandbox);const a=sandbox.t;a.hook();
// Statusregeln
for(const status of ['Abgelehnt','Storniert']){a.setDB({orders:[{id:'o',number:'A',status}]});a.changeOrderStatus('o','In Fertigung');assert.equal(a.getDB().orders[0].status,status,'geschlossener Auftrag bleibt unverändert')}
a.setDB({orders:[{id:'o',number:'A',status:'Storniert'}]});a.changeOrderStatus('o','Anfrage');assert.equal(a.getDB().orders[0].status,'Anfrage');
a.setDB({orders:[{id:'o',number:'A',status:'Ausgeliefert'}]});a.changeOrderStatus('o','In Fertigung');assert.equal(a.getDB().orders[0].status,'Ausgeliefert');a.changeOrderStatus('o','Bezahlt');assert.equal(a.getDB().orders[0].status,'Bezahlt');
a.setDB({orders:[{id:'o',number:'A',status:'In Fertigung',productionReleased:true,offerSnapshot:{}}]});
assert.throws(()=>a.wfAction('accept','o'),/bereits bestätigt/);assert.throws(()=>a.wfAction('reject','o'),/läuft schon/);assert.equal(a.getDB().orders[0].status,'In Fertigung');
// Backup: Zahlen werden geprüft
const ok={orders:[{id:'o'}],materials:[{id:'m',qty:5,reserved:1}]};assert.ok(a.validateBackup(ok));
assert.throws(()=>a.validateBackup({orders:[],materials:[{id:'m',qty:-100}]}),/Negativer Wert/);
assert.throws(()=>a.validateBackup({orders:[],materials:[{id:'m',reserved:'x'}]}),/Ungültiger Zahlenwert/);
assert.throws(()=>a.validateBackup({orders:[],tools:[{id:'t',cost:'abc'}]}),/Ungültiger Zahlenwert/);
// Werkzeug-Formular: Pflichtfelder zuerst, andere Bereiche unverändert
const order=a.fieldsInFormOrder('tools',a.defs.tools.fields).slice(0,3).map(f=>f[0]);assert.equal(order.join(),'componentType,subtype,title');
assert.equal(a.fieldsInFormOrder('orders',a.defs.orders.fields).map(f=>f[0]).join(),a.defs.orders.fields.map(f=>f[0]).join());
a.formError('Bitte ergänzen: Bezeichnung.');
// Stempeluhr bucht auf den Starttag
assert.ok(html.includes('date:localDay(new Date(clockSession.start))'));
console.log('PASS: status rules, accept/reject guards, backup number checks, required-first tool form, inline form errors and clock start day.');
