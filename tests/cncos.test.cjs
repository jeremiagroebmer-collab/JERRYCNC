const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(source);
const storage=new Map([['cncos_demo_cleanup_v1','1']]);const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},append(){},insertAdjacentHTML(){},querySelectorAll(){return []}});return elements.get(id)};
const sandbox={CncFirma:require('../firma.js'),CncWorkflow:require('../workflow.js'),CncDisciplines:require('../disciplines.js'),CncGuide:require('../app-guide.js'),CncStock:require('../inventory-model.js'),CncTooling:require('../tooling.js'),console,Date,Intl,URL,Blob,structuredClone,crypto:require('node:crypto').webcrypto,setTimeout(){},clearTimeout(){},alert(){},confirm(){return false},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}},location:{hash:'',href:'https://example.com/'}};
vm.createContext(sandbox);
const boot=source.slice(0,source.indexOf('// Workspace enhancements share'))+`globalThis.testAPI={companyPage,quoteSummary,wfAction,wfCosts,wfEditTime,wfStepForm,codeScope,discipline,visualPanel,thumbnail,navigationHome,helpPage,helpResults,machineCostsPage,parentAreas,destinationName,nextRecordNumber,ensureRecordNumbers,componentCandidates,findComponent,addAssemblyComponent,keys,defs,parseRecordCode,recordQrUrl,recordScanActions,recordQrPanel,scanPage,scanFind,stockMove,quoteCalc,stockWarnings,knownNumber,machineRate,matchesOrderFilter,nextStatus,validateBackup,orderReadiness,tmsFree,setDB(data){db=Object.fromEntries(keys.map(k=>[k,data[k]||[]]))},getDB(){return db},dashboard,ordersPage,orderDossier,analyticsPage,dataPage,productionSchedule,searchEverywhere,modulePage,recordPage,areaPage,setTab(t){orderTab=t},receivePurchase,createPlanFromQuote,reserveOrder,testActions(){render=()=>{};toast=()=>{};openAction=(title,html,submit)=>{globalThis.actionSubmit=submit}}};})();`;
vm.runInContext(boot,sandbox);const a=sandbox.testAPI;
a.setDB({finance:[{id:'f1',type:'Ausgabe',amount:100,repeat:'Monatlich',date:'2026-10-01'}],settings:[{id:'s1',title:'Kontostand',value:'50',notes:'2026-11-20'}],orders:[{id:'o9',number:'A9',customer:'K',qty:2,price:10}]});const cp=a.companyPage();assert.equal(typeof cp,'string');assert.ok(cp.includes('Gewinnschwelle')&&cp.includes('Vorschau'));a.setDB({});assert.equal(typeof a.companyPage(),'string');console.log('PASS: company page');
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
for(const k of a.keys){const id='part:with spaces/ä';assert.equal(a.parseRecordCode(a.recordQrUrl(k,id)).id,id);assert.equal(a.parseRecordCode(a.recordQrUrl(k,id)).k,k)}
for(const input of ['https://evil.example/#record=tools:x','javascript:alert(1)','#record=unknown:x','#record=tools:%ZZ','https://example.com/other/#record=tools:x','#record=tools:'])assert.equal(a.parseRecordCode(input),null);
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

