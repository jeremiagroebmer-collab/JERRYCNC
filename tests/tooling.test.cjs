const assert=require('node:assert/strict'),T=require('../tooling.js');
const machine={id:'m',title:'Fräse',spindle:'SK40'};
const er={id:'er',title:'ER32 Futter',componentType:'Halter',role:'Aufnahme/Futter',system:'Spannzangenfutter',inKind:'Maschinenkegel',inSize:'SK40',outKind:'ER-Spannsystem',outSize:'ER32',projection:70};
const collet={id:'collet',title:'Spannzange',componentType:'Spannzange',subtype:'Spannzange',interface:'ER32',diameter:12,role:'Spannmittel',system:'Spannzange',inKind:'ER-Spannsystem',inSize:'ER32',outKind:'Zylinderschaft',minDiameter:11,maxDiameter:12,acceptShaft:'glatt,Weldon',projection:0};
const cutter={id:'cut',title:'Ø12 Schaftfräser lang',subtype:'Schaftfräser',componentType:'Schneidwerkzeug',role:'Schneidwerkzeug',diameter:12,variant:'lang',inKind:'Zylinderschaft',inSize:'12',shaftType:'glatt',projection:35,isoGroups:'N'};
const shrink={...er,id:'shrink',system:'Schrumpffutter',outKind:'Zylinderschaft',outSize:'',minDiameter:12,maxDiameter:12,acceptShaft:'glatt'};
const db={machines:[machine],tools:[er,collet,cutter,shrink]},a={machineId:'m',components:[]};
for(const q of ['12 fräser','fräser ø12','Schaftfräser 12','Durchmesser 12 schaftfräser'])assert.ok(T.search(cutter,q));assert.equal(T.search(cutter,'13 fräser'),false);
assert.equal(T.name(cutter,{order:'diameter,type',diameterStyle:'plain'}),'12 Schaftfräser');assert.equal(T.name(cutter,{order:'diameter,type,variant'}),'Ø12 Schaftfräser lang');assert.equal(T.name(collet,{order:'type,interface,diameter'}),'Spannzange ER32 Ø12');
assert.equal(T.suitability(cutter,{title:'EN AW-6082 Aluminium'}),'yes');assert.equal(T.suitability(cutter,{materialGroup:'P'}),'no');assert.equal(T.suitability({...cutter,isoGroups:''},{materialGroup:'P'}),'unknown');assert.equal(T.suitability(er,{materialGroup:'H'}),'yes');assert.equal(T.suitability({...cutter,role:'Wendeschneidplatte',gradeCoating:'Test',isoGroups:'P,M'},{materialGroup:'M'}),'yes');
assert.ok(T.candidate(db,a,er).ok);assert.equal(T.candidate(db,{...a,machineId:'absent'},er).ok,false);assert.equal(T.candidate(db,a,{...er,inSize:'BT40'}).ok,false);
a.components.push({id:'er',qty:1});assert.ok(T.candidate(db,a,collet).ok);assert.equal(T.candidate(db,a,{...collet,inSize:'ER11'}).ok,false);assert.equal(T.candidate(db,a,cutter).ok,false);
a.components.push({id:'collet',qty:1});assert.ok(T.candidate(db,a,cutter).ok);assert.equal(T.candidate(db,a,{...cutter,inSize:'13'}).ok,false);a.components.push({id:'cut',qty:1});assert.equal(T.chain(db,a).complete,true);assert.equal(T.chain(db,a).ok,true);assert.equal(T.candidate(db,a,cutter).ok,false);assert.equal(T.length(db,a).value,105);
assert.equal(T.fit(shrink,collet).ok,false);assert.equal(T.fit({...shrink,system:'Hydrodehnspannfutter'},collet).ok,false);assert.ok(T.fit(shrink,cutter).ok);assert.equal(T.fit(shrink,{...cutter,shaftType:'Weldon'}).ok,false);assert.equal(T.fit(shrink,{...cutter,inSize:10}).ok,false);
const holder={...shrink,role:'Plattenhalter',system:'Plattenhalter',outKind:'Plattenaufnahme',outSize:'CNMG 1204',plateSeats:2};const plate={id:'plate',role:'Wendeschneidplatte',inKind:'Plattenaufnahme',inSize:'CNMG 1204',projection:0};assert.ok(T.fit(holder,plate).ok);assert.equal(T.fit(holder,{...plate,inSize:'CNMG 1606'}).ok,false);assert.equal(T.fit(holder,{...plate,inSize:'DNMG 1204'}).ok,false);
assert.ok(T.missing({...er,system:''}).some(x=>x.includes('Aufnahmesystem')));assert.equal(T.chain({tools:[{id:'legacy',title:'Alt'}],machines:[machine]},{machineId:'m',components:[{id:'legacy',qty:1}]}).unknown,true);assert.equal(T.length({tools:[{id:'legacy'}]},{components:[{id:'legacy',qty:1}]}).value,null);
console.log('PASS: flexible names/search, ISO/material groups, ER/shrink/hydro/shaft/plate/spindle mismatches, missing data, complete chains and mounted lengths.');

assert.equal(T.suitability({...cutter,isoGroups:'',suitableMaterials:'Stahl'},{title:'Edelstahl'}),'no');assert.equal(T.suitability({...cutter,isoGroups:'',suitableMaterials:'Stahl, Edelstahl'},{title:'Edelstahl'}),'yes');

assert.equal(T.candidate(db,a,er).ok,false,'Repeated component must not merge into an invalid multi-part connection');
