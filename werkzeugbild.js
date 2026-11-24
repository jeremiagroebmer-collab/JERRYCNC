/* CNC OS Werkzeugbilder: Zeichnungen der Teile und des Zusammenbaus (SVG, ohne Fremdbilder). */
(function(root){
'use strict';
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ß/g,'ss');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const INK='var(--ink,#cfe0ee)',COL={holder:'#5f7f9f',collet:'#d4a03a',cutter:'#2fb5a3',insert:'#c9657a',spindle:'#7c8a99',generic:'#8795a3'};
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
const st=(fill,extra='')=>'fill="'+fill+'" fill-opacity=".85" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round" '+extra;
const ln=(x1,y1,x2,y2,o='.6')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+INK+'" stroke-width="1" stroke-opacity="'+o+'"/>';
const poly=(pts,fill)=>'<polygon points="'+pts.map(p=>p.join(',')).join(' ')+'" '+st(fill)+'/>';
const rect=(x,y,w,h,fill,r=2)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" '+st(fill)+'/>';
// Eine Form zeichnen: Mitte cx, Oberkante y, Durchmesser d (nur Schneiden). Gibt {svg,h,w} zurück.
function shape(k,cx,y,d){
 const g=COL[GROUP[k]||'generic'],cw=Math.max(8,Math.min(38,(num(d)||8)*2.4));
 switch(k){
  case 'adapter':return {h:34,w:64,svg:rect(cx-32,y,64,8,g)+poly([[cx-26,y+8],[cx+26,y+8],[cx+14,y+34],[cx-14,y+34]],g)};
  case 'erchuck':return {h:58,w:48,svg:poly([[cx-24,y],[cx+24,y],[cx+14,y+22],[cx-14,y+22]],g)+rect(cx-14,y+22,28,12,g,1)+rect(cx-19,y+34,38,24,g,4)+ln(cx-9,y+38,cx-9,y+54)+ln(cx,y+38,cx,y+54)+ln(cx+9,y+38,cx+9,y+54)};
  case 'shrink':return {h:56,w:44,svg:poly([[cx-22,y],[cx+22,y],[cx+9,y+56],[cx-9,y+56]],g)+ln(cx,y+14,cx,y+56,'.4')};
  case 'hydro':return {h:52,w:40,svg:rect(cx-20,y,40,14,g,3)+poly([[cx-16,y+14],[cx+16,y+14],[cx+10,y+52],[cx-10,y+52]],g)+ln(cx-16,y+22,cx+16,y+22)};
  case 'weldon':return {h:44,w:34,svg:rect(cx-17,y,34,44,g,3)+rect(cx+17,y+16,6,12,g,1)};
  case 'collet':return {h:22,w:28,svg:poly([[cx-13,y],[cx+13,y],[cx+9,y+22],[cx-9,y+22]],g)+ln(cx-5,y+3,cx-4,y+19)+ln(cx,y+3,cx,y+19)+ln(cx+5,y+3,cx+4,y+19)};
  case 'reducer':return {h:26,w:28,svg:poly([[cx-14,y],[cx+14,y],[cx+9,y+26],[cx-9,y+26]],g)};
  case 'extension':return {h:40,w:24,svg:rect(cx-11,y,22,40,g,2)+ln(cx-11,y+7,cx+11,y+7)+ln(cx-11,y+33,cx+11,y+33)};
  case 'insertholder':return {h:46,w:34,svg:rect(cx-16,y,32,32,g,3)+poly([[cx,y+30],[cx+10,y+38],[cx,y+46],[cx-10,y+38]],COL.insert)};
  case 'insert':return {h:22,w:26,svg:poly([[cx,y],[cx+13,y+11],[cx,y+22],[cx-13,y+11]],g)};
  case 'turn':return {h:42,w:38,svg:rect(cx-18,y,36,34,g,2)+poly([[cx-18,y+34],[cx-6,y+34],[cx-18,y+42]],COL.insert)};
  case 'tap':return {h:56,w:cw,svg:rect(cx-5,y,10,22,g,1)+rect(cx-3,y+22,6,8,g,0)+rect(cx-cw/4-2,y+30,cw/2+4,26,g,2)+[0,1,2,3,4].map(i=>ln(cx-cw/4-2,y+34+i*5,cx+cw/4+2,y+36+i*5)).join('')};
  case 'drill':return {h:60,w:cw,svg:rect(cx-6,y,12,22,g,1)+rect(cx-cw/2,y+22,cw,28,g,2)+poly([[cx-cw/2,y+50],[cx+cw/2,y+50],[cx,y+60]],g)+ln(cx-cw/2,y+30,cx+cw/2,y+42)+ln(cx-cw/2,y+38,cx+cw/2,y+50)};
  case 'ball':return {h:58,w:cw,svg:rect(cx-6,y,12,22,g,1)+'<path d="M'+(cx-cw/2)+' '+(y+22)+'H'+(cx+cw/2)+'V'+(y+40)+'A'+(cw/2)+' '+(cw/2)+' 0 0 1 '+(cx-cw/2)+' '+(y+40)+'Z" '+st(g)+'/>'+ln(cx-cw/2,y+28,cx+cw/2,y+38)};
  case 'lolli':return {h:58,w:cw,svg:rect(cx-6,y,12,20,g,1)+rect(cx-2,y+20,4,14,g,0)+'<circle cx="'+cx+'" cy="'+(y+44)+'" r="'+Math.max(8,cw/2.4)+'" '+st(g)+'/>'};
  case 'endmill':case 'radius':return {h:54,w:cw,svg:rect(cx-6,y,12,22,g,1)+rect(cx-cw/2,y+22,cw,32,g,2)+ln(cx-cw/2,y+28,cx+cw/2,y+40)+ln(cx-cw/2,y+36,cx+cw/2,y+48)+ln(cx-cw/2,y+44,cx+cw/2,y+54)};
  default:return {h:36,w:30,svg:rect(cx-14,y,28,36,g,5)};
 }
}
// Einzelnes Teil als kleines Bild (für Karten und Listen).
function icon(t,size=44){const k=kind(t),s=shape(k,30,6,t&&t.diameter);return '<svg class="tool-art" viewBox="0 0 60 70" width="'+size+'" height="'+Math.round(size*70/60)+'" role="img" aria-label="'+esc(LABEL[k]||'Teil')+'">'+s.svg+'</svg>'}
function kindIcon(k,size=64){const s=shape(k,30,6,8);return '<svg class="tool-art" viewBox="0 0 60 70" width="'+size+'" height="'+Math.round(size*70/60)+'" role="img" aria-label="'+esc(LABEL[k]||'Teil')+'">'+s.svg+'</svg>'}
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
 if(!c.complete){y+=10;out.push('<rect x="'+(cx-34)+'" y="'+y+'" width="68" height="40" rx="8" fill="none" stroke="'+COL.cutter+'" stroke-width="1.6" stroke-dasharray="5 4"/><text x="'+cx+'" y="'+(y+25)+'" font-size="20" text-anchor="middle" fill="'+COL.cutter+'">+</text><text x="170" y="'+(y+16)+'" font-size="12" font-weight="700" fill="'+INK+'">Als Nächstes</text><text x="170" y="'+(y+31)+'" font-size="10.5" fill="'+INK+'" fill-opacity=".8">'+esc(cut(nextHint(c.up),38))+'</text>');y+=40}
 y+=10;
 return '<svg class="tool-stack" viewBox="0 0 '+W+' '+y+'" width="100%" role="img" aria-label="Aufbau des Werkzeugs von der Maschine bis zur Schneide">'+out.join('')+joints.join('')+'</svg>';
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
