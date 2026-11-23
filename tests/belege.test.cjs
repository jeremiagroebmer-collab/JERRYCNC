const assert=require('node:assert/strict'),fs=require('node:fs');
const B=require('../belege.js'),{jsPDF}=require('../vendor/jspdf-4.2.1.min.js'),fonts=require('../vendor/pdf-fonts.js');
const mk=()=>({settings:[{id:'cncos-document-profile',documentProfile:{appName:'X',company:'Muster GmbH',contact:'Hauptstr. 1\n39040 Ort',taxId:'IT123',iban:'IT00X',payDays:'14'}}],customers:[{id:'c1',title:'Kunde AG',address:'Weg 2\n39100 Bozen',number:'K-1'}],orders:[{id:'o1',number:'A-1',title:'Welle',customer:'Kunde AG',qty:10,price:25.5,status:'Fertig',due:'2026-12-01'}],finance:[]});
let db=mk();
assert.deepEqual(B.missing(db),[]);assert.ok(B.missing({settings:[]}).length>=3);
const pos=B.positions(db.orders[0]);assert.equal(pos[0].total,255);
for(const k of ['angebot','bestaetigung','lieferschein']){const m=B.model(db,k,'o1',{today:'2026-11-23'});assert.equal(m.net,255);assert.equal(m.gross,303.45);const {pdf}=B.render(m,{jsPDF,fonts});assert.ok(Buffer.from(pdf.output('arraybuffer')).length>2000)}
assert.throws(()=>B.model(db,'mahnung','o1',{today:'2026-11-23'}),/noch keine Rechnung/);
const f=B.createInvoice(db,db.orders[0],'2026-11-23','f1');
assert.equal(f.number,'RE-2026-001');assert.equal(f.date,'2026-12-07');assert.equal(f.status,'Offen');assert.equal(f.amount,255);assert.equal(f.vat,'19');
assert.throws(()=>B.createInvoice(db,db.orders[0],'2026-11-23'),/schon eine Rechnung/);
assert.equal(B.nextInvoiceNumber(db,'2026-11-24'),'RE-2026-002');assert.equal(B.nextInvoiceNumber(db,'2027-01-02'),'RE-2027-001');
const inv=B.model(db,'rechnung','o1',{today:'2026-11-25'});assert.equal(inv.number,'RE-2026-001');assert.equal(inv.gross,303.45);assert.ok(inv.outro[0].includes('07.12.2026'));
// Mahnstufen
assert.equal(B.reminderLevel(f,'2026-12-07'),0);assert.equal(B.reminderLevel(f,'2026-12-08'),1);assert.equal(B.reminderLevel(f,'2026-12-22'),2);assert.equal(B.reminderLevel(f,'2027-01-10'),3);
const ma=B.model(db,'mahnung','o1',{today:'2026-12-10'});assert.equal(ma.level,1);assert.equal(ma.title,'Zahlungserinnerung');assert.ok(ma.outro[0].includes('303,45'));
const ma3=B.model(db,'mahnung','o1',{today:'2027-01-10'});assert.equal(ma3.level,3);assert.ok(ma3.outro.some(x=>x.includes('weitere Schritte')));
B.render(ma3,{jsPDF,fonts});
assert.equal(B.overdueInvoices(db,'2026-12-10').length,1);
// Bezahlt
db.orders[0].status='Ausgeliefert';B.markPaid(db,f,'2026-12-01');assert.equal(f.status,'Bezahlt');assert.equal(f.date,'2026-12-01');assert.equal(db.orders[0].status,'Bezahlt');assert.equal(B.reminderLevel(f,'2027-02-01'),0);
// Kleinunternehmer
const k=mk();k.settings[0].documentProfile.smallBiz='Ja';const kf=B.createInvoice(k,k.orders[0],'2026-11-23');assert.equal(kf.vat,'0');const km=B.model(k,'rechnung','o1',{today:'2026-11-23'});assert.equal(km.gross,255);assert.ok(km.outro.some(x=>x.includes('§ 19')));
// ohne Preis
const n=mk();delete n.orders[0].price;assert.throws(()=>B.model(n,'angebot','o1',{}),/Preis/);
// Angebotsstand hat Vorrang
const s=mk();s.orders[0].offerSnapshot={qty:5,price:40,revenue:200};s.orders[0].qty=10;assert.equal(B.positions(s.orders[0])[0].total,200);
// Rechnung folgt gespeichertem Betrag
const g=mk();const gf=B.createInvoice(g,g.orders[0],'2026-11-23');g.orders[0].price=99;assert.equal(B.model(g,'rechnung','o1',{today:'2026-11-23'}).net,255);
fs.mkdirSync('/tmp/cncos-pdf-qa',{recursive:true});const {pdf}=B.render(inv,{jsPDF,fonts});fs.writeFileSync('/tmp/cncos-pdf-qa/rechnung.pdf',Buffer.from(pdf.output('arraybuffer')));
console.log('PASS: Belege, Rechnungsnummern, Fälligkeit, Mahnstufen, Bezahlt, Kleinunternehmer.');
