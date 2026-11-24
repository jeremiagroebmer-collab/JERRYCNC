const assert=require('node:assert/strict');
const T=require('../tooling.js'),S=require('../inventory-model.js'),W=require('../werkzeug3d.js');
const mk=x=>S.normalize(x);
const db={machines:[{id:'m',title:'Fräse',spindle:'SK40'}],tools:[
 {id:'f',...mk({toolKind:'Spannzangenfutter',interface:'SK40',outSize:'ER32',title:'ER32-Futter',stockGroup:'holders',totalLength:70,projection:70})},
 {id:'z',...mk({toolKind:'Spannzange',interface:'ER32',minDiameter:6,maxDiameter:20,title:'ER32',stockGroup:'holders',totalLength:40,projection:2,acceptShaft:'glatt,Weldon'})},
 {id:'c',...mk({toolKind:'Schaftfräser',shaftDiameter:12,shaftType:'glatt',diameter:12,cuttingLength:26,totalLength:83,projection:45,title:'Fräser 12',stockGroup:'cutting'})}]};
const a={machineId:'m',components:[{id:'f',qty:1},{id:'z',qty:1},{id:'c',qty:1}]};
let m=W.assembly(db,a,T);
assert.equal(m.tipZ,117);assert.equal(m.A,45);assert.equal(m.I,38);assert.equal(m.warn.length,0);assert.equal(T.length(db,a).value,117);
// Auspannlänge überschreiben: Gesamtlänge rechnet mit
a.stickout=30;m=W.assembly(db,a,T);assert.equal(m.A,30);assert.equal(m.I,53);assert.equal(m.tipZ,102);assert.equal(T.length(db,a).value,102);
// zu kurz ausgespannt / zu wenig eingespannt
a.stickout=10;m=W.assembly(db,a,T);assert.ok(m.warn.some(w=>/Schneidenlänge/.test(w)));
a.stickout=75;m=W.assembly(db,a,T);assert.ok(m.warn.some(w=>/mm eingespannt/.test(w)));assert.ok(m.warn.some(w=>/Lange Auskragung/.test(w)));
delete a.stickout;
// Zeichnung: ohne NaN, mit Maßen, die aufleuchten können
const svg=W.drawing(W.assembly(db,a,T));assert.ok(!svg.includes('NaN')&&!svg.includes('undefined'));
for(const k of ['stickout','insert','shaftDiameter','diameter','cuttingLength','holderLength','assemblyLength'])assert.ok(svg.includes('data-dim="'+k+'"'),k);
const one=W.single(db.tools[2]);assert.equal(one.parts.length,1);assert.ok(one.dims.some(d=>d.key==='shaftDiameter'&&/12/.test(d.text)));
assert.ok(!W.drawing(one).includes('NaN'));
// Schätzwerte werden gemeldet
const est=W.single(mk({toolKind:'Schaftfräser',shaftDiameter:8,diameter:8,stockGroup:'cutting'}));assert.ok(est.est.includes('Gesamtlänge'));
const SK=require('../werkzeugskizze.js'),A=require('../werkzeugbild.js');
const skCases=[['Schaftfräser',{shaftDiameter:12,diameter:12,cuttingLength:26,totalLength:83},'cutting','mill'],['Kugelfräser',{shaftDiameter:8,diameter:8,totalLength:60},'cutting','ball'],['Radiusfräser',{shaftDiameter:12,diameter:12,cornerRadius:1},'cutting','radius'],['Lollipopfräser',{shaftDiameter:8,diameter:10,neckDiameter:4,neckLength:20,totalLength:70},'cutting','lolli'],['Bohrer',{shaftDiameter:10,diameter:10,pointAngle:118},'cutting','drill'],['Gewindebohrer',{shaftDiameter:6,diameter:8},'cutting','tap'],['Drehmeißel',{shaftDiameter:20,diameter:25},'cutting','turn'],['Messerkopf',{shaftDiameter:22,diameter:50},'cutting','millhead'],['Spannzangenfutter',{interface:'SK40',outSize:'ER32',totalLength:70},'holders','erchuck'],['Schrumpffutter',{interface:'HSK63A',minDiameter:12},'holders','bore'],['Hydrodehnspannfutter',{interface:'SK40',minDiameter:12},'holders','bore'],['Weldon',{interface:'SK40',minDiameter:20},'holders','bore'],['Spannzange',{interface:'ER32',minDiameter:6,maxDiameter:20},'holders','collet'],['Reduzierhülse',{shaftDiameter:20,minDiameter:12,maxDiameter:12,shaftType:'glatt',acceptShaft:'glatt'},'holders','reducer'],['Verlängerung',{diameter:30},'holders','extension'],['Wendeschneidplatte',{inSize:'CNMG 1204'},'cutting','insert']];
for(const [kind,f,grp,ty] of skCases){const tool=mk({toolKind:kind,stockGroup:grp,...f}),d=SK.draw(tool,A.kind(tool));assert.ok(d,kind);assert.equal(d.type,ty,kind);assert.ok(!d.svg.includes('NaN')&&!d.svg.includes('undefined'),kind);for(const r of d.rows)assert.ok(d.svg.includes('data-dim="'+r.key+'"'),kind+' '+r.key);assert.match(SK.legend(d.rows,d.rows[0].key),/data-t3d-key/);const m3=W.single(tool);assert.ok(m3&&m3.tool,kind);if(!['insert'].includes(kind))assert.ok(!W.drawing(m3).includes('NaN'),kind)}
assert.equal(SK.draw(mk({toolKind:'Sonderwerkzeug',stockGroup:'cutting'}),'generic'),null);
const rows=SK.draw(mk({toolKind:'Schaftfräser',stockGroup:'cutting',diameter:10}),'endmill').rows;assert.equal(rows.find(r=>r.key==='diameter').value,'10 mm');assert.equal(rows.find(r=>r.key==='totalLength').value,null);
assert.equal(SK.draw(mk({toolKind:'Spannzange',stockGroup:'holders',interface:'ER32',minDiameter:6,maxDiameter:20}),'collet').rows.find(r=>r.key==='minDiameter').value,'6–20 mm');
// Kugel, Bohrer, Holder-Arten
for(const k of ['Kugelfräser','Bohrer','Gewindebohrer']){const p=W.single(mk({toolKind:k,shaftDiameter:6,diameter:6,cuttingLength:12,totalLength:60,stockGroup:'cutting'}));assert.ok(p&&p.parts[0].pts.every(q=>Number.isFinite(q[0])&&Number.isFinite(q[1])),k)}
for(const k of ['Schrumpffutter','Hydrodehnspannfutter','Weldon']){const p=W.single(mk({toolKind:k,interface:'HSK63A',minDiameter:12,totalLength:90,stockGroup:'holders'}));assert.ok(p&&!W.drawing(p).includes('NaN'),k)}
// ER-Normmaße
assert.equal(W.erOf('ER32').nut,50);assert.equal(W.erOf('er-25').l,34);assert.equal(W.erOf('SK40'),null);assert.equal(W.flangeOf('HSK63A'),63);assert.equal(W.flangeOf('SK40'),63);
// 3D-Netz und STL
const q=W.mesh(m,24);assert.ok(q.length>500);assert.ok(q.every(x=>x.v.every(p=>p.every(Number.isFinite))));
const r=W.stl(m,24);assert.equal(r.bytes.length,84+50*r.triangles);assert.equal(new DataView(r.bytes.buffer).getUint32(80,true),r.triangles);assert.ok(r.triangles>1000);
// Außenkontur: Schaft im Futter ist nicht sichtbar
const bands=W.union(m);assert.ok(!bands.some(b=>b.part.group==='cutter'&&b.z1<=72-1e-6&&b.tag==='shank'));
assert.equal(W.assembly(db,{machineId:'m',components:[]},T),null);
// Auch ohne Maße muss eine Zeichnung entstehen
for(const grp of ['cutting','holders'])for(const kind of S.kinds[grp]){const tool=mk({toolKind:kind,stockGroup:grp});const m3=W.single(tool);assert.ok(m3,kind);assert.ok(!W.drawing(m3).includes('NaN'),kind);const d=SK.draw(tool,A.kind(tool));if(d)assert.ok(!d.svg.includes('NaN')&&d.rows.every(r=>r.value===null),kind);assert.ok(W.mesh(m3,12).length>0,kind)}
console.log('werkzeug3d ok');