// Component selection and stock constraints; legacy numbers and QR IDs remain stable.
a.setDB({tools:[{id:'holder',number:'WZ-00001',title:'Halter',componentType:'Halter',subtype:'Schrumpffutter',interface:'HSK-A40',qty:2,role:'Aufnahme/Futter',system:'Schrumpffutter',inKind:'Maschinenkegel',inSize:'SK40',outKind:'Zylinderschaft',minDiameter:12,maxDiameter:12,acceptShaft:'glatt'},{id:'cutter',title:'Fräser',componentType:'Schneidwerkzeug',subtype:'Fräser',qty:1}],machines:[{id:'machine',title:'Fräse',spindle:'SK40'}],toolassemblies:[{id:'assembly',title:'Montage',machineId:'machine'}]});
assert.equal(a.ensureRecordNumbers(),true);assert.equal(a.ensureRecordNumbers(),false);assert.equal(a.getDB().tools[0].number,'WZ-00001');assert.equal(a.getDB().tools[1].number,'WZ-00002');assert.ok(a.getDB().machines[0].number);
assert.equal(a.componentCandidates('Halter','Schrumpffutter','SK40').length,1);assert.equal(a.componentCandidates('Halter','Bohrer').length,0);
assert.equal(a.findComponent('wz-00001').id,'holder');assert.equal(a.findComponent(a.recordQrUrl('tools','holder')).id,'holder');assert.throws(()=>a.findComponent(a.recordQrUrl('machines','machine')));assert.throws(()=>a.findComponent('https://evil.example/#record=tools:holder'));
const assembly=a.getDB().toolassemblies[0];a.addAssemblyComponent(assembly,'holder',1);assert.equal(a.tmsFree(a.getDB().tools[0]),1);assert.throws(()=>a.addAssemblyComponent(assembly,'holder',2));assert.throws(()=>a.addAssemblyComponent(assembly,'holder',0.5));assert.throws(()=>a.addAssemblyComponent(assembly,'holder',1));assert.equal(assembly.components.length,1);assert.equal(assembly.components[0].qty,1);
a.getDB().tools[1].qty=null;assert.throws(()=>a.addAssemblyComponent(assembly,'cutter',1));
console.log('PASS: automatic numbers, preserved legacy IDs, category/interface filters, number/QR lookup and guarded component allocation.');
// Navigation is task-based and all help destinations resolve without role filters.
const guide=require('../app-guide.js');
const routes=new Set([...a.keys,'home','all','disciplines','resources','production','files','office','costs','admin','help','clock','documents','machinecost','analytics','company','data','scan']);
for(const area of Object.values(guide.areas))for(const [,items] of area.groups)for(const key of items)assert(routes.has(key),key);
for(const entry of guide.articles){assert(routes.has(entry.nav),entry.id);assert(entry.steps.length>1);}
for(const [q,id] of [['Datei anlegen','file'],['Werkzeug erstellen','tool'],['Werkzeug zusammenbauen','assembly'],['Teamcenter','drawing'],['Rollen Kilogramm','printing'],['Stundensatz','rate']])assert(guide.search(q).some(x=>x.id===id),q);
assert.equal(a.defs.pdm.name,'Zeichnungen & Bauteile');assert.equal(a.parentAreas.maintenance,'production');assert.equal(a.parentAreas.cam,'files');
a.setDB({machines:[{id:'navmachine',number:'MA1',title:'Testfräse',type:'Fanuc',spindle:'SK40',rate:60,purchase:35000}]});
const machinePage=a.recordPage('machines','navmachine');assert(!machinePage.includes('Anschaffung'));assert(!machinePage.includes('Kalkulationssatz'));assert(machinePage.includes('Maschinenkosten &amp; Stundensätze'));assert(a.machineCostsPage().includes('Kostendaten bearbeiten'));
assert(a.navigationHome().includes('Hilfe &amp; Anleitungen'));assert(a.helpPage().includes('helpSearch'));
console.log('PASS: task navigation, all tutorial destinations, German search and isolated machine/cost views.');
assert.equal(guide.search('Datei anlegen')[0].id,'file','Exact title match must precede incidental mentions');
// A whole backup/cloud payload retains both independent disciplines and photos.
const D=require('../disciplines.js');const oldData=Object.fromEntries(a.keys.map(k=>[k,[]]));oldData.machines.push({id:'old-machine',number:'MA-00001',title:'Fräse',rate:60});oldData.materials.push({id:'old-material',qty:12,photo:'data:image/jpeg;base64,YWJj'});
let split=D.switchTo(oldData,'printing',a.keys);assert.equal(split.materials.length,0);split.materials.push({id:'filament',qty:3,rolls:4});
split=a.validateBackup(JSON.parse(JSON.stringify(split)));assert.equal(split._disciplines.cnc.machines[0].rate,60);let back=D.switchTo(split,'cnc',a.keys);assert.equal(back.materials[0].qty,12);assert.equal(back.materials[0].photo,'data:image/jpeg;base64,YWJj');assert.equal(back._disciplines.printing.materials[0].rolls,4);
a.setDB(back);Object.assign(a.getDB(),{_discipline:'cnc',_disciplines:back._disciplines});assert.equal(a.codeScope({k:'materials',id:'filament'},'https://example.com/?fachrichtung=printing#record=materials:filament'),'printing');assert.equal(a.codeScope({k:'materials',id:'filament'},'https://example.com/#record=materials:filament'),'printing');assert.equal(a.codeScope({k:'machines',id:'old-machine'},'https://example.com/?fachrichtung=printing#record=machines:old-machine'),'cnc');
assert.equal(D.safePhoto('javascript:alert(1)'), '');assert.equal(D.safePhoto('data:image/svg+xml;base64,YWJj'),'');assert.equal(D.safePhoto('data:image/jpeg;base64,YWJj'),'data:image/jpeg;base64,YWJj');
assert.throws(()=>a.validateBackup({...oldData,_discipline:'other'}));assert.throws(()=>a.validateBackup({...oldData,_disciplines:{printing:{...oldData,_disciplines:{cnc:oldData}}}}));
assert(a.recordQrUrl('machines','old-machine').includes('fachrichtung=cnc'));
console.log('PASS: separate disciplines, legacy data, combined backup, photos, old and scoped QR routing.');

// Guided release is blocked until acceptance; parallel predecessors gate production.
a.testActions();
const guided={id:'wf',number:'WF-1',title:'Guided',qty:10,status:'Angebot',workflowVersion:1,noMaterial:true,offerSnapshot:{revenue:200,cost:100,price:20}};
const mk=(id,kind,dependsOn=[])=>({id,orderId:'wf',order:'WF-1',title:kind,kind,setupMin:0,runMin:10,timeBasis:'lot',rateOverride:60,status:'Geplant',dependsOn});
const saw=mk('saw','Sägen'),cam=mk('cam','CAM-Programmierung'),mill=mk('mill','Fräsen',['saw','cam']),ship=mk('ship','Versand',['mill']);
a.setDB({orders:[guided],planning:[saw,cam,mill,ship]});
assert.throws(()=>a.wfAction('release','wf'),/Kundenannahme/);a.wfAction('accept','wf');a.wfAction('release','wf');assert.equal(guided.productionReleased,true);
assert.throws(()=>a.wfAction('finish','mill'),/Vorgänger/);
for(const p of [saw,cam,mill,ship]){a.getDB().time.push({id:'t-'+p.id,order:'WF-1',stepId:p.id,hours:1,hourlyRate:60,costAmount:60});a.wfAction('finish',p.id)}
assert.equal(guided.status,'Ausgeliefert');assert.equal(guided.offerSnapshot.revenue,200);assert.equal(a.getDB().planning.length,4);
a.wfEditTime('t-saw');sandbox.actionSubmit({elements:{hours:{value:'2'},employee:{value:'QA'}}});assert.equal(a.getDB().time[0].costAmount,120);
assert.match(a.wfCosts(guided),/Noch offen/);
for(const tab of ['overview','plan','quote','steps','drawing','cost']){a.setTab(tab);assert.ok(!a.orderDossier(guided).includes('NaN'))}
console.log('PASS: guided acceptance, release, predecessor gate, completion, frozen offer, time correction and guided screens.');
