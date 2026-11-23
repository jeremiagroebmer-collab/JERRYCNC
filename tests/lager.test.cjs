const assert=require('node:assert/strict');
const L=require('../lager.js'),{jsPDF}=require('../vendor/jspdf-4.2.1.min.js'),qrcode=require('../vendor/qrcode-generator-1.4.4.js'),fonts=require('../vendor/pdf-fonts.js');
const db={materials:[{id:'m1',title:'Alu 6082',number:'M-1',qty:5,min:20,unit:'kg'},{id:'m2',title:'Stahl',qty:50,min:10,unit:'kg'},{id:'m3',title:'Kupfer',qty:2,min:0,unit:'kg'}],suppliers:[{title:'A GmbH',lead:3}],
purchasing:[{id:'p1',materialId:'m1',supplier:'A GmbH',qty:10,amount:50,status:'Geliefert'},{id:'p2',materialId:'m1',supplier:'B KG',qty:10,amount:40,status:'Geliefert'}]};
let r=L.shoppingList(db);assert.equal(r.length,1);assert.equal(r[0].need,15);assert.equal(r[0].best.supplier,'B KG');assert.equal(r[0].best.unit,4);
r=L.shoppingList(db,[{materialId:'m3',qty:4,reason:'Auftrag X'},{materialId:'m2',qty:0,reason:'x'}]);assert.equal(r.length,2);assert.equal(r.find(x=>x.title==='Kupfer').need,4);
db.purchasing.push({id:'p3',materialId:'m1',qty:20,receivedQty:5,status:'Teilgeliefert'});assert.equal(L.shoppingList(db).length,0);
db.purchasing.pop();
const row=L.shoppingList(db)[0],p=L.makeRequest(db,row,'2026-11-23','pp');assert.equal(p.qty,15);assert.equal(p.amount,60);assert.equal(p.status,'Anfrage');assert.equal(p.due,'');
assert.equal(L.shoppingList(db).length,0);
const db2=JSON.parse(JSON.stringify(db));db2.purchasing=[];db2.materials[0].qty=5;const r2=L.shoppingList(db2)[0];L.makeRequest(db2,r2,'2026-11-23');assert.throws(()=>L.makeRequest(db2,r2,'2026-11-23'),/schon eine offene/);
const items=Array.from({length:30},(_,i)=>({title:'Teil '+i,line2:'Regal A, Fach '+i,url:'https://x.test/#record=materials:'+i}));
const {pdf}=L.labels(items,{jsPDF,qrcode,fonts});assert.equal(pdf.getNumberOfPages(),2);
console.log('PASS: Einkaufsliste, Lieferantenvergleich, Anfrage, Etiketten.');
