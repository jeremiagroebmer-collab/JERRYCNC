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
assert.deepEqual(fc.map(r=>Math.round(r.end)),[200,1780,-220]);
assert.equal(F.forecast(db,'2026-11-20',null,1)[0].end,null);
assert.equal(F.balance(db).value,1000);
const d=F.deadlines(db,'2026-11-20',60);
assert.equal(d[0].f.title,'Alt');assert.equal(d[0].level,'over');
assert.equal(F.nextDue(db.deadlines[0],'2026-11-20'),'2027-02-10');assert.equal(d.length,1);
assert.equal(F.backupAge(null,'2026-11-20'),null);assert.equal(F.backupAge('2026-11-10T08:00:00Z','2026-11-20'),10);
assert.equal(F.addMonths('2026-12',2),'2027-02');
console.log('firma ok');
