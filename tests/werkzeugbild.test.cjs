const assert=require('node:assert/strict');
const A=require('../werkzeugbild.js'),T=require('../tooling.js'),S=require('../inventory-model.js');
assert.equal(A.kind({role:'Aufnahme/Futter',system:'Schrumpffutter'}),'shrink');
assert.equal(A.kind({role:'Spannmittel',system:'Spannzange'}),'collet');
assert.equal(A.kind({role:'Schneidwerkzeug',subtype:'Bohrer'}),'drill');
assert.equal(A.kind({role:'Schneidwerkzeug',subtype:'Gewindebohrer'}),'tap');
assert.equal(A.kind({role:'Schneidwerkzeug',subtype:'Schaftfräser'}),'endmill');
assert.equal(A.kind(null),'generic');
for(const t of A.tiles){const svg=A.kindIcon(t.k);assert.match(svg,/^<svg/);assert.ok(!svg.includes('NaN'),t.k);assert.ok(S.kinds[t.group].includes(t.kind),t.kind)}
// Kette: SK40 -> ER-Futter -> Spannzange -> Fräser
const mk=x=>S.normalize(x);
const db={machines:[{id:'m',title:'Fräse',spindle:'SK40'}],tools:[
 {id:'f',...mk({toolKind:'Spannzangenfutter',interface:'SK40',outSize:'ER32',title:'ER32-Futter',stockGroup:'holders'})},
 {id:'z',...mk({toolKind:'Spannzange',interface:'ER32',minDiameter:6,maxDiameter:8,title:'ER32 6-8',stockGroup:'holders'})},
 {id:'c',...mk({toolKind:'Schaftfräser',shaftDiameter:8,shaftType:'glatt',diameter:8,title:'Fräser 8',stockGroup:'cutting'})}]};
const a={machineId:'m',components:[{id:'f',qty:1},{id:'z',qty:1}]};
let svg=A.stack(db,a,T);assert.match(svg,/Als Nächstes/);assert.match(svg,/Fräser, Bohrer oder Verlängerung/);assert.ok(!svg.includes('NaN')&&!svg.includes('undefined'));
a.components.push({id:'c',qty:1});svg=A.stack(db,a,T);assert.ok(!svg.includes('Als Nächstes'));assert.ok(!svg.includes('NaN'));
assert.match(A.stack(db,{components:[]},T),/Maschine wählen/);
assert.match(A.nextHint({outKind:'ER-Spannsystem',outSize:'ER32'}),/ER32/);
console.log('werkzeugbild ok');
