const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(source);
const storage=new Map([['cncos_demo_cleanup_v1','1']]);const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},append(){},insertAdjacentHTML(){},querySelectorAll(){return []}});return elements.get(id)};
const sandbox={console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout(){},clearTimeout(){},alert(){},confirm(){return false},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:'https://example.com/'}};
vm.createContext(sandbox);
const boot=source.slice(0,source.indexOf('// Workspace enhancements share'))+`globalThis.testAPI={keys,defs,parseRecordCode,recordQrUrl,recordScanActions,recordQrPanel,scanPage,scanFind,stockMove,quoteCalc,stockWarnings,knownNumber,machineRate,matchesOrderFilter,nextStatus,validateBackup,orderReadiness,tmsFree,setDB(data){db=Object.fromEntries(keys.map(k=>[k,data[k]||[]]))},getDB(){return db},dashboard,ordersPage,orderDossier,analyticsPage,dataPage,productionSchedule,searchEverywhere,modulePage,recordPage,areaPage,setTab(t){orderTab=t},receivePurchase,createPlanFromQuote,reserveOrder,testActions(){render=()=>{};toast=()=>{};openAction=(title,html,submit)=>{globalThis.actionSubmit=submit}}};})();`;
vm.runInContext(boot,sandbox);const a=sandbox.testAPI;
const mat={id:'m',title:'Aluminium',number:'MAT-1',qty:20,reserved:0,cost:5,unit:'Stk.'};const machine={id:'machine',title:'Fräse',rate:60};const order={id:'o',number:'CNC-1',title:'Platte',customer:'Test',status:'Anfrage',qty:10,quoteMaterialId:'m',quoteMaterialQty:10,quoteMachineId:'machine',quoteHours:2,setupHours:.5,quoteMarkup:20};
a.setDB({materials:[mat],machines:[machine],orders:[order]});
let q=a.quoteCalc(order);assert.equal(q.total,200);assert.equal(q.suggested,24);assert.equal(q.revenue,null);assert.equal(q.missing,0);
assert.equal(a.quoteCalc({...order,quoteMaterialQty:null}).total,null);assert.equal(a.quoteCalc({...order,quoteMachineId:'missing'}).total,null);assert.equal(a.quoteCalc({...order,quoteTools:[{id:'missing',qty:1}]}).total,null);
assert.equal(a.machineRate({annualHours:1000,lifeYears:5}),null,'Incomplete machine model must not become zero-cost');
assert.equal(a.machineRate({purchase:35000,annualHours:1000,lifeYears:5,maintenanceYear:1000,power:5000,electricity:.25,overheadHour:10,laborHour:20}),39.25);
mat.reserved=15;order.reservations=[{materialId:'m',qty:5}];assert.equal(a.quoteCalc(order).free,10,'Own reservation is available to this order');
mat.qty=15;mat.reserved=10;order.reservations=[];a.getDB().inventory.push({order:'CNC-1',type:'Entnahme',materialId:'m',qty:5});assert.equal(a.quoteCalc(order).free,5,'Free stock excludes consumed material');assert.equal(a.quoteCalc(order).consumed,5);assert.equal(a.quoteCalc(order).missing,0);
mat.qty=null;mat.min=5;assert.equal(a.stockWarnings().length,0);assert.equal(a.quoteCalc(order).stock,null);assert.equal(a.quoteCalc(order).missing,null);
mat.qty=0;assert.equal(a.stockWarnings().length,1);
a.setDB({tools:[{id:'t',qty:10}],toolassemblies:[{id:'a',components:[{id:'t',qty:3}]}]});assert.equal(a.tmsFree(a.getDB().tools[0]),7);
for(const status of ['Bezahlt','Ausgeliefert','Storniert','Abgelehnt'])assert.equal(a.matchesOrderFilter({status,due:'2020-01-01'},'urgent'),false);
assert.equal(a.matchesOrderFilter({status:'Fertig',due:'2020-01-01'},'overdue'),true);
assert.equal(a.nextStatus({status:'Wartet auf Material'}),null);assert.equal(a.nextStatus({status:'In Fertigung'}),'Qualitätsprüfung');
assert.throws(()=>a.validateBackup({orders:[{id:'x'},{id:'x'}]}));assert.throws(()=>a.validateBackup({orders:[],tools:'bad'}));assert.throws(()=>a.validateBackup({orders:[null]}));assert.equal(a.validateBackup({orders:[]}).orders.length,0);
// Render every order tab and the key screens with missing and populated data.
a.setDB({orders:[order],materials:[{...mat,qty:20,reserved:0}],machines:[machine]});
for(const tab of ['overview','quote','steps','docs','drawing','cost']){a.setTab(tab);const output=a.orderDossier(order);assert.ok(output.includes('Platte'));assert.ok(!output.includes('NaN'));}
for(const render of [a.dashboard,a.ordersPage,a.analyticsPage,a.dataPage,a.productionSchedule])assert.equal(typeof render(),'string');
a.getDB().orders[0].title='<img src=x onerror=alert(1)>';assert.ok(!a.searchEverywhere('img').includes('<img'));assert.ok(a.searchEverywhere('img').includes('&lt;img'));
a.setDB({});for(const render of [a.dashboard,a.ordersPage,a.analyticsPage,a.dataPage,a.productionSchedule])assert.equal(typeof render(),'string');
for(const k of a.keys){a.setDB({[k]:[{id:'record',title:'Example',number:'EX-1'}]});assert.equal(typeof a.recordPage(k,'record'),'string');if(k!=='orders')assert.equal(typeof a.modulePage(k),'string')}
for(const area of ['production','resources','office'])assert.equal(typeof a.areaPage(area),'string');
// Transactional actions: partial receipts and repeated plan creation.
a.testActions();a.setDB({materials:[{id:'mat',title:'Stock',qty:2}],purchasing:[{id:'po',title:'Buy',materialId:'mat',qty:10,order:'O-1',status:'Bestellt'}]});
a.receivePurchase('po');sandbox.actionSubmit({elements:{qty:{value:'4'}}});assert.equal(a.getDB().materials[0].qty,6);assert.equal(a.getDB().purchasing[0].receivedQty,4);assert.equal(a.getDB().purchasing[0].status,'Teilgeliefert');
a.receivePurchase('po');assert.throws(()=>sandbox.actionSubmit({elements:{qty:{value:'7'}}}));assert.equal(a.getDB().materials[0].qty,6);sandbox.actionSubmit({elements:{qty:{value:'6'}}});assert.equal(a.getDB().materials[0].qty,12);assert.equal(a.getDB().purchasing[0].status,'Geliefert');assert.equal(a.getDB().inventory.length,2);
a.setDB({orders:[order],machines:[machine]});a.createPlanFromQuote('o');sandbox.actionSubmit({elements:{title:{value:'CNC'}}});a.createPlanFromQuote('o');sandbox.actionSubmit({elements:{title:{value:'CNC updated'}}});assert.equal(a.getDB().planning.length,1);assert.equal(a.getDB().planning[0].hours,2.5);assert.equal(a.getDB().planning[0].title,'CNC updated');
console.log('PASS: calculations, incomplete data, reservations, consumption, tool allocations, workflow filters, backup validation, all order tabs, empty states, escaping, partial receipts and duplicate-plan prevention.');

