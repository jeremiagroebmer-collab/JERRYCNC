(function(root){'use strict';
// Demo-Konto: vollständige Beispieldaten. Alles trägt „DEMO“ im Namen. Nichts davon ist real.
function build(keys,today){
const day=n=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const iso=n=>day(n)+'T08:00:00.000Z';
const db=Object.fromEntries(keys.map(k=>[k,[]]));db._discipline='cnc';
let seq={};const num=(p)=>p+'-D'+String(seq[p]=(seq[p]||0)+1).padStart(3,'0');
const add=(k,p,o)=>{const r={id:'demo-'+k+'-'+(db[k].length+1),number:num(p),createdAt:iso(-30),...o};db[k].push(r);return r};
// ---------- Maschinen
const mill=add('machines','MA',{title:'DEMO Fräse 3-Achs',type:'Fanuc',status:'Produktion',spindle:'SK40',rate:null,purchase:85000,debt:42000,power:9000,electricity:0.3,lifeYears:8,annualHours:1500,maintenanceYear:2400,overheadHour:6,laborHour:30,notes:'Beispielmaschine. Satz wird aus den Kostenfeldern berechnet.'});
const lathe=add('machines','MA',{title:'DEMO Drehbank CNC',type:'Siemens',status:'Verfügbar',spindle:'',turret:'20x20',rate:null,purchase:58000,debt:0,power:7000,electricity:0.3,lifeYears:8,annualHours:1400,maintenanceYear:1800,overheadHour:5,laborHour:28,notes:'Revolver mit 20x20 Schaft für Drehmeißel.'});
// ---------- Werkzeuge einzeln (Lager)
const T=(o)=>add('tools','WZ',{qty:2,min:1,cost:0,location:'DEMO Regal W1',brand:'DEMO-Hersteller',...o});
const chuck=T({stockGroup:'holders',toolKind:'Spannzangenfutter',title:'DEMO ER32-Futter SK40',componentType:'Halter',subtype:'Spannzangenfutter',role:'Aufnahme/Futter',system:'Spannzangenfutter',inKind:'Maschinenkegel',inSize:'SK40',interface:'SK40',outKind:'ER-Spannsystem',outSize:'ER32',projection:70,cost:95});
const collet=T({stockGroup:'holders',toolKind:'Spannzange',title:'DEMO Spannzange ER32 Ø11–12',componentType:'Spannzange',subtype:'Spannzange',role:'Spannmittel',system:'Spannzange',inKind:'ER-Spannsystem',inSize:'ER32',interface:'ER32',outKind:'Zylinderschaft',outSize:'',minDiameter:11,maxDiameter:12,acceptShaft:'glatt',cost:22});
const shrink=T({stockGroup:'holders',toolKind:'Schrumpffutter',title:'DEMO Schrumpffutter SK40 Ø10',componentType:'Halter',subtype:'Schrumpffutter',role:'Aufnahme/Futter',system:'Schrumpffutter',inKind:'Maschinenkegel',inSize:'SK40',interface:'SK40',outKind:'Zylinderschaft',outSize:'',minDiameter:10,maxDiameter:10,acceptShaft:'glatt',projection:80,cost:180});
const em12=T({stockGroup:'cutting',toolKind:'Schaftfräser',title:'DEMO Schaftfräser Ø12 Z3',componentType:'Schneidwerkzeug',subtype:'Schaftfräser',role:'Schneidwerkzeug',inKind:'Zylinderschaft',inSize:'12',shaftDiameter:12,diameter:12,cuttingLength:26,totalLength:75,shaftType:'glatt',projection:40,suitableMaterials:'Aluminium, Stahl',isoGroups:'N,P',qty:6,min:2,cost:38,life:90});
const em10=T({stockGroup:'cutting',toolKind:'Schaftfräser',title:'DEMO Schaftfräser Ø10 VHM',componentType:'Schneidwerkzeug',subtype:'Schaftfräser',role:'Schneidwerkzeug',inKind:'Zylinderschaft',inSize:'10',shaftDiameter:10,diameter:10,cuttingLength:22,totalLength:72,shaftType:'glatt',projection:35,suitableMaterials:'Aluminium, Stahl, Edelstahl',isoGroups:'N,P,M',qty:1,min:2,cost:46,life:120});
const holderT=T({stockGroup:'cutting',toolKind:'Platten-Drehhalter',title:'DEMO Drehhalter PCLNR 2020',componentType:'Schneidwerkzeug',subtype:'Platten-Drehhalter',role:'Plattenhalter',system:'Plattenhalter',inKind:'Vierkantschaft',inSize:'20x20',interface:'',outKind:'Plattenaufnahme',outSize:'CNMG 1204',plateSeats:1,projection:30,qty:1,cost:85});
const plate=T({stockGroup:'cutting',toolKind:'Wendeschneidplatte',title:'DEMO Platte CNMG 120408',componentType:'Wendeplatte',subtype:'Wendeschneidplatte',role:'Wendeschneidplatte',inKind:'Plattenaufnahme',inSize:'CNMG 1204',suitableMaterials:'Stahl, Edelstahl',isoGroups:'P,M',projection:0,qty:20,min:10,cost:6.5,life:25});
const turnBar=T({stockGroup:'cutting',toolKind:'Drehmeißel',title:'DEMO Drehmeißel 20x20 innen',componentType:'Schneidwerkzeug',subtype:'Drehmeißel',role:'Schneidwerkzeug',inKind:'Vierkantschaft',inSize:'20x20',suitableMaterials:'Aluminium',isoGroups:'N',projection:25,qty:2,cost:48,life:60});
T({stockGroup:'general',toolKind:'Messschieber',title:'DEMO Messschieber 150 mm',componentType:'Messmittel',subtype:'Messschieber',role:'Messmittel',qty:3,min:1,cost:35});
T({stockGroup:'cutting',toolKind:'Bohrer',title:'DEMO Bohrer Ø8,5 VHM',componentType:'Schneidwerkzeug',subtype:'Bohrer',role:'Schneidwerkzeug',inKind:'Zylinderschaft',inSize:'8.5',shaftDiameter:8.5,diameter:8.5,shaftType:'glatt',qty:0,min:2,cost:29,suitableMaterials:'Aluminium, Stahl',isoGroups:'N,P'});
// ---------- Werkzeuge zusammengebaut
const asm=(o)=>add('toolassemblies','WG',{status:'Bereit',storage:'DEMO Werkzeugwagen',autoName:false,...o});
asm({title:'DEMO Fräser Ø12 im ER32-Futter',machine:mill.title,machineId:mill.id,tool:em12.title,holder:chuck.title,length:110,diameter:12,offset:'H01',components:[{id:chuck.id,qty:1},{id:collet.id,qty:1},{id:em12.id,qty:1}]});
asm({title:'DEMO Fräser Ø10 geschrumpft',machine:mill.title,machineId:mill.id,tool:em10.title,holder:shrink.title,length:115,diameter:10,offset:'H02',components:[{id:shrink.id,qty:1},{id:em10.id,qty:1}]});
asm({title:'DEMO Dreh-Außenwerkzeug mit Platte',machine:lathe.title,machineId:lathe.id,tool:plate.title,holder:holderT.title,length:30,diameter:0,offset:'T01',components:[{id:holderT.id,qty:1},{id:plate.id,qty:1}]});
asm({title:'DEMO Drehmeißel im Revolver',machine:lathe.title,machineId:lathe.id,tool:turnBar.title,holder:'Revolver 20x20',length:25,diameter:0,offset:'T02',components:[{id:turnBar.id,qty:1}]});
// ---------- Material, Kontakte
const alu=add('materials','MAT',{title:'DEMO Aluminium 6082 Platte 100×60×20',materialCategory:'metal',materialGroup:'N',grade:'EN AW-6082',dimensions:'100×60×20',qty:120,reserved:0,min:30,cost:4.8,location:'DEMO Regal M1',unit:'Stk.'});
const steel=add('materials','MAT',{title:'DEMO Stahl C45 Rund Ø40',materialCategory:'metal',materialGroup:'P',grade:'C45',dimensions:'Ø40×1000',qty:12,reserved:0,min:4,cost:21,location:'DEMO Regal M2',unit:'Stk.'});
const inox=add('materials','MAT',{title:'DEMO Edelstahl 1.4301 Rund Ø25',materialCategory:'metal',materialGroup:'M',grade:'1.4301',dimensions:'Ø25×1000',qty:3,reserved:0,min:4,cost:34,location:'DEMO Regal M2',unit:'Stk.'});
add('materials','MAT',{title:'DEMO Kühlschmierstoff 20 l',materialCategory:'supplies',qty:2,min:1,cost:89,location:'DEMO Regal H1',unit:'Kanister'});
const cu1=add('customers','KD',{title:'DEMO TechMotion GmbH',contact:'Frau Beispiel',address:'Musterweg 1\n00000 Beispielstadt',email:'demo@example.invalid',phone:'000 000',notes:'Fiktiver Kunde.'});
const cu2=add('customers','KD',{title:'DEMO Hofmann Maschinenbau',contact:'Herr Muster',address:'Musterweg 2\n00000 Beispielstadt',email:'demo2@example.invalid',phone:'000 001',notes:'Fiktiver Kunde.'});
const cu3=add('customers','KD',{title:'DEMO Kleinserie AG',contact:'Frau Test',address:'Musterweg 3\n00000 Beispielstadt',email:'demo3@example.invalid',phone:'000 002',notes:'Fiktiver Kunde.'});
const su1=add('suppliers','LF',{title:'DEMO Metallhandel Nord',contact:'Einkauf',email:'lieferant@example.invalid',lead:3,notes:'Fiktiv.'});
add('suppliers','LF',{title:'DEMO Werkzeughandel Süd',contact:'Verkauf',email:'werkzeug@example.invalid',lead:5,notes:'Fiktiv.'});
add('employees','PE',{title:'DEMO Mitarbeiter A',role:'Zerspaner',hourly:28,notes:'Fiktiv.'});
add('employees','PE',{title:'DEMO Mitarbeiter B',role:'Programmierer',hourly:32,notes:'Fiktiv.'});
// ---------- Zeichnungen, NC-Programme
add('pdm','ZE',{title:'DEMO Montageplatte MP-120',revision:'A',drawing:'MP-120',file:'',status:'Freigegeben',notes:'Schematisch.'});
add('pdm','ZE',{title:'DEMO Welle W-25',revision:'B',drawing:'W-25',file:'',status:'Freigegeben',notes:'Schematisch.'});
const cam1=add('cam','NC',{title:'DEMO MP-120 Op10',machine:mill.title,revision:'A',file:'',status:'Freigegeben',notes:'Kein echtes Programm.'});
add('cam','NC',{title:'DEMO W-25 Drehen',machine:lathe.title,revision:'B',file:'',status:'Entwurf',notes:'Noch nicht freigegeben.'});
// ---------- Aufträge mit Arbeitsplan
const step=(o,i,kind,mach,setup,run,basis,extra={})=>({id:'demo-step-'+o.number+'-'+i,orderId:o.id,order:o.number,number:'AG-'+o.number+'-'+i,title:kind,kind,machineId:mach?.id||'',machine:mach?.title||kind,sequence:i,setupMin:setup,runMin:run,timeBasis:basis,pricingMode:'combined',rateOverride:mach?null:45,dependsOn:[],programIds:[],requiresProgram:false,status:'Geplant',date:o.due,...extra});
const order=(o)=>{const r=add('orders','CNC',{workflowVersion:1,quoteMarkup:20,quoteScrap:0,quoteTools:[],reservations:[],history:[],...o});return r};
// 1 Anfrage
const o1=order({title:'DEMO Haltewinkel HW-40',customer:cu3.title,qty:25,price:null,status:'Anfrage',due:day(25),quoteMaterialId:alu.id,quoteMaterialQty:25,quoteMachineId:mill.id,quoteScrap:5,notes:'Neue Anfrage, noch nicht kalkuliert.'});
// 2 Angebot festgehalten
const o2=order({title:'DEMO Montageplatte MP-120',customer:cu1.title,qty:50,price:24.5,status:'Angebot',due:day(20),quoteMaterialId:alu.id,quoteMaterialQty:50,quoteMachineId:mill.id,quoteScrap:4,quoteTools:[{id:em12.id,qty:1,life:90}],partNumber:'MP-120',revision:'A'});
const p2=[step(o2,0,'Programmieren',null,0,90,'lot'),step(o2,1,'Fräsen',mill,45,6,'piece',{dependsOn:['demo-step-'+o2.number+'-0']}),step(o2,2,'Prüfen',null,0,1.5,'piece')];p2[2].dependsOn=[p2[1].id];
o2.offerSnapshot={at:iso(-3),cost:null,revenue:50*24.5,price:24.5,qty:50,steps:structuredClone(p2)};
// 3 Bestätigt/in Fertigung (Fräsen läuft)
const o3=order({title:'DEMO Flanschplatte FP-80',customer:cu2.title,qty:30,price:31,status:'In Fertigung',due:day(8),quoteMaterialId:alu.id,quoteMaterialQty:30,quoteMachineId:mill.id,quoteScrap:3,quoteTools:[{id:em10.id,qty:1,life:120}],partNumber:'FP-80',revision:'A',acceptedAt:iso(-10),productionReleased:true,reservations:[{materialId:alu.id,material:alu.title,qty:31,unit:'Stk.',date:iso(-10)}]});
const p3=[step(o3,0,'Programmieren',null,0,60,'lot',{status:'Abgeschlossen'}),step(o3,1,'Fräsen',mill,40,7,'piece',{status:'Läuft',requiresProgram:true,programIds:[cam1.id]}),step(o3,2,'Prüfen',null,0,1,'piece'),step(o3,3,'Verpacken',null,0,0.5,'piece',{kind:'Verpacken'}),step(o3,4,'Versand',null,0,15,'lot',{kind:'Versand'})];p3[1].dependsOn=[p3[0].id];p3[2].dependsOn=[p3[1].id];p3[3].dependsOn=[p3[2].id];p3[4].dependsOn=[p3[3].id];
alu.reserved=31;
// 4 Drehteil fertig, wird verpackt
const o4=order({title:'DEMO Distanzhülse DH-20',customer:cu1.title,qty:100,price:6.8,status:'Verpacken',due:day(2),quoteMaterialId:steel.id,quoteMaterialQty:6,quoteMachineId:lathe.id,quoteScrap:2,partNumber:'DH-20',revision:'A',acceptedAt:iso(-14),productionReleased:true});
const p4=[step(o4,0,'Drehen',lathe,35,2.2,'piece',{status:'Abgeschlossen'}),step(o4,1,'Prüfen',null,0,0.4,'piece',{status:'Abgeschlossen'}),step(o4,2,'Verpacken',null,0,0.3,'piece',{kind:'Verpacken'})];p4[1].dependsOn=[p4[0].id];p4[2].dependsOn=[p4[1].id];
// 5 Ausgeliefert, bezahlt-offen (Nachkalkulation)
const o5=order({title:'DEMO Welle W-25',customer:cu2.title,qty:20,price:42,status:'Ausgeliefert',due:day(-12),quoteMaterialId:inox.id,quoteMaterialQty:2,quoteMachineId:lathe.id,quoteScrap:5,partNumber:'W-25',revision:'B',acceptedAt:iso(-30),productionReleased:true,actualMaterial:70,actualTools:55,actualOther:15});
const p5=[step(o5,0,'Drehen',lathe,40,9,'piece',{status:'Abgeschlossen'}),step(o5,1,'Prüfen',null,0,1,'piece',{status:'Abgeschlossen'})];p5[1].dependsOn=[p5[0].id];
o5.offerSnapshot={at:iso(-34),cost:null,revenue:20*42,price:42,qty:20,steps:structuredClone(p5)};
// 6 Abgelehnt
order({title:'DEMO Gehäusedeckel GD-300',customer:cu3.title,qty:5,price:120,status:'Abgelehnt',due:day(-5),quoteMaterialId:alu.id,quoteMaterialQty:5,quoteMachineId:mill.id,notes:'Kunde hat abgelehnt (zu teuer).'});
db.planning.push(...p2,...p3,...p4,...p5);
// Zeiten (Ist)
const tm=(o,p,h,rate,emp,d)=>add('time','ZT',{title:p.title,stepId:p.id,order:o.number,employee:emp,hours:h,date:day(d),type:p.kind,channel:'machine',costAmount:h*rate,hourlyRate:rate});
tm(o3,p3[0],1,45,'DEMO Mitarbeiter B',-9);tm(o3,p3[1],2.5,68,'DEMO Mitarbeiter A',-2);
tm(o4,p4[0],4.2,58,'DEMO Mitarbeiter A',-6);tm(o4,p4[1],0.7,45,'DEMO Mitarbeiter A',-5);
tm(o5,p5[0],4.3,58,'DEMO Mitarbeiter A',-20);tm(o5,p5[1],0.4,45,'DEMO Mitarbeiter A',-18);
// Einkauf, Lager
add('purchasing','BE',{title:'DEMO Aluminium nachbestellen',supplier:su1.title,qty:60,amount:288,due:day(4),order:o3.number,materialId:alu.id,status:'Bestellt',receivedQty:0});
add('purchasing','BE',{title:'DEMO Edelstahl Rund',supplier:su1.title,qty:6,amount:204,due:day(-2),order:'',materialId:inox.id,status:'Teilgeliefert',receivedQty:2});
add('inventory','LB',{title:'Wareneingang Aluminium',kind:'Material',article:alu.title,type:'Wareneingang',qty:60,order:'',date:day(-20),materialId:alu.id});
add('inventory','LB',{title:'Entnahme für DH-20',kind:'Material',article:steel.title,type:'Entnahme',qty:6,order:o4.number,date:day(-7),materialId:steel.id});
// Wartung, Qualität, Wissen
add('maintenance','WA',{title:'DEMO Ölwechsel Fräse',machine:mill.title,due:day(6),cost:120,status:'Geplant'});
add('maintenance','WA',{title:'DEMO UVV-Prüfung Drehbank',machine:lathe.title,due:day(-3),cost:250,status:'Geplant'});
add('quality','QP',{title:'DEMO Erstmusterprüfung FP-80',order:o3.number,result:'Maße i. O.',status:'Bestanden',notes:'Fiktiv.'});
add('quality','QP',{title:'DEMO Endprüfung DH-20',order:o4.number,result:'1 Teil Nacharbeit',status:'Offen',notes:'Fiktiv.'});
add('knowledge','AN',{title:'DEMO Anleitung: Nullpunkt setzen',category:'Fräsen',revision:'1',notes:'1. Spannmittel prüfen. 2. Werkstück antasten. 3. Nullpunkt eintragen. Beispieltext.'});
// ---------- Finanzen
const fin=(o)=>add('finance','FI',{vat:19,repeat:'Einmalig',category:'',...o});
fin({title:'DEMO Rechnung Distanzhülsen',type:'Einnahme',amount:680,date:day(-4),status:'Bezahlt',category:'Umsatz'});
fin({title:'DEMO Rechnung Welle W-25',type:'Einnahme',amount:840,date:day(-9),status:'Offen',category:'Umsatz'});
fin({title:'DEMO Rechnung Vorserie',type:'Einnahme',amount:1500,date:day(6),status:'Offen',category:'Umsatz'});
fin({title:'DEMO Miete Halle',type:'Ausgabe',amount:1200,vat:0,date:day(-60),status:'Bezahlt',repeat:'Monatlich',category:'Fixkosten'});
fin({title:'DEMO Unternehmerlohn (Entnahme)',type:'Ausgabe',amount:2500,vat:0,date:day(-60),status:'Bezahlt',repeat:'Monatlich',category:'Fixkosten'});
fin({title:'DEMO Betriebshaftpflicht',type:'Ausgabe',amount:900,vat:0,date:day(-100),status:'Bezahlt',repeat:'Jährlich',category:'Fixkosten'});
fin({title:'DEMO Strom Werkstatt',type:'Ausgabe',amount:260,vat:19,date:day(-5),status:'Bezahlt',category:'Betrieb'});
fin({title:'DEMO Werkzeughandel Rechnung',type:'Ausgabe',amount:410,vat:19,date:day(3),status:'Offen',category:'Werkzeug'});
add('debts','KR',{title:'DEMO Maschinenkredit Fräse',principal:60000,balance:42000,payment:850,interest:5.2,endDate:day(900),fixedUntil:day(500),security:'Maschine sicherungsübereignet, Bürgschaft der Gründer'});
add('debts','KR',{title:'DEMO Leasing Drehbank (fiktiv)',principal:14000,balance:9000,payment:320,interest:4.1,endDate:day(300),fixedUntil:day(300),security:'Leasinggeber bleibt Eigentümer'});
add('deadlines','FR',{title:'DEMO Umsatzsteuer-Voranmeldung',date:day(5),repeat:'Vierteljährlich',notes:'Fiktiver Termin. Echten Termin mit dem Steuerberater klären.'});
add('deadlines','FR',{title:'DEMO Versicherung prüfen',date:day(-2),repeat:'Einmalig',notes:'Absichtlich überfällig, um die Warnung zu zeigen.'});
add('deadlines','FR',{title:'DEMO Maschinenprüfung',date:day(40),repeat:'Jährlich',notes:'Fiktiv.'});
db.settings.push({id:'demo-set-1',number:'EI-D001',title:'Kontostand',value:'6400',notes:today,createdAt:iso(-1)});
db.settings.push({id:'cncos-document-profile',title:'Demo-Dokumentprofil',documentProfile:{appName:'CNC OS · DEMO',company:'Demo-Firma · keine echten Firmendaten',contact:'Demostraße 1\n00000 Demostadt',taxId:'DEMO-00000000000',iban:'IT00 X000 0000 0000 0000 0000 000',payDays:'30',smallBiz:'Nein',vatStd:'22',vatMode:'IT-Q',lateRate:'10.4',generalNote:'Nur Beispieldaten. Nicht zur Fertigung oder Abrechnung verwenden.'}});
return db}
const api={build};if(typeof module!=='undefined')module.exports=api;root.CncDemoData=api;
})(typeof window!=='undefined'?window:globalThis);
