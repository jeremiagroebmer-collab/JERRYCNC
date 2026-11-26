const assert=require('node:assert/strict'),R=require('../wiederholung.js');
const old={id:'o1',number:'A-1',customer:'Leitner',partNumber:'4433478',revision:'B',status:'Ausgeliefert',acceptedAt:'2026-05-01'};
const neu={id:'o2',number:'A-2',customer:' leitner ',partNumber:'4433 478',revision:'C',due:'2026-12-01',status:'Anfrage'};
const other={id:'o3',number:'A-3',customer:'Koller',partNumber:'4433478',revision:'B',status:'Ausgeliefert'};
const st=(id,extra)=>({id,orderId:'o1',order:'A-1',title:id,kind:id,sequence:0,status:'Abgeschlossen',...extra});
const db={orders:[old,neu,other],planning:[st('s1',{sequence:0}),st('s2',{sequence:1,dependsOn:['s1'],requiresProgram:true,programIds:['nc1'],startedAt:'x'}),{...st('x',{orderId:'o3',order:'A-3'})}],pdm:[{number:'4433478',revision:'C',status:'Freigegeben'}],cam:[{id:'nc1',order:'A-1',partNumber:'4433478',revision:'B',number:'NC-1',status:'Freigegeben'}]};
// gleiche Firma + Nummer (Leerzeichen/Gross-Klein egal); andere Firma zählt nicht
assert.equal(R.key(old),R.key(neu));assert.notEqual(R.key(old),R.key(other));
assert.deepEqual(R.previous(db,neu).map(o=>o.number),['A-1']);assert.deepEqual(R.previous(db,{...neu,customer:'Unbekannt'}),[]);assert.equal(R.key({customer:'x'}),'');
// Plan kopieren: neue IDs, Abhängigkeiten umgebogen, Status zurück, Revision des neuen Auftrags
let n=0;const copy=R.copyPlan(db,old,neu,k=>k+'N'+(++n),()=>'AG-'+n);
assert.equal(copy.length,2);assert.ok(copy.every(c=>c.orderId==='o2'&&c.order==='A-2'&&c.status==='Geplant'&&c.planRevision==='C'&&c.copiedFrom==='A-1'));
assert.deepEqual(copy[1].dependsOn,[copy[0].id]);assert.notEqual(copy[0].id,'s1');assert.equal(copy[1].startedAt,undefined);assert.deepEqual(copy[1].programIds,['nc1']);assert.equal(copy[0].date,'2026-12-01');
// Revisionskontrolle: NC-Programm Rev B, Auftrag Rev C -> rot; Plan nach Kopie passt
let c=R.checks(db,neu);assert.equal(c.light,'red');assert.ok(c.checks.find(x=>x.id==='nc').light==='red');assert.ok(c.checks.find(x=>x.id==='prev').light==='yellow');assert.equal(c.checks.find(x=>x.id==='pdm').light,'green');
// bestätigter Unterschied -> gelb, ändert sich der Befund -> wieder rot
neu.revisionAck={sig:c.sig};c=R.checks(db,neu);assert.equal(c.light,'yellow');assert.equal(c.ack,true);neu.revision='D';c=R.checks(db,neu);assert.equal(c.light,'red');assert.equal(c.ack,false);neu.revision='C';delete neu.revisionAck;
// Plan mit falscher Revision
db.planning.push({...st('z',{orderId:'o2',order:'A-2',planRevision:'B'})});c=R.checks(db,neu);assert.equal(c.checks.find(x=>x.id==='plan').light,'red');
// Zeichnung nicht freigegeben / fehlt
assert.equal(R.checks({...db,pdm:[{number:'4433478',revision:'C',status:'Entwurf'}]},neu).checks.find(x=>x.id==='pdm').light,'red');assert.equal(R.checks({...db,pdm:[]},neu).checks.find(x=>x.id==='pdm').light,'yellow');
// ohne Bauteilnummer: nichts zu prüfen
assert.equal(R.checks(db,{id:'q',number:'Q',customer:'x'}).checks.length,0);
console.log('wiederholung ok');
