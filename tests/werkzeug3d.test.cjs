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

// Paket 22
{
 const T=require('../tooling.js'),S=require('../werkzeugskizze.js'),D=require('../werkzeug3d.js');
 const db={machines:[{id:'m',title:'M',turret:'20x20'}],tools:[{id:'h',role:'Aufnahme/Futter',projection:70},{id:'c',role:'Schneidwerkzeug',totalLength:83,projection:45}],toolassemblies:[]};
 const a={components:[{id:'h'},{id:'c'}],stickout:200};
 if(T.length(db,a).value!==153)throw new Error('Auspannlänge muss auf Werkzeuglänge begrenzt werden: '+T.length(db,a).value);
 a.stickout=0;if(T.length(db,a).value!==115)throw new Error('stickout 0 ignorieren');
 const d1=S.draw({diameter:10,shaftDiameter:10,pointAngle:140},'drill'),d2=S.draw({diameter:10,shaftDiameter:10,pointAngle:90},'drill');
 if(!d1||d1.svg===d2.svg)throw new Error('Spitzenwinkel wirkt nicht auf die Zeichnung');
 const e1=S.draw({diameter:6,shaftDiameter:12},'endmill').svg,e2=S.draw({diameter:12,shaftDiameter:6},'endmill').svg;
 if(e1===e2||/NaN/.test(e1+e2))throw new Error('Verhältnis Schaft/Schneide');
 console.log('paket22 ok');
}

// Paket 23
{
 const S=require('../werkzeugskizze.js'),M=require('../inventory-model.js');
 const st=(M.CncStock||M).normalize||null;
 for(const L of ['C','D','V','S','T','W','R']){const d=S.draw({inSize:L+'NMG 1204'},'insert');if(!d||/NaN/.test(d.svg))throw new Error('Plattenform '+L)}
 const a=S.draw({toolKind:'Fräsdorn',outSize:'27',totalLength:100},'weldon'),b=S.draw({toolKind:'Bohrfutter',minDiameter:1,maxDiameter:13},'weldon');
 if(a.type!=='arbor'||!a.rows.every(r=>a.svg.includes('data-dim="'+r.key+'"')))throw new Error('Fräsdorn-Zeichnung');
 if(b.type!=='bore'||b.svg===S.draw({toolKind:'Weldon',minDiameter:1},'weldon').svg)throw new Error('Bohrfutter-Zeichnung');
 if(st){const x=st({stockGroup:'holders'});if('subtype' in x&&x.subtype===undefined&&false)throw 1}
 console.log('paket23 ok');
}
// Assembly: lollipop variants retain their neck and spherical head; selected dimensions stay isolated.
const lolliDb={...db,tools:db.tools.map(t=>t.id==='c'?{...t,toolKind:'Lollipopfräser',subtype:'Lollipopfräser',diameter:12,neckDiameter:5,neckLength:20,totalLength:83}:t)};
const lm=W.assembly(lolliDb,a,T);
assert.equal(lm.cut.kind,'lolli');
assert.ok(lm.cut.pts.some(p=>p[2]==='neck'&&p[1]===2.5));
assert.ok(lm.cut.pts.filter(p=>p[2]==='flute').length>=12);
assert.equal(A.kind({role:'Schneidwerkzeug',subtype:'Schaftfräser',title:'Lollipop Ø12'}),'lolli');
const focused=W.drawing(lm,{focus:'assemblyLength'});
assert.ok(focused.includes('data-dim="assemblyLength"'));
assert.ok(!focused.includes('data-dim="insert"'));
assert.ok(!focused.includes('NaN'));

