const assert=require('node:assert/strict'),W=require('../arbeitsplatz.js'),wf=require('../workflow.js');
const today='2026-11-25';
const o={id:'o1',number:'A1',title:'Platte',qty:5,status:'Bestätigt',workflowVersion:2,productionReleased:true,due:'2026-12-10',quoteMaterialId:'m1',partNumber:'Z1'};
const mk=(id,extra)=>({id,orderId:'o1',order:'A1',title:id,setupMin:30,runMin:6,timeBasis:'piece',status:'Geplant',...extra});
const db={machines:[{id:'f',title:'Fräse 1',status:'Produktion'},{id:'d',title:'Drehbank',status:'Störung'}],
 orders:[o],pdm:[{id:'z',number:'Z1'}],materials:[{id:'m1',title:'Alu',qty:3}],toolassemblies:[{id:'t',order:'A1',status:'Einsatzbereit'}],time:[{stepId:'s1',hours:1.5}],maintenance:[{machine:'Fräse 1',title:'Ölwechsel',due:'2026-11-20',status:'Offen'}],
 planning:[mk('s1',{machineId:'f',machine:'Fräse 1',date:'2026-11-26',status:'Abgeschlossen'}),mk('s2',{machineId:'f',machine:'Fräse 1',date:'2026-11-27',dependsOn:['s1']}),mk('s3',{machine:'Säge',date:'2026-11-20'}),mk('s4',{machineId:'d',machine:'Drehbank',date:'2026-12-01'})]};
const r=W.analyze(db,today,wf),by=n=>r.places.find(p=>p.name===n);
// Fräse: Wartung überfällig -> rot, 1 von 2 fertig
assert.equal(by('Fräse 1').light,'red');assert.equal(by('Fräse 1').counts.done,1);assert.equal(by('Fräse 1').counts.open,1);assert.equal(by('Fräse 1').progress,0.5);
assert.ok(by('Fräse 1').reasons.some(x=>/Wartung überfällig/.test(x)));assert.equal(by('Fräse 1').hours.booked,1.5);
// Drehbank gestört -> rot
assert.equal(by('Drehbank').light,'red');assert.ok(by('Drehbank').reasons.includes('Maschine gestört'));
// Säge: Termin überschritten -> rot, kein Maschinen-Werkzeug nötig
const saw=by('Säge');assert.equal(saw.light,'red');assert.ok(saw.steps[0].reasons.includes('Termin überschritten'));assert.ok(!saw.steps[0].missing.includes('Werkzeug'));
// Sortierung: rot zuerst
assert.equal(r.places[0].light,'red');
// grün, wenn alles passt; grau, wenn nichts offen
const ok={...db,cam:[{id:'c1',order:'A1',status:'Freigegeben'}],maintenance:[],machines:[{id:'f',title:'Fräse 1',status:'Produktion'}],planning:[mk('a',{machineId:'f',machine:'Fräse 1',date:'2026-11-28',assemblyIds:['t']})]};
assert.equal(W.analyze(ok,today,wf).places[0].light,'green');
const none={...ok,planning:[mk('a',{machineId:'f',machine:'Fräse 1',status:'Abgeschlossen'})]};assert.equal(W.analyze(none,today,wf).places[0].light,'idle');
// fehlendes Material (Bestand 0) -> rot
const empty={...ok,materials:[{id:'m1',title:'Alu',qty:0}],planning:[mk('a',{machineId:'f',machine:'Fräse 1',date:'2026-11-28',materialIds:['m1'],assemblyIds:['t']})]};
assert.equal(W.analyze(empty,today,wf).places[0].light,'red');
// storniert wird ausgeblendet; leere Daten stürzen nicht ab
assert.equal(W.analyze({...ok,orders:[{...o,status:'Storniert'}]},today,wf).places[0].counts.total,0);assert.deepEqual(W.analyze({},today,wf).places,[]);
// Spalten-Ampeln und Wartet-auf
{const s2=by('Fräse 1'),row=s2.steps[0];assert.equal(row.checks.pred.light,'green');assert.equal(row.checks.drawing.light,'green');assert.equal(row.checks.material.light,'green');
 const w=W.analyze({...db,planning:[...db.planning,mk('s5',{machineId:'f',machine:'Fräse 1',date:'2026-11-29',dependsOn:['s2'],requiresProgram:true})]},today,wf).places.find(p=>p.name==='Fräse 1').steps.find(r=>r.p.id==='s5');
 assert.equal(w.checks.pred.light,'yellow');assert.ok(/s2/.test(w.checks.pred.text));assert.equal(w.checks.prog.light,'yellow');assert.ok(w.waiting.length>=2);assert.equal(w.checks.tool.light,'green');}
// Revisionsspalte
{const d2={...db,orders:[{...o,customer:'Leitner',partNumber:'Z1',revision:'B'}],pdm:[{number:'Z1',revision:'C',status:'Freigegeben'}],planning:[mk('r1',{machineId:'f',machine:'Fräse 1',date:'2026-11-28',assemblyIds:['t']})]};
 const row=W.analyze(d2,today,wf).places.find(p=>p.name==='Fräse 1').steps[0];assert.equal(row.checks.rev.light,'red');assert.ok(/Revision/.test(row.waiting.join(' ')));
 const d3={...d2,pdm:[{number:'Z1',revision:'B',status:'Freigegeben'}]};assert.equal(W.analyze(d3,today,wf).places.find(p=>p.name==='Fräse 1').steps[0].checks.rev.light,'green');}
