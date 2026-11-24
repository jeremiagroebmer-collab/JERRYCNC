/* CNC OS Werkzeug 3D: technische Zeichnung mit Maßen, drehbares 3D und STL aus den Maßen (ohne Fremdbibliothek).
   Alle Teile sind Drehkörper: aus Durchmessern und Längen wird ein Profil, daraus Zeichnung, 3D und STL. */
(function(root){
'use strict';
const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(Math.round(n*100)/100).replace('.',',');
const Art=()=>root.CncToolArt||(typeof require==='function'?require('./werkzeugbild.js'):null);
const COL={holder:'#5f7f9f',collet:'#d4a03a',cutter:'#2fb5a3',other:'#8795a3',iface:'#7c8a99',nut:'#7393b3'};
const HIT='#ffb020',INK='var(--ink,#cfe0ee)';
// Normmaße ER-Spannsystem (Richtwerte, echtes Teil nachmessen): Länge Spannzange, Außen-Ø Mutter, Außen-Ø Spannzange
const ER={ER11:{l:18,nut:19,od:11.5},ER16:{l:27.5,nut:28,od:17},ER20:{l:31.5,nut:34,od:21},ER25:{l:34,nut:42,od:26},ER32:{l:40,nut:50,od:33},ER40:{l:46,nut:63,od:41},ER50:{l:60,nut:78,od:52}};
function erOf(s){const m=String(s||'').toUpperCase().match(/ER[- ]?(\d+)/);return m&&ER['ER'+m[1]]?ER['ER'+m[1]]:null}
// Flansch-Durchmesser der Maschinenaufnahme (Richtwerte)
function flangeOf(s){s=String(s||'').toUpperCase();let m=s.match(/HSK[- ]?[A-Z]?(\d+)/);if(m)return Number(m[1]);m=s.match(/(?:SK|BT|ISO)[- ]?(\d+)/);if(m){const n=Number(m[1]);return n<=30?46:n<=40?63:n<=50?100:63}m=s.match(/C(\d)/);if(m&&/CAPTO/.test(s))return ({3:32,4:40,5:50,6:63,8:80})[m[1]]||63;return null}
const HOLD=['erchuck','shrink','hydro','weldon','adapter'],CUT=['endmill','ball','lolli','radius','drill','tap'];
const GROUP=k=>CUT.includes(k)?'cutter':HOLD.includes(k)?'holder':(k==='collet'||k==='reducer')?'collet':'other';
// ---------- Teile als Profil: [[z, r, tag], ...]  z nach unten (Schneide unten), r = Radius, tag = Zone der Strecke vom Vorpunkt zu diesem Punkt
function cutter(t,k){
 const est=[];let D=num(t.diameter),S=num(t.shaftDiameter);if(S===null&&t.inKind==='Zylinderschaft')S=num(t.inSize);
 if(!(D>0)&&!(S>0))return null;
 if(!(D>0)){D=S;est.push('Schneiden-Ø')}if(!(S>0)){S=D;est.push('Schaft-Ø')}
 let l=num(t.cuttingLength);if(!(l>0)){l=D*(k==='drill'?6:k==='ball'?2:2.5);est.push('Schneidenlänge')}
 let L=num(t.totalLength);if(!(L>0)){L=l+Math.max(20,2.5*S);est.push('Gesamtlänge')}
 if(l>L-1)l=Math.max(1,L-1);
 if(k==='lolli'){const r=D/2,R=S/2,nd=num(t.neckDiameter),rn=Math.min(r*0.95,Math.max(0.5,(nd||D*0.5)/2)),ln=num(t.neckLength)||D*3;if(!nd)est.push('Hals-Ø');if(!num(t.neckLength))est.push('Halslänge');const zb=L-r,zt=L-2*r,zn=Math.max(1,zt-ln),a0=Math.asin(rn/r),pts=[[0,R,'shank'],[zn,R,'shank'],[zn,rn,'neck'],[zb-Math.sqrt(Math.max(0,r*r-rn*rn)),rn,'neck']];for(let i=1;i<=12;i++){const al=a0+(Math.PI-a0)*i/12;pts.push([zb-r*Math.cos(al),r*Math.sin(al),'flute'])}return {kind:k,group:'cutter',pts,L,rMax:Math.max(R,r),est,flute:false,teeth:0,D,S,l:2*r,dims:[{key:'shaftDiameter',type:'dia',z:zn*0.5,r:R,text:'Schaft Ø'+fmt(S),hl:{tags:['shank']}},{key:'diameter',type:'dia',z:zb,r:r,text:'Kugel Ø'+fmt(D),hl:{tags:['flute']}},{key:'neckDiameter',type:'dia',z:(zn+zt)/2,r:rn,text:'Hals Ø'+fmt(rn*2),hl:{tags:['neck']}},{key:'neckLength',type:'len',z0:zn,z1:zt,text:'Hals '+fmt(zt-zn),hl:{tags:['neck']}},{key:'totalLength',type:'len',z0:0,z1:L,text:'Länge '+fmt(L),hl:{}}]}}
 const r=D/2,R=S/2,zc=L-l,ch=S>D?Math.min(2,(S-D)/2):0,pts=[[0,R,'shank'],[Math.max(0,zc-ch),R,'shank']];
 pts.push([zc,r,ch>0||S!==D?'neck':'shank']);
 const tip=k==='ball'?r:k==='drill'?r/Math.tan(59*Math.PI/180):k==='tap'?Math.min(l,D*0.6):k==='radius'?Math.min(r,num(t.cornerRadius)||D*0.15):0,zt=Math.max(zc,L-tip);
 if(zt>zc)pts.push([zt,r,'flute']);
 if(k==='ball'){for(let i=1;i<=8;i++){const f=i/8*Math.PI/2;pts.push([zt+r*Math.sin(f),r*Math.cos(f),'flute'])}}
 else if(k==='drill')pts.push([L,0,'flute']);
 else if(k==='tap')pts.push([L,r*0.75,'flute']);
 else if(k==='radius'){const R_=tip;for(let i=1;i<=6;i++){const f=i/6*Math.PI/2;pts.push([zt+R_*Math.sin(f),r-R_+R_*Math.cos(f),'flute'])}pts.push([L,0,'flute'])}
 else pts.push([L,r,'flute']);
 const dims=[
  {key:'shaftDiameter',type:'dia',z:Math.min(zc*0.5,Math.max(4,zc-6)),r:R,text:'Schaft Ø'+fmt(S),hl:{tags:['shank']}},
  {key:'diameter',type:'dia',z:zc+l*0.5,r:r,text:'Schneide Ø'+fmt(D),hl:{tags:['flute']}},
  {key:'cuttingLength',type:'len',z0:zc,z1:L,text:'Schneide '+fmt(l),hl:{tags:['flute']}},
  {key:'totalLength',type:'len',z0:0,z1:L,text:'Länge '+fmt(L),hl:{}}];
 return {kind:k,group:'cutter',pts,L,rMax:Math.max(R,r),dims,est,flute:k!=='tap',teeth:k==='drill'?2:4,D,S,l};
}
function holder(t,k,o){
 const est=[],tl=num(t.totalLength),pr=num(t.projection);
 let L=o.asm?(pr??tl):(tl??pr);if(!(L>0)){L=70;est.push('Länge')}
 const fl=flangeOf(t.interface||t.inSize)||63,rf=fl/2,f=Math.min(14,L*0.3);
 let bore=num(t.minDiameter)||num(t.diameter);const er=k==='erchuck'?erOf(t.outSize):null;
 if(k!=='erchuck'&&k!=='adapter'&&!bore){bore=12;est.push('Aufnahme-Ø')}
 const pts=[[-22,rf*0.55,'iface'],[0,rf*0.72,'iface'],[0,rf,'iface'],[f,rf,'iface']],dims=[];let nutR=0,nutL=0;
 if(k==='erchuck'){nutR=(er?er.nut:50)/2;nutL=Math.max(4,Math.min(er?er.l*0.75:30,L-f-4));const r0=Math.min(rf*0.62,nutR);pts.push([f,r0,'body'],[L-nutL,nutR*0.82,'body'],[L-nutL,nutR,'nut'],[L,nutR,'nut']);if(!er)est.push('ER-Größe')}
 else if(k==='shrink'){const rN=Math.max(bore/2+4.5,bore*0.85),r0=Math.max(rN,rf*0.55);pts.push([f,r0,'body'],[L,rN,'body'])}
 else if(k==='adapter'){pts.push([f,rf*0.5,'body'],[L,rf*0.5,'body'])}
 else{const rB=Math.max(bore/2+8,bore*1.1),r0=Math.max(rB,rf*0.55);pts.push([f,r0,'body'],[Math.min(L,f+(L-f)*0.35),rB,'body'],[L,rB,'body'])}
 dims.push({key:'totalLength',type:'len',z0:0,z1:L,text:'Länge '+fmt(L),hl:{}});
 if(t.interface)dims.push({key:'interface',type:'dia',z:f/2,r:rf,text:String(t.interface),hl:{tags:['iface']}});
 if(bore)dims.push({key:'minDiameter',type:'dia',z:L,r:bore/2,text:'Aufnahme Ø'+fmt(bore),hl:{tags:['body','nut'],bore:true}});
 if(er||nutR)dims.push({key:'outSize',type:'dia',z:L-nutL/2,r:nutR,text:'Spannzange '+(t.outSize||'ER'),hl:{tags:['nut']}});
 const bd=bore?Math.max(8,Math.min(L-f-2,er?er.l*0.9:bore*3)):0;
 return {kind:k,group:'holder',pts,L,rMax:Math.max(rf,nutR),dims,est,bore:bore?{r:bore/2,depth:bd}:null};
}
function collet(t,k){
 const est=[],er=erOf(t.interface||t.system);let L=num(t.totalLength);if(!(L>0)){L=er?er.l:30;est.push('Länge')}
 const maxD=num(t.maxDiameter)||num(t.minDiameter)||8,minD=num(t.minDiameter)||maxD,od=er?er.od:Math.max(maxD+8,num(t.shaftDiameter)||0);
 const rn=Math.min(od/2,maxD/2+3);
 const pts=[[0,od/2*0.92,'collet'],[L*0.2,od/2,'collet'],[L*0.8,od/2,'collet'],[L,rn,'collet']];
 const dims=[{key:'totalLength',type:'len',z0:0,z1:L,text:'Länge '+fmt(L),hl:{}},{key:'minDiameter',type:'dia',z:L*0.5,r:od/2,text:'Spannbereich Ø'+fmt(minD)+(maxD!==minD?'–'+fmt(maxD):''),hl:{tags:['collet']}}];
 if(t.interface)dims.push({key:'interface',type:'dia',z:L*0.2,r:od/2,text:String(t.interface),hl:{tags:['collet']}});
 return {kind:k,group:'collet',pts,L,rMax:od/2,dims,est};
}
function simple(t,k){
 const est=[];let D=num(t.diameter)||num(t.shaftDiameter)||num(t.minDiameter),L=num(t.totalLength)??num(t.projection);
 if(!(D>0)){D=16;est.push('Durchmesser')}if(!(L>0)){L=40;est.push('Länge')}
 return {kind:k,group:'other',pts:[[0,D/2,'body'],[L,D/2,'body']],L,rMax:D/2,dims:[{key:'totalLength',type:'len',z0:0,z1:L,text:'Länge '+fmt(L),hl:{}},{key:'diameter',type:'dia',z:L/2,r:D/2,text:'Ø'+fmt(D),hl:{tags:['body']}}],est,simpleShape:true};
}
function buildPart(t,o={}){const A=Art(),k=A?A.kind(t):'generic';if(CUT.includes(k))return cutter(t,k);if(HOLD.includes(k))return holder(t,k,o);if(k==='collet'||k==='reducer')return collet(t,k);return simple(t,k)}
const shift=(p,dz,id,t,drop)=>({...p,id,title:t?.title||t?.number||'',pts:p.pts.map(q=>[q[0]+dz,q[1],q[2]]),z0:p.pts[0][0]+dz,z1:p.pts[p.pts.length-1][0]+dz,dims:p.dims.filter(d=>!(drop||[]).includes(d.key)).map(d=>({...d,part:id,z:d.z===undefined?undefined:d.z+dz,z0:d.z0===undefined?undefined:d.z0+dz,z1:d.z1===undefined?undefined:d.z1+dz,hl:{...d.hl,part:id}})),dz});
function finish(m){
 const all=m.parts.flatMap(p=>p.pts);
 m.zMin=Math.min(...all.map(p=>p[0]));m.zMax=Math.max(...all.map(p=>p[0]));m.rMax=Math.max(...m.parts.map(p=>p.rMax));
 m.dims=m.parts.flatMap(p=>p.dims).concat(m.extraDims||[]);m.est=[...new Set(m.parts.flatMap(p=>p.est||[]).concat(m.est||[]))];return m;
}
// Einzelnes Teil
function single(t){
 const p=buildPart(t,{});if(!p)return null;const m={parts:[shift(p,0,'p0',t)],warn:[],est:[],single:true,tool:t,title:t?.title||''};return finish(m);
}
// Zusammenbau: Messebene z=0, Schneide unten. Auspannlänge = wie weit das Werkzeug aus der Spannzange / dem Futter steht.
function assembly(db,a,Tooling,opts={}){
 const c=Tooling.chain(db,a),rows=c.rows.filter(r=>r.part);if(!rows.length)return null;
 const m={parts:[],warn:[],est:[],extraDims:[],title:a.title||''};let zNose=0,holderNose=null,carrierNose=0,first=true;const so=num(opts.stickout!==undefined?opts.stickout:a.stickout);
 rows.forEach((r,i)=>{
  const t=r.part,A=Art(),k=A?A.kind(t):'generic',id='p'+i,g=GROUP(k);
  if(g==='holder'&&first){const p=buildPart(t,{asm:true});if(!p)return;m.parts.push(shift(p,0,id,t,['totalLength']));zNose=p.L;holderNose=p.L;carrierNose=p.L;first=false;return}
  first=false;
  if(g==='collet'){const p=buildPart(t,{});if(!p)return;let pc=num(t.projection);if(pc===null){pc=2;m.est.push('Spannzange ragt ca. 2 mm heraus')}const x=shift(p,zNose+pc-p.L,id,t,['totalLength','interface','minDiameter']);x.hiddenTo=holderNose??zNose;m.parts.push(x);zNose+=pc;carrierNose=zNose;return}
  if(g==='cutter'){
   const p=buildPart(t,{});if(!p)return;let A_=so;const pr=num(t.projection);
   if(A_===null)A_=pr;if(A_===null){A_=Math.min(p.L-Math.min(p.L*0.4,2.5*p.S),p.l*1.2+p.S);if(!(A_>0))A_=p.L*0.6;m.est.push('Auspannlänge geschätzt')}
   if(A_>p.L){m.warn.push('Auspannlänge ist größer als die Werkzeuglänge ('+fmt(p.L)+' mm).');A_=p.L}
   const x=shift(p,zNose+A_-p.L,id,t,['totalLength']);x.hiddenTo=carrierNose;m.parts.push(x);
   const ins=p.L-A_,tip=zNose+A_;m.A=A_;m.I=ins;m.tipZ=tip;m.noseZ=zNose;m.cut=p;
   m.extraDims.push({key:'stickout',type:'len',z0:zNose,z1:tip,text:'Auspannlänge '+fmt(A_),part:id,hl:{part:id,fromZ:zNose}},{key:'insert',type:'len',z0:tip-p.L,z1:zNose,text:'Eingespannt '+fmt(ins),part:id,hl:{tags:['shank'],part:id,toZ:zNose}});
   if(ins<2.5*p.S)m.warn.push('Nur '+fmt(ins)+' mm eingespannt = '+fmt(ins/p.S)+' × Schaft-Ø. Besser mindestens 2,5 × Ø einspannen.');
   if(A_<p.l)m.warn.push('Auspannlänge '+fmt(A_)+' mm ist kleiner als die Schneidenlänge '+fmt(p.l)+' mm: die Schneide steckt noch im Futter.');
   if(A_/p.D>4)m.warn.push('Lange Auskragung ('+fmt(A_/p.D)+' × Ø). Schnittwerte senken oder kürzer ausspannen.');
   return;
  }
  const p=buildPart(t,{});if(!p)return;let pe=num(t.projection);if(pe===null){pe=p.L*0.8;m.est.push('Überstand geschätzt')}
  const x=shift(p,zNose+pe-p.L,id,t,['totalLength']);x.hiddenTo=carrierNose;m.parts.push(x);zNose+=pe;carrierNose=zNose;
 });
 if(!m.parts.length)return null;
 if(holderNose!==null)m.extraDims.push({key:'holderLength',type:'len',z0:0,z1:holderNose,text:'Futter '+fmt(holderNose),part:'p0',hl:{part:'p0'}});
 if(m.tipZ!==undefined)m.extraDims.push({key:'assemblyLength',type:'len',z0:0,z1:m.tipZ,text:'Gesamt '+fmt(m.tipZ),hl:{}});
 m.total=m.tipZ;m.chain=c;
 return finish(m);
}
// ---------- Außenkontur (Vereinigung aller Teile). Teile im Futter verschwinden.
function seg(pts,z){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(b[0]-a[0]>1e-6&&z>=a[0]&&z<=b[0])return {a,b}}return null}
const lerp=(a,b,z)=>a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0]);
function union(m){
 const zs=[...new Set(m.parts.flatMap(p=>p.pts.map(q=>Math.round(q[0]*1e4)/1e4)))].sort((x,y)=>x-y),bands=[];
 for(let i=0;i<zs.length-1;i++){
  const za=zs[i],zb=zs[i+1],zm=(za+zb)/2;let best=null;
  for(const p of m.parts){const s=seg(p.pts,zm);if(!s)continue;const r=lerp(s.a,s.b,zm);if(!best||r>best.r)best={p,s,r}}
  if(best)bands.push({z0:za,r0:lerp(best.s.a,best.s.b,za),z1:zb,r1:lerp(best.s.a,best.s.b,zb),tag:best.s.b[2],part:best.p});
 }
 const out=[];if(!bands.length)return out;
 out.push({z0:bands[0].z0,r0:0,z1:bands[0].z0,r1:bands[0].r0,tag:bands[0].tag,part:bands[0].part});
 bands.forEach((b,i)=>{if(i){const p=bands[i-1];if(Math.abs(p.r1-b.r0)>1e-6)out.push({z0:p.z1,r0:p.r1,z1:b.z0,r1:b.r0,tag:p.r1>b.r0?p.tag:b.tag,part:p.r1>b.r0?p.part:b.part})}out.push(b)});
 const l=bands[bands.length-1];out.push({z0:l.z1,r0:l.r1,z1:l.z1,r1:0,tag:l.tag,part:l.part});
 return out;
}
const hit=(hl,band)=>!!hl&&(!hl.part||band.part.id===hl.part)&&(!hl.tags||hl.tags.includes(band.tag))&&(hl.fromZ===undefined||band.z0>=hl.fromZ-1e-6)&&(hl.toZ===undefined||band.z1<=hl.toZ+1e-6);
// ---------- Netz (Vierecke) aus der Außenkontur
function mesh(m,N=40){
 const quads=[],bands=union(m);
 for(const b of bands){
  const fl=b.part.flute&&b.tag==='flute',len=Math.abs(b.z1-b.z0),n=fl?Math.max(1,Math.min(60,Math.ceil(len/Math.max(0.6,b.part.D*0.12)))):1;
  for(let s=0;s<n;s++){
   const f0=s/n,f1=(s+1)/n,za=b.z0+(b.z1-b.z0)*f0,zb=b.z0+(b.z1-b.z0)*f1,ra=b.r0+(b.r1-b.r0)*f0,rb=b.r0+(b.r1-b.r0)*f1;
   for(let i=0;i<N;i++){
    const t0=i/N*2*Math.PI,t1=(i+1)/N*2*Math.PI,P=(r,th,z)=>{let rr=r;if(fl&&r>0.01){const ph=b.part.teeth*(th-(z-b.part.z0)*0.55/Math.max(r,0.5));const g=Math.pow(0.5+0.5*Math.cos(ph),2);rr=r*(1-0.2*(1-g))}return [rr*Math.cos(th),rr*Math.sin(th),z]};
    quads.push({v:[P(ra,t0,za),P(ra,t1,za),P(rb,t1,zb),P(rb,t0,zb)],band:b});
   }
  }
 }
 return quads;
}
// ---------- STL (binär, mm). Außenkontur als geschlossenes Netz, kein bearbeitbares Volumenmodell.
function stl(m,N=64){
 const q=mesh(m,N),tris=[];
 const cr=(P,Q,R)=>{const u=[Q[0]-P[0],Q[1]-P[1],Q[2]-P[2]],v=[R[0]-P[0],R[1]-P[1],R[2]-P[2]];return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])};
 for(const k of q){const [A,B,C,D]=k.v;if(cr(A,B,C)>1e-9)tris.push([A,B,C]);if(cr(A,C,D)>1e-9)tris.push([A,C,D])}
 const buf=new ArrayBuffer(84+tris.length*50),dv=new DataView(buf),head='CNC OS Werkzeug STL mm';for(let i=0;i<head.length;i++)dv.setUint8(i,head.charCodeAt(i));dv.setUint32(80,tris.length,true);
 tris.forEach((t,i)=>{const o=84+i*50,u=[t[1][0]-t[0][0],t[1][1]-t[0][1],t[1][2]-t[0][2]],v=[t[2][0]-t[0][0],t[2][1]-t[0][1],t[2][2]-t[0][2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);[...n,...t[0],...t[1],...t[2]].forEach((x,j)=>dv.setFloat32(o+j*4,x,true));dv.setUint16(o+48,0,true)});
 return {bytes:new Uint8Array(buf),triangles:tris.length};
}
// ---------- Technische Zeichnung (SVG)
let uid=0;
const KEYS=['shaftDiameter','diameter','cuttingLength','totalLength','stickout','insert','holderLength','assemblyLength','minDiameter','interface','outSize'];
const CSS='<style>.t3d .dim{cursor:pointer}.t3d .dim line,.t3d .dim path{stroke:'+INK+';stroke-width:1;opacity:.8;fill:none}.t3d .dim text{fill:'+INK+';font-size:11.5px}.t3d .hl{display:none;pointer-events:none}.t3d[data-on] .dim{opacity:.38}.t3d[data-on] .dim.on{opacity:1}.t3d .dim.on line,.t3d .dim.on path{stroke:'+HIT+';stroke-width:2.4;opacity:1}.t3d .dim.on text{fill:'+HIT+';font-weight:700}.t3d .hl.on{display:inline}</style>';
function regions(part,hl){
 const out=[];if(!hl)return out;const pts=part.pts;
 if(hl.part&&hl.part!==part.id)return out;
 if(!hl.tags){out.push(pts);return out}
 let run=null;pts.forEach((p,i)=>{if(i>0&&hl.tags.includes(p[2])){if(!run)run=[pts[i-1]];run.push(p)}else if(run){out.push(run);run=null}});if(run)out.push(run);return out;
}
function drawing(m,o={}){
 if(!m)return '';const W=340,Hm=o.h||(m.parts.length>1?390:330),id=++uid;
 const lens=m.dims.filter(d=>d.type==='len'),lanes=[];
 for(const d of lens){const lo=Math.min(d.z0,d.z1),hi=Math.max(d.z0,d.z1);let i=lanes.findIndex(l=>l.every(e=>hi<=e.lo+0.5||lo>=e.hi-0.5));if(i<0){i=lanes.length;lanes.push([])}lanes[i].push({lo,hi});d.lane=i}
 const dl=m.dims.filter(d=>d.type==='dia'),rw=Math.max(60,...dl.map(d=>d.text.length*5.6+16)),nl=Math.max(1,lanes.length),ml=14+nl*19,zr=Math.max(1,m.zMax-m.zMin);
 const s=Math.min((Hm-36)/zr,(W-ml-rw-26)/(2*m.rMax),9),cx=ml+m.rMax*s+6,Y=z=>18+(z-m.zMin)*s,H=Math.round(Y(m.zMax)+18);
 const X=(r)=>cx+r*s,poly=(pts)=>pts.map(p=>X(p[1]).toFixed(1)+','+Y(p[0]).toFixed(1)).join(' ')+' '+pts.slice().reverse().map(p=>X(-p[1]).toFixed(1)+','+Y(p[0]).toFixed(1)).join(' ');
 const order={cutter:0,collet:1,other:2,holder:3},parts=m.parts.slice().sort((a,b)=>order[a.group]-order[b.group]),out=[];
 out.push('<line x1="'+cx+'" y1="10" x2="'+cx+'" y2="'+(H-8)+'" stroke="'+INK+'" stroke-opacity=".35" stroke-dasharray="10 3 2 3"/>');
 for(const p of parts)out.push('<polygon points="'+poly(p.pts)+'" fill="'+COL[p.group]+'" fill-opacity="'+(p.group==='cutter'?'.9':'1')+'" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round"/>');
 for(const p of parts){
  if(p.flute){const n=Math.max(2,Math.min(12,Math.round(p.l/(p.D*0.8))));for(let i=0;i<n;i++){const f=(i+0.5)/n,z0=p.z1-p.l+p.l*f-p.l/n*0.5,z1=z0+p.l/n*0.9;out.push('<line x1="'+X(-p.D/2).toFixed(1)+'" y1="'+Y(z0).toFixed(1)+'" x2="'+X(p.D/2).toFixed(1)+'" y2="'+Y(Math.min(z1,p.z1-0.5)).toFixed(1)+'" stroke="'+INK+'" stroke-opacity=".45" stroke-width="1"/>')}}
  if(p.hiddenTo!==undefined){const cid='c'+id+p.id;out.push('<clipPath id="'+cid+'"><rect x="0" y="0" width="'+W+'" height="'+Y(p.hiddenTo).toFixed(1)+'"/></clipPath><polygon points="'+poly(p.pts)+'" fill="none" stroke="'+INK+'" stroke-width="1.1" stroke-dasharray="4 3" stroke-opacity=".9" clip-path="url(#'+cid+')"/>')}
  if(m.single&&p.bore){const b=p.bore,z1=p.z1,z0=z1-b.depth;out.push('<path d="M'+X(-b.r).toFixed(1)+' '+Y(z1).toFixed(1)+'V'+Y(z0).toFixed(1)+'H'+X(b.r).toFixed(1)+'V'+Y(z1).toFixed(1)+'" fill="none" stroke="'+INK+'" stroke-dasharray="4 3" stroke-opacity=".8"/>')}
 }
 // Leuchtflächen
 for(const d of m.dims){const rs=[];for(const p of m.parts)for(const r of regions(p,d.hl))rs.push('<polygon points="'+poly(r)+'" fill="'+HIT+'" fill-opacity=".62" stroke="'+HIT+'" stroke-width="1.6"/>');
  if(d.hl&&d.hl.bore)for(const p of m.parts)if(p.bore&&(!d.hl.part||d.hl.part===p.id)){const b=p.bore;rs.push('<rect x="'+X(-b.r).toFixed(1)+'" y="'+Y(p.z1-b.depth).toFixed(1)+'" width="'+(2*b.r*s).toFixed(1)+'" height="'+(b.depth*s).toFixed(1)+'" fill="'+HIT+'" fill-opacity=".7"/>')}
  if(rs.length){let clip='';if(d.hl&&(d.hl.fromZ!==undefined||d.hl.toZ!==undefined)){const y0=d.hl.fromZ!==undefined?Y(d.hl.fromZ):0,y1=d.hl.toZ!==undefined?Y(d.hl.toZ):H,cid='h'+id+d.key;clip='<clipPath id="'+cid+'"><rect x="0" y="'+y0.toFixed(1)+'" width="'+W+'" height="'+Math.max(0,y1-y0).toFixed(1)+'"/></clipPath>';out.push(clip+'<g class="hl" data-dim="'+d.key+'" clip-path="url(#'+cid+')">'+rs.join('')+'</g>')}else out.push('<g class="hl" data-dim="'+d.key+'">'+rs.join('')+'</g>')}}
 // Maße: Längen links
 const bands=union(m),outerR=z=>{for(const b of bands)if(b.z1-b.z0>1e-6&&z>=b.z0-1e-6&&z<=b.z1+1e-6)return b.r0+(b.r1-b.r0)*(z-b.z0)/(b.z1-b.z0);return 0};
 for(const d of m.dims){
  if(d.type==='len'){const x=cx-m.rMax*s-12-d.lane*19,ya=Y(d.z0),yb=Y(d.z1),ym=(ya+yb)/2;
   const ext=z=>'<line x1="'+(x-3).toFixed(1)+'" y1="'+Y(z).toFixed(1)+'" x2="'+(X(-outerR(z))-3).toFixed(1)+'" y2="'+Y(z).toFixed(1)+'" stroke-dasharray="2 2"/>';
   out.push('<g class="dim" data-dim="'+d.key+'">'+ext(d.z0)+ext(d.z1)+'<line x1="'+x.toFixed(1)+'" y1="'+ya.toFixed(1)+'" x2="'+x.toFixed(1)+'" y2="'+yb.toFixed(1)+'"/><path d="M'+(x-3).toFixed(1)+' '+(ya+5).toFixed(1)+'L'+x.toFixed(1)+' '+ya.toFixed(1)+'L'+(x+3).toFixed(1)+' '+(ya+5).toFixed(1)+'M'+(x-3).toFixed(1)+' '+(yb-5).toFixed(1)+'L'+x.toFixed(1)+' '+yb.toFixed(1)+'L'+(x+3).toFixed(1)+' '+(yb-5).toFixed(1)+'"/><text transform="translate('+(x-5).toFixed(1)+','+ym.toFixed(1)+') rotate(-90)" text-anchor="middle">'+esc(d.text)+'</text><rect x="'+(x-16).toFixed(1)+'" y="'+Math.min(ya,yb).toFixed(1)+'" width="22" height="'+Math.abs(yb-ya).toFixed(1)+'" fill="transparent" stroke="none"/></g>')}
 }
 // Durchmesser rechts mit Führungslinie, Beschriftung untereinander
 const dias=m.dims.filter(d=>d.type==='dia').sort((a,b)=>a.z-b.z),xr=cx+m.rMax*s+12;let last=-99;
 for(const d of dias){let ly=Y(d.z);if(ly<last+15)ly=last+15;last=ly;const ex=X(d.r);
  out.push('<g class="dim" data-dim="'+d.key+'"><path d="M'+ex.toFixed(1)+' '+Y(d.z).toFixed(1)+'L'+(xr-3).toFixed(1)+' '+ly.toFixed(1)+'"/><circle cx="'+ex.toFixed(1)+'" cy="'+Y(d.z).toFixed(1)+'" r="2.3" fill="'+INK+'" stroke="none"/><text x="'+xr+'" y="'+(ly+3.5).toFixed(1)+'">'+esc(d.text)+'</text><rect x="'+(xr-4)+'" y="'+(ly-9).toFixed(1)+'" width="'+(W-xr+2)+'" height="16" fill="transparent" stroke="none"/></g>')}
 return '<svg class="t3d" viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Technische Zeichnung mit Maßen" style="max-height:'+H+'px">'+CSS+out.join('')+'</svg>';
}
function highlight(svg,key){
 if(!svg||!svg.querySelectorAll)return;svg.querySelectorAll('.on').forEach(n=>n.classList.remove('on'));
 if(!key){svg.removeAttribute('data-on');return}
 const hit=svg.querySelectorAll('[data-dim="'+key+'"]');if(!hit.length){svg.removeAttribute('data-on');return}
 svg.setAttribute('data-on',key);hit.forEach(n=>n.classList.add('on'));
}
// ---------- 3D-Ansicht auf Canvas (Drehen mit dem Finger, zwei Finger zoomen)
function hex(c){const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function bandColor(b){return b.tag==='iface'?COL.iface:b.tag==='nut'?COL.nut:COL[b.part.group]||COL.other}
function view3d(canvas,getModel){
 const st={yaw:0.6,pitch:0.42,zoom:1,focus:'all',spin:false,hl:null};let quads=[],m=null,raf=0,spinTimer=0;
 function set(){m=getModel();quads=m?mesh(m,36):[]}
 function draw(){
  const ratio=Math.min(2,root.devicePixelRatio||1),W=canvas.clientWidth||320,H=canvas.clientHeight||300;if(canvas.width!==Math.round(W*ratio)){canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio)}
  const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,W,H);if(!m)return;
  let zc=(m.zMin+m.zMax)/2,R=Math.hypot(m.zMax-m.zMin,2*m.rMax)/2;
  if(st.focus==='tip'&&m.tipZ!==undefined){R=Math.max(34,(m.cut?m.cut.D:10)*3.2);zc=m.tipZ-R*0.55}
  const sc=0.46*Math.min(W,H)/R*st.zoom,cy=Math.cos(st.pitch),sy=Math.sin(st.pitch),cyw=Math.cos(st.yaw),syw=Math.sin(st.yaw),L=[-0.3,-0.5,-0.8],ll=Math.hypot(...L),list=[];
  for(const q of quads){
   const p=q.v.map(v=>{const x1=v[0]*cyw-v[1]*syw,y1=v[0]*syw+v[1]*cyw,z=v[2]-zc;return [x1,z*cy+y1*sy,y1*cy-z*sy]});
   const [A,B,C,D]=p,area=(A[0]*B[1]-B[0]*A[1])+(B[0]*C[1]-C[0]*B[1])+(C[0]*D[1]-D[0]*C[1])+(D[0]*A[1]-A[0]*D[1]);if(area<=1e-7)continue;
   const u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],v=[D[0]-A[0],D[1]-A[1],D[2]-A[2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const nl=Math.hypot(...n)||1;n=n.map(x=>x/nl);if(n[2]>0)n=n.map(x=>-x);
   const lit=Math.max(0,(n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/ll),on=st.hl&&hit(st.hl,q.band);
   list.push({p,d:(A[2]+B[2]+C[2]+D[2])/4,b:0.38+0.62*lit,col:on?hex(HIT):hex(bandColor(q.band))});
  }
  list.sort((a,b)=>b.d-a.d);
  for(const f of list){const col='rgb('+f.col.map(x=>Math.round(Math.min(255,x*f.b))).join(',')+')';c.beginPath();f.p.forEach((v,i)=>{const X=W/2+v[0]*sc,Y=H/2+v[1]*sc;i?c.lineTo(X,Y):c.moveTo(X,Y)});c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=col;c.lineWidth=0.6;c.stroke()}
 }
 const frame=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw()})};
 let ptrs=new Map(),pinch=0;
 canvas.style.touchAction='none';
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);pinch=0});
 canvas.addEventListener('pointermove',e=>{const o=ptrs.get(e.pointerId);if(!o)return;
  if(ptrs.size===1){st.yaw+=(e.clientX-o[0])*0.011;st.pitch=Math.max(-1.45,Math.min(1.45,st.pitch+(e.clientY-o[1])*0.009));ptrs.set(e.pointerId,[e.clientX,e.clientY]);frame()}
  else if(ptrs.size===2){ptrs.set(e.pointerId,[e.clientX,e.clientY]);const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)st.zoom=Math.max(0.5,Math.min(8,st.zoom*d/pinch));pinch=d;frame()}});
 const up=e=>{ptrs.delete(e.pointerId);pinch=0};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();st.zoom=Math.max(0.5,Math.min(8,st.zoom*(e.deltaY<0?1.12:0.9)));frame()},{passive:false});
 return {st,set:()=>{set();frame()},draw:frame,setHl:h=>{st.hl=h;frame()},zoom:f=>{st.zoom=Math.max(0.5,Math.min(8,st.zoom*f));frame()},focus:f=>{st.focus=f;st.zoom=1;frame()},spin:on=>{st.spin=on;clearInterval(spinTimer);if(on)spinTimer=setInterval(()=>{if(!canvas.isConnected){clearInterval(spinTimer);return}st.yaw+=0.03;frame()},40)},reset:()=>{st.yaw=0.6;st.pitch=0.42;st.zoom=1;st.focus='all';frame()}};
}
// ---------- Bedienfeld (Zeichnung / 3D umschalten, Maße antippen)
const chipText={shaftDiameter:'Schaft Ø',diameter:'Schneiden Ø',cuttingLength:'Schneidenlänge',totalLength:'Länge',stickout:'Auspannlänge',insert:'Eingespannt',holderLength:'Futterlänge',assemblyLength:'Gesamtlänge',minDiameter:'Aufnahme / Spannbereich',interface:'Anschluss',outSize:'Spannzange'};
function panelHtml(o={}){
 return '<div class="t3d-panel'+(o.sticky?' sticky':'')+'" data-t3d="1"'+(o.asm?' data-t3d-asm="'+esc(o.asm)+'"':'')+(o.tool?' data-t3d-tool="'+esc(o.tool)+'"':'')+'><div class="t3d-tabs">'+(o.single?'<button type="button" data-t3d-tab="sketch" class="on">Skizze</button><button type="button" data-t3d-tab="draw">Maßstab</button>':'<button type="button" data-t3d-tab="draw" class="on">Zeichnung</button>')+'<button type="button" data-t3d-tab="3d">3D</button></div><div class="t3d-view"></div><div class="t3d-tools" hidden><button type="button" class="secondary" data-t3d-act="all">Ganz</button><button type="button" class="secondary" data-t3d-act="tip">Schneide</button><button type="button" class="secondary" data-t3d-act="spin">Drehen</button><button type="button" class="secondary" data-t3d-act="stl">STL laden</button></div><div class="t3d-chips"></div><p class="t3d-note muted small"></p></div>';
}
function download(name,bytes){const url=URL.createObjectURL(new Blob([bytes],{type:'model/stl'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
// el = Element aus panelHtml, getModel = () => Modell oder null, o.name = Dateiname, o.focusField = Feld mit Fokus -> Maß leuchtet
function mount(el,getModel,o={}){
 const view=el.querySelector('.t3d-view'),tools=el.querySelector('.t3d-tools'),chips=el.querySelector('.t3d-chips'),note=el.querySelector('.t3d-note');
 let tab=o.tab||(el.querySelector('[data-t3d-tab="sketch"]')?'sketch':'draw'),key=null,v3=null,m=null;
 function setKey(k){key=k===key?null:k;paint()}
 function paint(){
  m=getModel();
  const sk=m&&m.single&&root.CncSketch?root.CncSketch.draw(m.tool,m.parts[0].kind):null,skb=el.querySelector('[data-t3d-tab="sketch"]');if(skb)skb.hidden=!sk;const cur=tab==='sketch'&&!sk?'draw':tab;
  el.querySelectorAll('[data-t3d-tab]').forEach(b=>b.classList.toggle('on',b.dataset.t3dTab===cur));
  if(!m){view.innerHTML='<p class="muted small">Wähle zuerst die Art. Dann erscheint hier die Zeichnung.</p>';tools.hidden=true;chips.innerHTML='';note.textContent='';v3=null;return}
  tools.hidden=cur!=='3d';
  if(cur==='sketch'){v3=null;view.innerHTML=sk.svg;highlight(view.querySelector('svg'),key)}
  else if(cur==='draw'){v3=null;view.innerHTML=drawing(m,{h:o.h});const svg=view.querySelector('svg');highlight(svg,key)}
  else{let cv=view.querySelector('canvas');if(!cv){view.innerHTML='<canvas style="width:100%;height:300px;display:block"></canvas>';cv=view.querySelector('canvas');v3=view3d(cv,()=>m)}v3.set();const d=m.dims.find(x=>x.key===key);v3.setHl(d?d.hl:null)}
  const seen=new Set(),list=m.dims.filter(d=>!seen.has(d.key)&&seen.add(d.key));
  if(cur==='sketch')chips.innerHTML=root.CncSketch.legend(sk.rows,key);else chips.innerHTML=list.map(d=>'<button type="button" class="chip'+(d.key===key?' on':'')+'" data-t3d-key="'+esc(d.key)+'">'+esc(chipText[d.key]||d.key)+'</button>').join('');
  const bits=[];if(m.est&&m.est.length)bits.push('Geschätzt, bitte ergänzen: '+m.est.join(', ')+'.');(m.warn||[]).forEach(w=>bits.push(w));note.textContent=bits.join(' ');
  note.className='t3d-note small '+((m.warn||[]).length?'warn':'muted');
 }
 el.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-dim]');if(!b||!el.contains(b))return;
  if(b.dataset.t3dTab){tab=b.dataset.t3dTab;paint();return}
  if(b.dataset.t3dKey){setKey(b.dataset.t3dKey);return}
  if(b.dataset.t3dAct){const a=b.dataset.t3dAct;if(a==='stl'){if(m){const r=stl(m);download((o.name||'werkzeug')+'.stl',r.bytes)}return}if(!v3)return;if(a==='spin'){const on=!v3.st.spin;v3.spin(on);b.classList.toggle('on',on)}else v3.focus(a);return}
  const g=e.target.closest('.dim');if(g&&g.dataset.dim){setKey(g.dataset.dim);if(o.onKey)o.onKey(g.dataset.dim)}
 });
 el._refresh=paint;el._setKey=k=>{key=k;paint()};paint();return el;
}
// Bei Bedienfeldern auf der Baugruppen-Seite: alle auf der Seite suchen
function mountAll(ctx){
 document.querySelectorAll('[data-t3d-tool]').forEach(el=>{if(el._mounted)return;el._mounted=true;const t=ctx.db.tools.find(x=>x.id===el.dataset.t3dTool);if(!t)return;mount(el,()=>single(t),{name:t.number||'werkzeug'})});
 document.querySelectorAll('[data-t3d-asm]').forEach(el=>{if(el._mounted)return;el._mounted=true;const a=ctx.db.toolassemblies.find(x=>x.id===el.dataset.t3dAsm);if(!a)return;mount(el,()=>assembly(ctx.db,a,ctx.Tooling),{name:(a.number||'baugruppe')+'-werkzeug'})});
}
const api={buildPart,single,assembly,union,mesh,stl,drawing,highlight,view3d,panelHtml,mount,mountAll,erOf,flangeOf,ER,KEYS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncTool3D=api;
})(typeof window!=='undefined'?window:globalThis);
