const assert=require('node:assert/strict'),F=require('../firma.js');
const db={finance:[
{type:'Einnahme',amount:1000,vat:19,date:'2026-11-05',status:'Bezahlt'},
{type:'Ausgabe',amount:200,vat:19,date:'2026-11-06',status:'Bezahlt'},
{type:'Ausgabe',amount:500,vat:0,date:'2026-09-01',status:'Geplant',repeat:'Monatlich'},
{type:'Ausgabe',amount:1200,vat:0,date:'2026-01-15',status:'Geplant',repeat:'Jährlich'},
{type:'Einnahme',amount:2000,vat:19,date:'2026-12-10',status:'Offen'}],
debts:[{balance:10000,payment:300},{balance:0,payment:99}],settings:[{title:'Kontostand',value:'1000',notes:'2026-11-20'}],
deadlines:[{title:'USt',date:'2026-11-10',repeat:'Vierteljährlich'},{title:'Alt',date:'2026-11-01',repeat:'Einmalig'}]};
const p=F.flows(db,'2026-11','paid');
assert.equal(p.inNet,1000);assert.equal(p.outNet,700);            // 200 gebucht + 500 feste Kosten
assert.equal(F.vatReserve(db,'2026-11-20').toFixed(2),'152.00');  // 190 - 38
assert.equal(F.debtTotal(db),10000);assert.equal(F.debtRates(db),300);   // Kredit ohne Restschuld zahlt nichts
const fx=F.fixedPerMonth(db);assert.equal(fx.costs,600);assert.equal(fx.total,900);  // 500 + 1200/12
assert.equal(F.breakEven(db,0.25).revenue,3600);assert.equal(F.breakEven(db,null).revenue,null);
const fc=F.forecast(db,'2026-11-20',1000,3);
assert.deepEqual(fc.map(r=>Math.round(r.end)),[200,1780,-752]);
assert.equal(F.forecast(db,'2026-11-20',null,1)[0].end,null);
assert.equal(F.balance(db).value,1000);
const d=F.deadlines(db,'2026-11-20',60);
assert.equal(d[0].f.title,'Alt');assert.equal(d[0].level,'over');
assert.equal(F.nextDue(db.deadlines[0],'2026-11-20'),'2027-02-10');assert.equal(d.length,1);
assert.equal(F.backupAge(null,'2026-11-20'),null);assert.equal(F.backupAge('2026-11-10T08:00:00Z','2026-11-20'),10);
assert.equal(F.addMonths('2026-12',2),'2027-02');
console.log('firma ok');
// Prüfer-Befunde
const L={finance:[{type:'Einnahme',amount:10000,vat:19,date:'2026-11-05',status:'Bezahlt'}]};
assert.equal(F.vatReserve(L,'2026-11-20'),1900);
assert.equal(F.vatReserve(L,'2027-01-05'),1900);    // Vorquartal bis zur Voranmeldung (10.1.)
assert.equal(F.vatReserve(L,'2027-01-20'),0);
const fut={finance:[{type:'Einnahme',amount:1000,vat:19,date:'2026-11-05',status:'Bezahlt'},{type:'Ausgabe',amount:1000,vat:19,date:'2026-12-01',status:'Geplant',repeat:'Monatlich'}]};
assert.equal(F.vatReserve(fut,'2026-11-20'),190);   // künftige Vorlagen zählen nicht
const dup={finance:[{type:'Ausgabe',title:'Miete',amount:500,vat:0,date:'2026-09-01',repeat:'Monatlich'},{type:'Ausgabe',title:' miete ',amount:500,vat:0,date:'2026-11-03',status:'Bezahlt'}]};
assert.equal(F.flows(dup,'2026-11','paid').outNet,500);            // nicht doppelt
assert.equal(F.gross({type:'Ausgabe',amount:100}),100);assert.equal(F.gross({type:'Einnahme',amount:100}),119);
assert.equal(F.nextDue({date:'2026-01-31',repeat:'Monatlich'},'2026-02-10'),'2026-02-28');
assert.equal(F.nextDue({date:'2026-03-10',repeat:'Monatlich',lastDone:'2026-03-10'},'2026-05-20'),'2026-04-10'); // verpasst = überfällig
assert.equal(F.nextDue({date:'2026-03-10',repeat:'Einmalig',lastDone:'2026-03-11'},'2026-05-20'),null);
const dd=F.deadlines({deadlines:[{title:'X',date:'2026-03-10',repeat:'Monatlich',lastDone:'2026-03-10'}]},'2026-05-20',60);
assert.equal(dd[0].level,'over');
console.log('firma 2 ok');
// Runde 3
assert.equal(F.wageMissing({finance:[{type:'Ausgabe',title:'Miete',repeat:'Monatlich'}]}),true);
assert.equal(F.wageMissing({finance:[{type:'Ausgabe',title:'Unternehmerlohn',repeat:'Monatlich'}]}),false);
assert.equal(F.noVat({finance:[{type:'Ausgabe',amount:10},{type:'Ausgabe',amount:10,vat:0},{type:'Einnahme',amount:5}]}),1);
assert.equal(F.openPayables({finance:[{type:'Ausgabe',amount:100,vat:19,status:'Offen'}]}),119);
const debt={debts:[{balance:1000,payment:100,endDate:'2026-12-31'}]};
assert.equal(F.debtRates(debt,'2026-12'),100);assert.equal(F.debtRates(debt,'2027-01'),0);
assert.deepEqual(F.forecast(debt,'2026-11-20',1000,3).map(r=>r.end),[900,800,800]);
assert.equal(F.deadlines({deadlines:[{title:'A',date:'2026-12-02',repeat:'Einmalig'}]},'2026-11-20',60)[0].level,'soon');
console.log('firma 3 ok');
