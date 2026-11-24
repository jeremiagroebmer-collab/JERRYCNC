/* CNC OS Werkzeugbilder: Zeichnungen der Teile und des Zusammenbaus (SVG, ohne Fremdbilder). */
(function(root){
'use strict';
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const INK='var(--ink,#cfe0ee)';
// Welche Zeichnung gehört zu einem Teil?
function kind(t){
 if(!t)return 'generic';
 const role=t.role||'',sys=t.system||'',sub=norm([t.subtype,t.toolKind,t.type].join(' '));
 if(role==='Maschinenanschluss')return 'adapter';
 if(role==='Aufnahme/Futter'||t.componentType==='Halter'){if(sys==='Spannzangenfutter')return 'erchuck';if(sys==='Schrumpffutter')return 'shrink';if(sys==='Hydrodehnspannfutter')return 'hydro';if(sys==='Weldon')return 'weldon';if(sys==='Bohrfutter')return 'erchuck';return 'weldon'}
 if(role==='Spannmittel'||t.componentType==='Spannzange'){return sys==='Reduzierhülse'?'reducer':'collet'}
 if(role==='Verlängerung'||t.componentType==='Verlängerung')return 'extension';
 if(role==='Plattenhalter')return 'insertholder';
 if(role==='Wendeschneidplatte'||t.componentType==='Wendeplatte')return 'insert';
 if(/drehmeissel|drehwerkzeug/.test(sub))return 'turn';
 if(/gewindebohr|gewindeform|gewindefras/.test(sub))return 'tap';
 if(/lolli/.test(sub))return 'lolli';
 if(/radiusfr|eckradius|torus/.test(sub))return 'radius';
 if(/kugel/.test(sub))return 'ball';
 if(/bohrer|reibahle|senker/.test(sub))return 'drill';
 if(role==='Schneidwerkzeug'||t.componentType==='Schneidwerkzeug'||/frae|fras|schaft/.test(sub))return 'endmill';
 return 'generic';
}
const GROUP={adapter:'spindle',erchuck:'holder',shrink:'holder',hydro:'holder',weldon:'holder',collet:'collet',reducer:'collet',extension:'holder',insertholder:'holder',turn:'cutter',tap:'cutter',ball:'cutter',lolli:'cutter',radius:'cutter',drill:'cutter',endmill:'cutter',insert:'insert',generic:'generic'};
const LABEL={adapter:'Maschinenanschluss',erchuck:'ER-Futter',shrink:'Schrumpffutter',hydro:'Dehnspannfutter',weldon:'Weldon-Aufnahme',collet:'Spannzange',reducer:'Reduzierhülse',extension:'Verlängerung',insertholder:'Plattenhalter',turn:'Drehwerkzeug',tap:'Gewindewerkzeug',ball:'Kugelfräser',lolli:'Lollipopfräser',radius:'Radiusfräser',drill:'Bohrer',endmill:'Fräser',insert:'Wendeplatte',generic:'Teil',spindle:'Maschine'};
const OL='#38434b';
const st=(fill,extra='')=>'fill="'+fill+'" stroke="'+OL+'" stroke-width="1.1" stroke-linejoin="round" '+extra;
const ln=(x1,y1,x2,y2,o='.5')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#14202b" stroke-width=".9" stroke-opacity="'+o+'" stroke-linecap="round"/>';
const crv=(d,o='.55')=>'<path d="'+d+'" fill="none" stroke="#0d3a35" stroke-width="1" stroke-opacity="'+o+'" stroke-linecap="round"/>';
const poly=(pts,fill)=>'<polygon points="'+pts.map(p=>p.join(',')).join(' ')+'" '+st(fill)+'/>';
const rect=(x,y,w,h,fill,r=2)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" '+st(fill)+'/>';
// Metall-Verläufe quer zur Achse (Zylinder-Optik), in jeder Zeichnung einmal eingebettet
const DEFS='<defs><linearGradient id="ta-c" x1="0" x2="1"><stop offset="0" stop-color="#454e54"/><stop offset=".32" stop-color="#e2e8e7"/><stop offset=".62" stop-color="#839692"/><stop offset="1" stop-color="#394a49"/></linearGradient><linearGradient id="ta-h" x1="0" x2="1"><stop offset="0" stop-color="#4b6682"/><stop offset=".3" stop-color="#b4c8dc"/><stop offset=".62" stop-color="#6f8cab"/><stop offset="1" stop-color="#3d546c"/></linearGradient><linearGradient id="ta-g" x1="0" x2="1"><stop offset="0" stop-color="#9a6f1c"/><stop offset=".3" stop-color="#f1d083"/><stop offset=".62" stop-color="#d4a03a"/><stop offset="1" stop-color="#85601a"/></linearGradient><linearGradient id="ta-i" x1="0" x2="1" y2="1"><stop offset="0" stop-color="#80602b"/><stop offset=".45" stop-color="#ebd092"/><stop offset="1" stop-color="#aa8442"/></linearGradient><linearGradient id="ta-s" x1="0" x2="1"><stop offset="0" stop-color="#6b7886"/><stop offset=".3" stop-color="#e3e8ed"/><stop offset=".62" stop-color="#a3adb8"/><stop offset="1" stop-color="#5e6b78"/></linearGradient></defs>';
const COL={holder:'url(#ta-h)',collet:'url(#ta-g)',cutter:'url(#ta-c)',insert:'url(#ta-i)',spindle:'url(#ta-s)',steel:'url(#ta-s)',generic:'url(#ta-s)'};
const SOLID={cutter:'#2fb5a3'};
// Continuous flutes with a dark rake face and a narrow polished cutting edge.
function flutes(cx,y,r,h){
 let out='';
 for(let i=0;i<3;i++){
  const a=y+i*h/3,b=Math.min(y+h,a+h*.52),x0=cx-r,x1=cx+r;
  out+='<path d="M'+x0+' '+a+' C'+(cx-r*.3)+' '+(a+h*.2)+' '+(cx+r*.2)+' '+(b-h*.12)+' '+x1+' '+b+' L'+x1+' '+Math.min(y+h,b+3)+' C'+cx+' '+(b-h*.04)+' '+(cx-r*.5)+' '+(a+h*.2)+' '+x0+' '+(a+4)+'Z" fill="#344642" opacity=".8"/>';
  out+='<path d="M'+x0+' '+a+' C'+(cx-r*.3)+' '+(a+h*.2)+' '+(cx+r*.2)+' '+(b-h*.12)+' '+x1+' '+b+'" fill="none" stroke="#f0f5ed" stroke-width=".65"/>';
 }
 return out;
}
// Catalogue silhouettes: steel bodies, machined edges and visible functional features.
function cataloguePart(k,cx,y){
 const steel=COL.steel,body=COL.holder,gold=COL.insert;
 const path=(d,f)=>'<path d="'+d+'" '+st(f)+'/>';
 const ellipse=(x,y,rx,ry,f)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" '+st(f)+'/>';
 let svg='',h=56,w=46;
 if(k==='erchuck'){
  svg=path('M-8 1H8L13 23H-13Z',steel)+rect(-21,23,42,6,steel,1)+ln(-21,26,21,26,.65)
   +path('M-14 29H14L12 39H-12Z',body)+path('M-18 39L-21 43V52L-17 57H17L21 52V43L18 39Z',steel)
   +[-15,-7,7,15].map(x=>rect(x-1,43,2,8,'#48535c',.6)).join('')
   +ellipse(0,57,16,3,steel)+ellipse(0,57,8,1.6,'#263640');h=60;w=44;
 }else if(k==='collet'){
  svg=path('M-10 3H10L18 30L16 39H-16L-18 30Z',steel)+rect(-15,39,30,3,'#4e5b64',.3)+rect(-16,42,32,6,steel,1)
   +ellipse(0,48,16,4,steel)+ellipse(0,48,7,2,'#25343c')
   +[-11,-5,5,11].map((x,i)=>'<path d="M'+(x*.58)+' 6L'+x+' 31V'+(i%2?38:46)+'" fill="none" stroke="#34434b" stroke-width="1.2"/>').join('')
   +ln(0,19,0,45,.85)+ellipse(0,3,10,2.2,steel)+ellipse(0,3,4,1,'#34434b');h=53;w=38;
 }else if(k==='extension'){
  svg=ellipse(0,3,7,2,steel)+rect(-7,3,14,28,steel,.7)+path('M-7 31H7L13 35V56H-13V35Z',steel)
   +ellipse(0,56,13,3,steel)+ellipse(0,56,6,1.6,'#25343c')+ln(-13,39,13,39,.35)
   +rect(9,43,3,7,'#48545f',.5)+ln(-4,7,-4,28,.18);h=60;w=28;
 }else if(k==='insert'){
  svg=path('M-24 23L-6 3L24 19V27L6 47L-24 31Z','#9c7836')
   +path('M-24 23L-6 3L24 19L6 39Z',gold)
   +path('M-18 22L-5 8L18 20L5 33Z','#c4a35e')
   +path('M-14 22L-4 12L14 21L4 29Z',gold)
   +ellipse(0,21,6.5,5,'#8d713f')+ellipse(0,22,4.2,3.2,'#28353d')
   +ln(6,39,6,46,.65);h=49;w=50;
 }else if(k==='insertholder'){
  svg=path('M-24 17Q0 7 24 17V39Q0 51 -24 39Z',body)+ellipse(0,17,24,9,steel)
   +ellipse(0,17,9,4,'#293740')+ellipse(0,16,6,2.5,'#111e26')
   +path('M-24 26L-14 28V42L-24 38Z','#25343f')+path('M14 28L24 26V38L14 42Z','#25343f')
   +path('M-6 32H6V47H-6Z','#25343f')
   +path('M-23 29L-16 31L-17 43L-25 40Z',gold)+path('M17 31L24 28L25 40L17 44Z',gold)
   +path('M-4 35H4L5 47H-5Z',gold)
   +ellipse(-20,36,1.4,1.7,'#5e512f')+ellipse(21,36,1.4,1.7,'#5e512f')+ellipse(0,41,1.5,1.5,'#5e512f')
   +ln(-17,15,-12,12,.55)+ln(12,12,17,15,.55);h=49;w=52;
 }else return null;
 return {h,w,svg:'<g transform="translate('+cx+' '+y+')">'+svg+'</g>'};
}
// Taper-Stummel oben (Maschinenseite) für Halter
const taper=(cx,y,h=14,w=12)=>poly([[cx-w,y],[cx+w,y],[cx+w+4,y+h],[cx-w-4,y+h]],COL.steel);
// Eine Form zeichnen: Mitte cx, Oberkante y, Durchmesser d (nur Schneiden). Gibt {svg,h,w} zurück.
function shape(k,cx,y,d){
 const detailed=cataloguePart(k,cx,y);if(detailed)return detailed;
 const g=COL[GROUP[k]||'generic'],cw=Math.max(10,Math.min(36,(num(d)||8)*2.4)),R=cw/2,S=COL.steel;
 switch(k){
  case 'adapter':return {h:34,w:64,svg:rect(cx-32,y,64,8,S,2)+poly([[cx-26,y+8],[cx+26,y+8],[cx+14,y+34],[cx-14,y+34]],S)+ln(cx-20,y+12,cx-11,y+30,.25)};
  case 'shrink':return {h:56,w:44,svg:taper(cx,y,12)+rect(cx-22,y+12,44,5,g,1)+poly([[cx-17,y+17],[cx+17,y+17],[cx+7,y+56],[cx-7,y+56]],g)+ln(cx-5,y+24,cx-2,y+52,.3)};
  case 'hydro':return {h:52,w:40,svg:taper(cx,y,11)+rect(cx-21,y+11,42,5,g,1)+poly([[cx-17,y+16],[cx+17,y+16],[cx+12,y+27],[cx+12,y+52],[cx-12,y+52],[cx-12,y+27]],g)+'<circle cx="'+cx+'" cy="'+(y+34)+'" r="2.6" '+st('#c9d3dc')+'/>'};
  case 'weldon':return {h:44,w:34,svg:taper(cx,y,9,10)+rect(cx-20,y+9,40,5,g,1)+rect(cx-14,y+14,28,30,g,3)+rect(cx+14,y+27,6,9,S,1)+ln(cx-8,y+18,cx-8,y+40,.25)};
  case 'reducer':return {h:26,w:28,svg:poly([[cx-14,y],[cx+14,y],[cx+9,y+26],[cx-9,y+26]],g)+'<line x1="'+cx+'" y1="'+(y+3)+'" x2="'+cx+'" y2="'+(y+23)+'" stroke="#14202b" stroke-dasharray="2 2" stroke-opacity=".5"/>'};
  case 'turn':return {h:42,w:38,svg:rect(cx-18,y,36,28,S,2)+poly([[cx-18,y+28],[cx+18,y+28],[cx+18,y+36],[cx+8,y+42],[cx-18,y+34]],S)+poly([[cx+8,y+30],[cx+18,y+30],[cx+18,y+38],[cx+10,y+41]],COL.insert)+ln(cx-18,y+10,cx+18,y+10,.2)};
  case 'tap':return {h:56,w:cw,svg:rect(cx-4,y,8,6,S,1)+rect(cx-5,y+6,10,16,S,1)+poly([[cx-5,y+22],[cx+5,y+22],[cx+R*0.6+2,y+28],[cx-R*0.6-2,y+28]],S)+poly([[cx-R*0.6-2,y+28],[cx+R*0.6+2,y+28],[cx+R*0.6+2,y+51],[cx+R*0.35,y+56],[cx-R*0.35,y+56],[cx-R*0.6-2,y+51]],g)+[0,1,2,3,4].map(i=>ln(cx-R*0.6-2,y+33+i*4.6,cx+R*0.6+2,y+31+i*4.6,.55)).join('')};
  case 'drill':return {h:60,w:cw,svg:rect(cx-6,y,12,21,S,1)+poly([[cx-6,y+21],[cx+6,y+21],[cx+R,y+26],[cx-R,y+26]],S)+poly([[cx-R,y+26],[cx+R,y+26],[cx+R,y+50],[cx,y+60],[cx-R,y+50]],g)+flutes(cx,y+28,R,21)};
  case 'ball':return {h:58,w:cw,svg:rect(cx-6,y,12,21,S,1)+poly([[cx-6,y+21],[cx+6,y+21],[cx+R,y+26],[cx-R,y+26]],S)+'<path d="M'+(cx-R)+' '+(y+26)+'H'+(cx+R)+'V'+(y+58-R)+'A'+R+' '+R+' 0 0 1 '+(cx-R)+' '+(y+58-R)+'Z" '+st(g)+'/>'+flutes(cx,y+28,R,Math.max(10,29-R))};
  case 'lolli':return {h:58,w:cw,svg:rect(cx-6,y,12,20,S,1)+poly([[cx-6,y+20],[cx+6,y+20],[cx+2,y+25],[cx-2,y+25]],S)+rect(cx-2,y+25,4,15,S,0)+'<circle cx="'+cx+'" cy="'+(y+47)+'" r="'+Math.max(8,Math.min(11,R*0.8))+'" '+st(g)+'/>'+crv('M'+(cx-5)+' '+(y+44)+'Q'+cx+' '+(y+47)+' '+(cx+5)+' '+(y+52))};
  case 'radius':return {h:54,w:cw,svg:rect(cx-6,y,12,21,S,1)+poly([[cx-6,y+21],[cx+6,y+21],[cx+R,y+26],[cx-R,y+26]],S)+'<path d="M'+(cx-R)+' '+(y+26)+'H'+(cx+R)+'V'+(y+49)+'Q'+(cx+R)+' '+(y+54)+' '+(cx+R-5)+' '+(y+54)+'H'+(cx-R+5)+'Q'+(cx-R)+' '+(y+54)+' '+(cx-R)+' '+(y+49)+'Z" '+st(g)+'/>'+flutes(cx,y+28,R,22)};
  case 'endmill':return {h:54,w:cw,svg:rect(cx-6,y,12,21,S,1)+poly([[cx-6,y+21],[cx+6,y+21],[cx+R,y+26],[cx-R,y+26]],S)+'<path d="M'+(cx-R)+' '+(y+26)+'H'+(cx+R)+'V'+(y+52)+'L'+(cx+R-2)+' '+(y+54)+'H'+(cx-R+2)+'L'+(cx-R)+' '+(y+52)+'Z" '+st(g)+'/>'+flutes(cx,y+28,R,22)};
  default:return {h:36,w:30,svg:rect(cx-14,y,28,36,S,5)};
 }
}
// Einzelnes Teil als kleines Bild (für Karten und Listen).
function icon(t,size=44){const k=kind(t),s=shape(k,30,6,t&&t.diameter);return '<svg class="tool-art" viewBox="0 0 60 70" width="'+size+'" height="'+Math.round(size*70/60)+'" role="img" aria-label="'+esc(LABEL[k]||'Teil')+'">'+DEFS+s.svg+'</svg>'}
function kindIcon(k,size=64){const s=shape(k,0,0,8),scale=Math.min(50/s.w,56/s.h);return '<svg class="tool-art" viewBox="0 0 60 70" width="'+size+'" height="'+Math.round(size*70/60)+'" role="img" aria-label="'+esc(LABEL[k]||'Teil')+'">'+DEFS+'<g transform="translate(30 '+((70-s.h*scale)/2)+') scale('+scale+')">'+s.svg+'</g></svg>'}
// Was wird als Nächstes gebraucht?
function nextHint(up){
 if(!up)return 'Zuerst Maschine wählen';
 if(up.outKind==='Maschinenkegel')return 'Aufnahme oder Futter für '+(up.outSize||'die Spindel');
 if(up.outKind==='ER-Spannsystem')return 'Spannzange '+(up.outSize||'ER');
 if(up.outKind==='Zylinderschaft'){const lo=num(up.minDiameter),hi=num(up.maxDiameter);return 'Fräser, Bohrer oder Verlängerung mit Schaft '+(lo!==null&&hi!==null?(lo===hi?'Ø '+lo:'Ø '+lo+'–'+hi)+' mm':'passend')}
 if(up.outKind==='Fräsdorn')return 'Messerkopf auf Dorn '+(up.outSize||'');
 if(up.outKind==='Plattenaufnahme')return 'Wendeplatte '+(up.outSize||'');
 if(up.outKind==='Vierkantschaft')return 'Drehwerkzeug mit Vierkantschaft '+(up.outSize||'');
 return 'Nächstes passendes Teil';
}
const cut=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s};
// Ganzer Zusammenbau von oben (Maschine) nach unten (Schneide).
function stack(db,a,Tooling){
 const c=Tooling.chain(db,a),cx=86,W=340;let y=10;const out=[],joints=[];
 const label=(yy,t1,t2,bad)=>'<text x="170" y="'+(yy+4)+'" font-size="12" font-weight="700" fill="'+INK+'">'+esc(cut(t1,26))+'</text>'+(t2?'<text x="170" y="'+(yy+19)+'" font-size="10.5" fill="'+(bad?'#e0605a':INK)+'" fill-opacity="'+(bad?'1':'.75')+'">'+esc(cut(t2,34))+'</text>':'');
 const mach=c.machine;
 if(mach&&c.up!==undefined){const s=shape('adapter',cx,y,0);out.push(s.svg+label(y+10,mach.title||'Maschine',mach.spindle||mach.turret||'Anschluss fehlt',!(mach.spindle||mach.turret)));y+=s.h}
 else{out.push('<rect x="'+(cx-32)+'" y="'+y+'" width="64" height="34" rx="6" fill="none" stroke="'+INK+'" stroke-dasharray="4 3" stroke-opacity=".6"/>'+label(y+10,'Maschine wählen','Dann prüft die App die Anschlüsse',false));y+=34}
 for(const r of c.rows){
  const k=kind(r.part),s=shape(k,cx,y+4,r.part&&r.part.diameter);
  joints.push('<circle cx="'+cx+'" cy="'+(y+2)+'" r="6" fill="'+(r.ok?'#2fb57a':'#e0605a')+'" stroke="#fff" stroke-width="1.3"/><path d="'+(r.ok?'M'+(cx-3)+' '+(y+2)+'l2 2 4-4':'M'+(cx-3)+' '+(y-1)+'l6 6M'+(cx+3)+' '+(y-1)+'l-6 6')+'" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>');
  const d=r.part&&num(r.part.diameter),t2=r.ok?(LABEL[k]||'')+(d!==null&&GROUP[k]==='cutter'?' · Ø'+String(d).replace('.',','):''):r.reason;
  out.push(s.svg+label(y+4+Math.min(20,s.h/2-8),r.part?(r.part.title||r.part.number):'Teil fehlt',t2,!r.ok));
  y+=4+s.h;
 }
 if(!c.complete){y+=10;out.push('<rect x="'+(cx-34)+'" y="'+y+'" width="68" height="40" rx="8" fill="none" stroke="'+SOLID.cutter+'" stroke-width="1.6" stroke-dasharray="5 4"/><text x="'+cx+'" y="'+(y+25)+'" font-size="20" text-anchor="middle" fill="'+SOLID.cutter+'">+</text><text x="170" y="'+(y+16)+'" font-size="12" font-weight="700" fill="'+INK+'">Als Nächstes</text><text x="170" y="'+(y+31)+'" font-size="10.5" fill="'+INK+'" fill-opacity=".8">'+esc(cut(nextHint(c.up),38))+'</text>');y+=40}
 y+=10;
 return '<svg class="tool-stack" viewBox="0 0 '+W+' '+y+'" width="100%" role="img" aria-label="Aufbau des Werkzeugs von der Maschine bis zur Schneide">'+DEFS+out.join('')+joints.join('')+'</svg>';
}
// Kacheln für "Was legst du an?"
const tiles=[
 {k:'endmill',label:'Fräser',kind:'Schaftfräser',group:'cutting'},
 {k:'ball',label:'Kugelfräser',kind:'Kugelfräser',group:'cutting'},
 {k:'lolli',label:'Lollipop',kind:'Lollipopfräser',group:'cutting'},
 {k:'radius',label:'Radiusfräser',kind:'Radiusfräser',group:'cutting'},
 {k:'drill',label:'Bohrer',kind:'Bohrer',group:'cutting'},
 {k:'tap',label:'Gewindebohrer',kind:'Gewindebohrer',group:'cutting'},
 {k:'erchuck',label:'ER-Futter',kind:'Spannzangenfutter',group:'holders'},
 {k:'collet',label:'Spannzange',kind:'Spannzange',group:'holders'},
 {k:'shrink',label:'Schrumpffutter',kind:'Schrumpffutter',group:'holders'},
 {k:'weldon',label:'Weldon',kind:'Weldon',group:'holders'},
 {k:'extension',label:'Verlängerung',kind:'Verlängerung',group:'holders'},
 {k:'insert',label:'Wendeplatte',kind:'Wendeschneidplatte',group:'cutting'},
 {k:'insertholder',label:'Messerkopf',kind:'Messerkopf',group:'cutting'}
];
const api={kind,shape,icon,kindIcon,stack,nextHint,tiles,LABEL};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncToolArt=api;
})(typeof window!=='undefined'?window:globalThis);
