const assert=require('node:assert/strict'),W=require('../arbeitsplatz.js'),wf=require('../workflow.js');
const today='2026-11-25';
const o={id:'o1',number:'A1',title:'Platte',qty:5,status:'Bestätigt',workflowVersion:2,productionReleased:true,due:'2026-12-10',quoteMaterialId:'m1',partNumber:'Z1'};
const mk=(id,extra)=>({id,orderId:'o1',order:'A1',title:id,setupMin:30,runMin:6,timeBasis:'piece',status:'Geplant',...extra});
const db={machines:[{id:'f',title:'Fräse 1',status:'Produktion'},{id:'d',title:'Drehbank',status:'Störung'}],
 orders:[o],pdm:[{id:'z',number:'Z1'}],materials:[{id:'m1',title:'Alu',qty:3}],toolassemblies:[{id:'t',order:'A1'}],time:[{stepId:'s1',hours:1.5}],maintenance:[{machine:'Fräse 1',title:'Ölwechsel',due:'2026-11-20',status:'Offen'}],
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
const ok={...db,maintenance:[],machines:[{id:'f',title:'Fräse 1',status:'Produktion'}],planning:[mk('a',{machineId:'f',machine:'Fräse 1',date:'2026-11-28',assemblyIds:['t']})]};
assert.equal(W.analyze(ok,today,wf).places[0].light,'green');
const none={...ok,planning:[mk('a',{machineId:'f',machine:'Fräse 1',status:'Abgeschlossen'})]};assert.equal(W.analyze(none,today,wf).places[0].light,'idle');
// fehlendes Material (Bestand 0) -> rot
const empty={...ok,materials:[{id:'m1',title:'Alu',qty:0}],planning:[mk('a',{machineId:'f',machine:'Fräse 1',date:'2026-11-28',materialIds:['m1'],assemblyIds:['t']})]};
assert.equal(W.analyze(empty,today,wf).places[0].light,'red');
// storniert wird ausgeblendet; leere Daten stürzen nicht ab
assert.equal(W.analyze({...ok,orders:[{...o,status:'Storniert'}]},today,wf).places[0].counts.total,0);assert.deepEqual(W.analyze({},today,wf).places,[]);
console.log('arbeitsplatz ok');
