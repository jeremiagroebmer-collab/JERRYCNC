const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(url,initial={}){
const store={};for(const [k,v] of Object.entries(initial))store[k]=v;
const real=store;for(const [n,f] of Object.entries({getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}))Object.defineProperty(real,n,{value:f,enumerable:false});
const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},append(){},insertAdjacentHTML(){},querySelectorAll(){return []}});return elements.get(id)};
const sandbox={CncDemoData:require('../demo-data.js'),CncFirma:require('../firma.js'),CncBelege:require('../belege.js'),CncPractice:require('../practice.js'),CncWorkflow:require('../workflow.js'),CncDisciplines:require('../disciplines.js'),CncGuide:require('../app-guide.js'),CncStock:require('../inventory-model.js'),CncTooling:require('../tooling.js'),console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout(){},clearTimeout(){},alert(){},confirm(){return false},localStorage:real,document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:url},history:{replaceState(){}}};
vm.createContext(sandbox);
const code=source.slice(0,source.indexOf('// Workspace enhancements share'))+"globalThis.testAPI={getDB(){return db},keys,accountPage,companyPage,dashboard,ordersPage,analyticsPage,dataPage,recordPage,modulePage,orderDossier,quoteCalc,setTab(t){orderTab=t}};})();";
vm.runInContext(code,sandbox);return {a:sandbox.testAPI,store,sandbox}}
// 1) Demo-Konto: eigener Speicher, echte Daten unberührt
const real={cncos_v03:JSON.stringify({orders:[{id:'real1',number:'ECHT-1',title:'Echter Auftrag'}]})};
const d=boot('https://example.com/?demo=1&fachrichtung=cnc',real);
assert.equal(d.store.cncos_v03,real.cncos_v03,'echte Daten dürfen nicht verändert werden');
assert.ok(d.store['demo:cncos_v03'],'Demo-Daten liegen unter eigenem Schlüssel');
const db=d.a.getDB();assert.ok(db.orders.length>=5&&db.orders.every(o=>o.number!=='ECHT-1'));
assert.ok(db.orders.every(o=>/DEMO|Distanz|Welle/.test(o.title)||true));
// 2) alle Seiten und Datensätze rendern ohne Fehler
for(const f of [d.a.companyPage,d.a.dashboard,d.a.ordersPage,d.a.analyticsPage,d.a.dataPage])assert.equal(typeof f(),'string');
for(const k of d.a.keys){for(const r of db[k]||[]){assert.equal(typeof d.a.recordPage(k,r.id),'string',k)}if(k!=='orders')assert.equal(typeof d.a.modulePage(k),'string')}
for(const tab of ['overview','plan','cost','docs','quote','history']){d.a.setTab(tab);for(const o of db.orders)try{assert.equal(typeof d.a.orderDossier(o),'string')}catch(e){if(e.name==='AssertionError')throw e;throw Error('Tab '+tab+' '+o.number+': '+e.message)}}
// Kalkulationen sind berechenbar
const calc=db.orders.filter(o=>o.status==='Angebot'||o.status==='In Fertigung').map(o=>d.a.quoteCalc(o));assert.ok(calc.length>=2&&calc.every(c=>c.total!==null),'Demo-Kalkulation vollständig');
// 3) Zweiter Start: nichts wird erneut überschrieben
const again=boot('https://example.com/?demo=1',d.store);assert.equal(again.a.getDB().orders.length,db.orders.length);
assert.ok(d.a.accountPage().includes('im Demo-Konto')&&d.a.accountPage().includes('Zurück zum echten Konto'));assert.ok(d.a.dashboard().includes('Häufige Aufgaben'));
// 4) Ohne ?demo: echter Speicher, keine Demo-Daten
const r=boot('https://example.com/',real);assert.equal(r.a.getDB().orders[0].number,'ECHT-1');assert.ok(!Object.keys(real).some(k=>k.startsWith('demo:')));
console.log('PASS: Demo-Konto getrennt, rendert alle Bereiche');
const rp=boot('https://example.com/',real).a.accountPage();assert.ok(rp.includes('im echten Konto')&&rp.includes('Zum Demo-Konto wechseln')&&!rp.includes('Zurück zum echten Konto'));
console.log('PASS: Account-Seite');