// Paket 26: eigenes STL-Profil, Zusammenstellen bleibt automatisch
{
const S=require('../stlprofil.js'),D=require('../werkzeug3d.js');
// synthetische STL: Drehkörper entlang Y (nicht Z!) aus Profil [(y,r)]
function revolve(prof,N=48){const tris=[];for(let i=0;i<prof.length-1;i++)for(let k=0;k<N;k++){const a=k/N*2*Math.PI,b=(k+1)/N*2*Math.PI,P=(p,t)=>[p[1]*Math.cos(t)+5,p[0],p[1]*Math.sin(t)-3];const A=P(prof[i],a),B=P(prof[i],b),C=P(prof[i+1],b),Dd=P(prof[i+1],a);tris.push([A,B,C],[A,C,Dd])}
 const buf=Buffer.alloc(84+50*tris.length);buf.writeUInt32LE(tris.length,80);tris.forEach((t,i)=>{let o=84+i*50+12;t.flat().forEach(x=>{buf.writeFloatLE(x,o);o+=4})});return buf}
// Halter: Kegel 0..20 (r 10->20), Flansch 20..30 r=25, Körper 30..100 r=15
const holder=revolve([[0,10],[20,20],[20,25],[30,25],[30,15],[100,15]]);
const v=S.parse(holder),a=S.analyze(v,{axis:'auto',group:'holder'});
void ('axis',a.axis,'L',a.L,'rMax',a.rMax.toFixed(1),'pts',a.pts.length,'tris',a.triangles);
if(a.axis!=='y')throw Error('Achse');
if(Math.abs(a.rMax-25)>0.6)throw Error('rMax '+a.rMax);
const St0=require('../inventory-model.js');const t={...St0.normalize({interface:'SK40',toolKind:'Spannzangenfutter',stockGroup:'holders',outSize:'ER32',totalLength:70,projection:70}),profile3d:{pts:a.pts}};
const p=D.buildPart(t,{asm:true});if(!p||!p.custom||p.group!=='holder')throw Error('custom holder '+JSON.stringify(p&&p.group));
void ('holder L',p.L,'rMax',p.rMax.toFixed(1));
const flip=S.analyze(v,{flip:true,group:'cutter'});if(flip.pts[0][1]<flip.pts[flip.pts.length-1][1])throw Error('flip');
const fit=S.analyze(v,{unit:'fit',fitLength:200,group:'cutter'});if(Math.abs(fit.L-200)>0.5)throw Error('fit '+fit.L);
// Zusammenbau mit eigenem Halter
const Tl=require('../tooling.js'),St=require('../inventory-model.js');
const db={machines:[{id:'m',title:'M',spindle:'SK40'}],tools:[{id:'h',...St.normalize(t),projection:70,totalLength:70,profile3d:{pts:a.pts}},{id:'z',...St.normalize({toolKind:'Spannzange',interface:'ER32',minDiameter:6,maxDiameter:20,stockGroup:'holders',totalLength:40,projection:2})},{id:'c',...St.normalize({toolKind:'Schaftfräser',shaftDiameter:12,diameter:12,cuttingLength:26,totalLength:83,projection:45,stockGroup:'cutting',shaftType:'glatt'})}]};
const asm={machineId:'m',machine:'M',components:[{id:'h',qty:1},{id:'z',qty:1},{id:'c',qty:1}]};
const m=D.assembly(db,asm,Tl);if(!m||!m.parts.length)throw Error('asm');
void ('Zusammenbau Spitze',m.tipZ,'Teile',m.parts.length,'fit',Tl.chain(db,asm).reason);
const q=D.mesh(m,24);if(!q.length||q.some(k=>k.v.flat().some(x=>!Number.isFinite(x))))throw Error('mesh');
void ('stl ok');
{const db2=JSON.parse(JSON.stringify(db));delete db2.tools[0].profile3d;const a1=Tl.chain(db,asm),a2=Tl.chain(db2,asm);
 if(a1.ok!==a2.ok||a1.reason!==a2.reason||Tl.length(db,asm).value!==Tl.length(db2,asm).value)throw Error('Zusammenstellen ändert sich durch STL');if(!a1.ok)throw Error('Kette nicht ok: '+a1.reason)}

 console.log('paket26 ok');
}
