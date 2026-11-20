const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const T=require('../tooling.js');
// Werkstoffgruppen
const g=title=>T.materialGroup({title});
assert.equal(g('Aluminiumguss'),'N');assert.equal(g('Stahlguss'),'P');assert.equal(g('Grauguss GJL-250'),'K');
assert.equal(g('Duplex 1.4462'),'M');assert.equal(g('X5CrNi18-10 1.4301'),'M');assert.equal(g('42CrMo4 vergütet'),'P');
assert.equal(g('Edelstahl V2A'),'M');assert.equal(g('Titan Grad 5'),'S');assert.equal(g('EN AW-6082'),'N');
// Programm
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=new Map([['cncos_demo_cleanup_v1','1'],['cncos_v03','{"orders":[{"id":"x"']]);const alerts=[],timers=[];
const element=()=>({innerHTML:'',textContent:'',style:{},append(){},insertAdjacentHTML(){},querySelectorAll(){return []}});
const sandbox={CncWorkflow:require('../workflow.js'),CncDisciplines:require('../disciplines.js'),CncGuide:require('../app-guide.js'),CncStock:require('../inventory-model.js'),CncTooling:T,console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout:f=>timers.push(f),clearTimeout(){},alert:m=>alerts.push(m),confirm(){return true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:'https://example.com/'}};
vm.createContext(sandbox);
const boot=source.slice(0,source.indexOf('// Workspace enhancements share'))+`globalThis.t={quoteCalc,inStatsPeriod,setStats(p){statsPeriod=p},releaseOrderReservations,restoreOrderReservations,setDB(d){db=Object.fromEntries(keys.map(k=>[k,d[k]||[]]))},getDB(){return db},localDay};})();`;
vm.runInContext(boot,sandbox);const a=sandbox.t;
// Beschädigte Daten: Kopie wird gesichert, Warnung wird angezeigt
assert.equal(storage.get('cncos_corrupt_backup'),'{"orders":[{"id":"x"');timers.forEach(f=>f());assert.equal(alerts.length,1);
// Preis: ganze Cent ohne Rechenfehler
a.setDB({materials:[{id:'m',qty:10,cost:1,unit:'Stk.'}],machines:[{id:'ma',title:'M',rate:0}]});
const base={id:'o',number:'A',qty:1,quoteMaterialId:'m',quoteMaterialQty:1,quoteMachineId:'ma',quoteHours:0,quoteMarkup:10};
const cents=v=>Math.round(v*100)===v*100||Math.abs(Math.round(v*100)-v*100)<1e-9;
const c=a.quoteCalc(base);assert.notEqual(c.suggested,null,'Preisvorschlag muss berechenbar sein');assert.equal(c.suggested,1.1);assert.ok(cents(c.suggested))
// Statistik: Zeitstempel kurz nach Mitternacht Ortszeit zählt zum lokalen Tag
a.setStats('today');const now=new Date();const midnightLocal=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,30).toISOString();
assert.equal(a.inStatsPeriod(midnightLocal),true);assert.equal(a.inStatsPeriod(a.localDay()),true);
// Reservierungen freigeben und wiederherstellen
const mat={id:'m',reserved:5};const o={reservations:[{materialId:'m',qty:3},{materialId:'m',qty:2}]};
a.setDB({materials:[mat]});const taken=a.releaseOrderReservations(o);assert.equal(a.getDB().materials[0].reserved,0);assert.equal(o.reservations.length,0);
a.restoreOrderReservations(o,taken);assert.equal(a.getDB().materials[0].reserved,5);assert.equal(o.reservations.length,2);
console.log('PASS: material groups, damaged-data backup, cent rounding, local-day statistics and reservation release/restore.');