// QR routes must never navigate to foreign sites or perform mutations.
for(const k of ['orders','machines','tools','materials','pdm','toolassemblies']){const id='part:with spaces/ä';assert.equal(a.parseRecordCode(a.recordQrUrl(k,id)).id,id);assert.equal(a.parseRecordCode(a.recordQrUrl(k,id)).k,k)}
for(const input of ['https://evil.example/#record=tools:x','javascript:alert(1)','#record=customers:x','#record=tools:%ZZ','https://example.com/other/#record=tools:x','#record=tools:'])assert.equal(a.parseRecordCode(input),null);
assert.equal(a.parseRecordCode('#order=OLD-1').number,'OLD-1');
a.setDB({materials:[{id:'mat',title:'Alu',qty:10,reserved:4}],tools:[{id:'tool',title:'Fräser',qty:5}],toolassemblies:[{id:'ass',components:[{id:'tool',qty:2}]}]});
a.testActions();a.stockMove('materials','mat','remove');
const movement=(qty,mode='remove')=>({elements:{qty:{value:String(qty)},mode:{value:mode},order:{value:''}}});
assert.throws(()=>sandbox.actionSubmit(movement(7)),/Nicht genügend/);assert.equal(a.getDB().materials[0].qty,10);
sandbox.actionSubmit(movement(2));assert.equal(a.getDB().materials[0].qty,8);assert.equal(a.getDB().inventory[0].materialId,'mat');
a.stockMove('tools','tool','remove');assert.throws(()=>sandbox.actionSubmit(movement(4)),/Nicht genügend/);sandbox.actionSubmit(movement(1));assert.equal(a.getDB().tools[0].qty,4);assert.equal(a.getDB().inventory.at(-1).toolId,'tool');
assert.match(a.recordPage('materials','mat'),/Bestand direkt buchen/);assert.match(a.recordPage('tools','tool'),/Schnittwerte/);assert.match(a.recordPage('tools','tool'),/QR-Etikett/);assert.match(a.scanPage(),/QR-Foto öffnen/);assert.match(a.scanFind('Fräser'),/tool/);
console.log('PASS: QR routes, foreign-link rejection, scan menu, record actions, stock reservations and tool movement IDs.');

assert.equal(a.parseRecordCode('#pdf=step:ag-1').pdfKind,'step');assert.equal(a.parseRecordCode('#pdf=bad:ag-1'),null);assert.equal(a.parseRecordCode('https://evil.example/#pdf=step:ag-1'),null);
