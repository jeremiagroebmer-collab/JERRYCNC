const assert=require('node:assert/strict');
const B=require('../blaetter.js'),{jsPDF}=require('../vendor/jspdf-4.2.1.min.js'),fonts=require('../vendor/pdf-fonts.js');
const db={settings:[{documentProfile:{company:'Muster GmbH'}}],
 orders:[{id:'o1',number:'CNC-2026-001',title:'Flansch',customer:'Kunde A',qty:10,partNumber:'Z-1',revision:'B',price:25,status:'Bestätigt',offerSnapshot:{price:25},acceptedAt:'x',reservations:[{a:1}],history:[1],due:'2026-12-01',quoteScrap:3}],
 planning:[{id:'p1',orderId:'o1',title:'Fräsen',machine:'M1',setupMin:30,runMin:5,sequence:1,notes:'Vorsicht'},{id:'p2',order:'CNC-2026-001',title:'Entgraten',sequence:2},{id:'p3',orderId:'other',title:'x'}],
 cam:[{number:'NC-1',order:'CNC-2026-001',title:'Prog',machine:'M1'}],quality:[{number:'Q-1',title:'Erstteil',order:'CNC-2026-001',result:'ok',status:'Bestanden'}],
 materials:[{id:'m1',number:'MAT-1',title:'Alu',qty:5,unit:'kg',cost:3,location:'Regal A'},{id:'m2',number:'MAT-2',title:'Stahl',location:'regal a'},{id:'m3',title:'x',location:'Noch nicht erfasst'},{id:'m4',title:'y',location:'Regal B'}]};
const o=db.orders[0];
let m=B.sheetModel(db,o,'ruest','2026-11-23');assert.equal(m.steps.length,2);assert.equal(m.programs.length,1);assert.equal(m.checks.length,1);
for(const k of ['ruest','mess']){const mm=B.sheetModel(db,o,k,'2026-11-23'),{pdf,name}=B.render(mm,{jsPDF,fonts});assert.ok(pdf.getNumberOfPages()>=1);assert.match(name,/\.pdf$/);assert.ok(pdf.output('arraybuffer').byteLength>1500)}
const empty=B.sheetModel({orders:[],settings:[]},{id:'z',number:'N'},'ruest','2026-11-23');assert.ok(B.render(empty,{jsPDF,fonts}).pdf);
const c=B.copyOrder(db,o,'o2','CNC-2026-002');
assert.equal(c.id,'o2');assert.equal(c.number,'CNC-2026-002');assert.equal(c.status,'Anfrage');assert.equal(c.qty,10);assert.equal(c.quoteScrap,3);
for(const k of ['offerSnapshot','acceptedAt','reservations','history','due'])assert.equal(c[k],undefined,k);
assert.ok(o.offerSnapshot&&o.reservations.length===1);
const r=B.remnant(db,db.materials[0],{dimensions:'80x60',qty:'2',location:''},'m9',B.nextRemnantNumber(db,db.materials[0]));
assert.equal(r.number,'MAT-1-R1');assert.equal(r.location,'Regal A');assert.equal(r.remnantOf,'m1');assert.equal(r.cost,3);
assert.throws(()=>B.remnant(db,db.materials[0],{qty:''},'x','y'),/Menge/);
assert.deepEqual(B.locations(db).map(l=>l.name+':'+l.count),['Regal A:2','Regal B:1']);
assert.equal(B.atLocation(db,'REGAL A').length,2);
assert.equal(B.locFromCode('https://x/y/?a=1#loc='+encodeURIComponent('Regal Ä/3')),'Regal Ä/3');assert.equal(B.locFromCode('#record=a:b'),null);assert.equal(B.locFromCode('#loc='),null);
console.log('blaetter ok');
{const d={orders:[{id:'o1',number:'N1'}],planning:[{id:'a',orderId:'o1',title:'Fräsen',hours:2,sequence:0},{id:'b',order:'N1',title:'Prüfen',hours:1,sequence:1},{id:'c',orderId:'o1',title:'Pack',hours:null,sequence:2}],time:[{stepId:'a',hours:1.5},{stepId:'a',hours:1},{stepId:'x',hours:9}],
 tools:[{id:'t1',title:'Fräser',life:100,usedMin:85},{id:'t2',title:'Bohrer',life:50,usedMin:50},{id:'t3',title:'Neu',life:100,usedMin:10},{id:'t4',title:'Ohne',usedMin:5}]};
 const r=B.planVsActual(d,d.orders[0]);assert.equal(r.length,3);assert.equal(r[0].actual,2.5);assert.equal(r[0].diff,0.5);assert.equal(r[0].level,'over');assert.equal(r[1].actual,null);assert.equal(r[1].level,'none');assert.equal(r[2].plan,null);
 const w=B.toolWear(d);assert.deepEqual(w.map(x=>x.id+x.pct+x.level),['t2100over','t185soon']);}
console.log('plan/ist ok');