// Arbeitsbereiche: Art, spätester Start, Fräse-Spalten, Säge vor Programm vor Fräse
{const o2={...o,id:'o9',number:'B9',due:'2026-12-04',partNumber:'',productionReleased:true};
 const S=(id,kind,extra)=>({id,orderId:'o9',order:'B9',title:kind,kind,setupMin:0,runMin:480,timeBasis:'lot',status:'Geplant',sequence:0,...extra});
 const d={machines:[{id:'f',title:'Fräse X',status:'Produktion'}],orders:[o2],materials:[],pdm:[],cam:[],toolassemblies:[{id:'ta',order:'B9',status:'Montage offen'},{id:'tb',order:'B9',status:'Einsatzbereit'}],time:[],
  planning:[S('sg','Sägen',{machine:'Säge'}),S('cm','CAM-Programmierung',{machine:'Programmieren'}),S('fr','Fräsen',{machineId:'f',machine:'Fräse X',dependsOn:['sg','cm'],assemblyIds:['ta','tb']}),S('pr','Prüfen',{machine:'Messplatz',dependsOn:['fr']})]};
 const A=W.analyze(d,'2026-11-26',wf),pl=n=>A.places.find(p=>p.name===n),row=n=>pl(n).steps[0];
 assert.equal(pl('Fräse X').type,'fraesen');assert.equal(pl('Säge').type,'saege');assert.equal(pl('Programmieren').type,'cam');assert.equal(pl('Messplatz').type,'pruefen');
 // je 1 Tag: Liefertermin Fr 04.12. -> Prüfen 04.12., Fräsen 03.12., Säge und CAM 02.12.
 assert.equal(row('Messplatz').ls,'2026-12-04');assert.equal(row('Fräse X').ls,'2026-12-03');assert.equal(row('Säge').ls,'2026-12-02');assert.equal(row('Programmieren').ls,'2026-12-02');
 // Fräse: Werkzeuge nur 1 von 2 hergerichtet, Zuschnitt und Programm noch offen mit Startdatum der Vorarbeit
 const f=row('Fräse X').checks;assert.equal(f.tool.light,'yellow');assert.ok(/1 von 2/.test(f.tool.text));assert.equal(f.cut.light,'yellow');assert.ok(/02\.12\./.test(f.cut.text));assert.equal(f.prog.light,'yellow');assert.ok(/02\.12\./.test(f.prog.text));
 assert.ok(/Neues Teil/.test(row('Fräse X').info.progNew.text));assert.ok(/Fräse X ab 03\.12\./.test(row('Säge').nextText));
 // Säge fertig, Werkzeuge ok -> Fräse: Zuschnitt grün; Versäumter Start -> rot
 d.planning[0].status='Abgeschlossen';d.toolassemblies[0].status='Einsatzbereit';let g=W.analyze(d,'2026-11-26',wf).places.find(p=>p.name==='Fräse X').steps[0].checks;assert.equal(g.cut.light,'green');assert.equal(g.tool.light,'green');
 const late=W.analyze(d,'2026-12-03',wf).places.find(p=>p.name==='Programmieren').steps[0];assert.equal(late.checks.start.light,'red');assert.ok(/Hätte bis 02\.12\./.test(late.checks.start.text));
 // Wiederholteil mit altem Programm
 assert.equal(W.classify('Entgraten'),'entgraten');assert.equal(W.workBack('2026-12-07',1),'2026-12-04');}
// Kapazität, Feiertage, Betriebsurlaub, Wartezeit
{assert.equal(W.easter(2026),'2026-04-05');assert.ok(W.isHoliday('2026-04-06'));assert.ok(W.isHoliday('2026-12-08'));assert.ok(!W.isHoliday('2026-12-09'));
 assert.equal(W.workBack('2026-12-09',1),'2026-12-07');// 8.12. Feiertag
 assert.equal(W.closedSet('2026-12-24..2026-12-26, 2027-01-08').size,4);
 const o2={...o,id:'o8',number:'C8',due:'2026-12-11',partNumber:'',productionReleased:true};
 const S=(id,kind,extra)=>({id,orderId:'o8',order:'C8',title:kind,kind,setupMin:0,runMin:960,timeBasis:'lot',status:'Geplant',sequence:0,...extra});// 16 h
 const base={machines:[{id:'f',title:'Fräse Y',status:'Produktion'}],orders:[o2],materials:[],pdm:[],cam:[],toolassemblies:[],time:[],settings:[],planning:[S('fr','Fräsen',{machineId:'f',machine:'Fräse Y'})]};
 const ls=d=>W.analyze(d,'2026-11-26',wf).places.find(p=>p.name==='Fräse Y').steps[0].ls;
 assert.equal(ls(base),'2026-12-10');// 16 h = 2 Tage bei 8 h, Fr 11.12. -> Do 10.12.
 assert.equal(ls({...base,settings:[{id:'workplace-config',places:{'Fräse Y':{dayHours:4}}}]}),'2026-12-08'.replace('08','07')); // 4 Tage: Fr, Do, Mi, Di... 
 assert.equal(ls({...base,settings:[{id:'workplace-config',closed:'2026-12-10'}]}),'2026-12-09');
 const wait={...base,planning:[S('fr','Fräsen',{machineId:'f',machine:'Fräse Y',runMin:480}),S('pk','Prüfen',{machine:'Messplatz',runMin:60,dependsOn:['fr']})]};wait.planning[0].waitHours=24;
 const a1=W.analyze(wait,'2026-11-26',wf).places.find(p=>p.name==='Fräse Y').steps[0].ls;wait.planning[0].waitHours=0;const a0=W.analyze(wait,'2026-11-26',wf).places.find(p=>p.name==='Fräse Y').steps[0].ls;assert.ok(a1<a0);
 assert.equal(W.analyze({...base,settings:[{id:'workplace-config',places:{'Fräse Y':{dayHours:10,weekDays:6}}}]},'2026-11-26',wf).places.find(p=>p.name==='Fräse Y').cap.week,60);}
console.log('arbeitsplatz ok');
