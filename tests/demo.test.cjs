const assert=require('node:assert/strict'),D=require('../demo-data.js'),T=require('../tooling.js'),W=require('../workflow.js'),F=require('../firma.js');
const keys=['orders','tools','toolassemblies','materials','machines','pdm','cam','purchasing','inventory','customers','suppliers','maintenance','quality','employees','time','knowledge','finance','debts','deadlines','planning','settings'];
const db=D.build(keys,'2026-11-20');
for(const k of keys)assert.ok(Array.isArray(db[k]),k);
for(const k of keys){const ids=db[k].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,'doppelte IDs '+k);const nums=db[k].map(x=>x.number).filter(Boolean);assert.equal(new Set(nums).size,nums.length,'doppelte Nummern '+k)}
// Werkzeugketten
assert.ok(db.toolassemblies.length>=4);
for(const a of db.toolassemblies){const c=T.chain(db,a);assert.ok(c.ok&&c.complete,a.title+': '+c.reason)}
for(const t of db.tools.filter(t=>t.role!=='Messmittel'))assert.deepEqual(T.missing(t),[],t.title);
// Arbeitspläne
for(const o of db.orders){const steps=W.steps(db,o);if(steps.length)assert.ok(W.validate(steps),o.number)}
for(const o of db.orders.filter(o=>o.workflowVersion&&W.steps(db,o).length)){const e=W.estimate(db,o,m=>null);assert.ok(e.rows.length)}
// Firma-Seite rechnet
const fc=F.forecast(db,'2026-11-20',F.balance(db).value,3);assert.equal(fc.length,3);
assert.ok(F.fixedPerMonth(db,'2026-11-20').total>0);assert.equal(F.wageMissing(db),false);
const dl=F.deadlines(db,'2026-11-20',60);assert.ok(dl.some(x=>x.level==='over')&&dl.some(x=>x.level==='soon'));
assert.ok(db.orders.some(o=>o.status==='Abgelehnt')&&db.orders.some(o=>o.status==='Anfrage'));
console.log('demo ok',db.tools.length,'Werkzeuge',db.orders.length,'Aufträge');
