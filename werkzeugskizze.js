/* CNC OS Werkzeugskizze: Katalog-Skizze nach Art der Normzeichnungen mit Kürzeln (d1, d2, l1 ...).
   Nicht maßstäblich. Die Maße stehen in der Legende. Tippst du ein Feld oder ein Kürzel an, leuchtet die Stelle auf. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const fmt=n=>String(Math.round(n*100)/100).replace('.',',');
const INK='#1f2a37',HIT='#f59e0b',W=392,SH=46;
const TINT={cutter:'url(#sk-c)',holder:'url(#sk-h)',collet:'url(#sk-g)',insert:'url(#sk-i)',spindle:'url(#sk-s)'};
const grad=(id,a,b,c,d)=>'<linearGradient id="sk-'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset=".28" stop-color="'+b+'"/><stop offset=".6" stop-color="'+c+'"/><stop offset="1" stop-color="'+d+'"/></linearGradient>';
const DEFS='<defs>'+grad('c','#2a8a80','#a9ece1','#46bfae','#1d6e65')+grad('h','#5c7894','#cfdeed','#86a0bc','#475f78')+grad('g','#a8791f','#f6dc9a','#dcab44','#8e671a')+grad('i','#9a4558','#f0a3b5','#b85a72','#7a3346')+grad('s','#7a8795','#eef1f4','#b2bbc5','#697684')+'</defs>';
const CSS='<style>.t3d .dim{cursor:pointer}.t3d .dim line,.t3d .dim path{stroke:'+INK+';stroke-width:1;opacity:.85;fill:none}.t3d .dim polygon{fill:'+INK+';stroke:none}.t3d .dim text{fill:'+INK+';font-size:14.5px;font-weight:700}.t3d .dim .tg{font-weight:600;font-size:12px}.t3d .hl{display:none;pointer-events:none}.t3d[data-on] .dim{opacity:.4}.t3d[data-on] .dim.on{opacity:1}.t3d .dim.on line,.t3d .dim.on path{stroke:'+HIT+';stroke-width:2.2;opacity:1}.t3d .dim.on polygon{fill:'+HIT+'}.t3d .dim.on text{fill:'+HIT+'}.t3d .hl.on{display:inline}</style>';
function kit(){
 const o={out:[],dims:[],hl:{}};
 const reg=(keys,el)=>(keys||[]).forEach(k=>(o.hl[k]=o.hl[k]||[]).push(el));
 const ptsStr=p=>p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
 o.poly=(p,tint,keys)=>{o.out.push('<polygon points="'+ptsStr(p)+'" fill="'+tint+'" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round"/>');reg(keys,'<polygon points="'+ptsStr(p)+'" fill="'+HIT+'" fill-opacity=".55" stroke="'+HIT+'" stroke-width="1.6"/>')};
 o.path=(d,tint,keys)=>{o.out.push('<path d="'+d+'" fill="'+tint+'" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round"/>');reg(keys,'<path d="'+d+'" fill="'+HIT+'" fill-opacity=".55" stroke="'+HIT+'" stroke-width="1.6"/>')};
 o.circ=(cx,cy,r,tint,keys,dash)=>{o.out.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+tint+'" stroke="'+INK+'" stroke-width="1.3"'+(dash?' stroke-dasharray="4 3"':'')+'/>');reg(keys,'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+HIT+'" fill-opacity=".55" stroke="'+HIT+'" stroke-width="1.6"/>')};
 o.line=(x1,y1,x2,y2,op,dash)=>o.out.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+INK+'" stroke-width="1" stroke-opacity="'+(op||.5)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>');
 o.bore=(x1,x2,cy,h,keys)=>{const d='M'+x1+' '+(cy-h)+'H'+x2+'V'+(cy+h)+'H'+x1;o.out.push('<path d="'+d+'" fill="none" stroke="'+INK+'" stroke-dasharray="4 3" stroke-opacity=".8"/>');reg(keys,'<rect x="'+x1+'" y="'+(cy-h)+'" width="'+(x2-x1)+'" height="'+2*h+'" fill="'+HIT+'" fill-opacity=".7"/>')};
 o.m={};const A=a=>esc(o.m[a]||a);
 o.axis=(x1,x2,cy)=>o.out.push('<line x1="'+x1+'" y1="'+cy+'" x2="'+x2+'" y2="'+cy+'" stroke="'+INK+'" stroke-opacity=".45" stroke-dasharray="10 3 2 3"/>');
 const hit=(x,y,w,h)=>'<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" fill="transparent" stroke="none"/>';
 // senkrechtes Maß bei x zwischen y1 und y2, Hilfslinien von xs aus
 o.vdim=(key,abbr,x,y1,y2,xs)=>{const dir=x>=xs?1:-1,e=x+dir*3;let g='<g class="dim" data-dim="'+key+'">';
  if(Math.abs(x-xs)>1)g+='<line x1="'+xs+'" y1="'+y1+'" x2="'+e+'" y2="'+y1+'" stroke-dasharray="2 2"/><line x1="'+xs+'" y1="'+y2+'" x2="'+e+'" y2="'+y2+'" stroke-dasharray="2 2"/>';
  g+='<line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'"/><polygon points="'+x+','+y1+' '+(x-2.6)+','+(y1+6.5)+' '+(x+2.6)+','+(y1+6.5)+'"/><polygon points="'+x+','+y2+' '+(x-2.6)+','+(y2-6.5)+' '+(x+2.6)+','+(y2-6.5)+'"/><text x="'+(x+dir*6)+'" y="'+(((y1+y2)/2)+4).toFixed(1)+'" text-anchor="'+(dir>0?'start':'end')+'">'+A(abbr)+'</text>'+hit(Math.min(x,xs)-4,y1,Math.abs(x-xs)+Math.max(22,0),y2-y1)+'</g>';o.dims.push(g)};
 // waagrechtes Maß auf Höhe y zwischen x1 und x2, Hilfslinien von ys1/ys2 aus
 o.hdim=(key,abbr,y,x1,x2,ys1,ys2)=>{o.dims.push('<g class="dim" data-dim="'+key+'"><line x1="'+x1+'" y1="'+ys1+'" x2="'+x1+'" y2="'+(y+3)+'" stroke-dasharray="2 2"/><line x1="'+x2+'" y1="'+ys2+'" x2="'+x2+'" y2="'+(y+3)+'" stroke-dasharray="2 2"/><line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'"/><polygon points="'+x1+','+y+' '+(x1+6.5)+','+(y-2.6)+' '+(x1+6.5)+','+(y+2.6)+'"/><polygon points="'+x2+','+y+' '+(x2-6.5)+','+(y-2.6)+' '+(x2-6.5)+','+(y+2.6)+'"/><text x="'+((x1+x2)/2).toFixed(1)+'" y="'+(y-4)+'" text-anchor="middle">'+A(abbr)+'</text>'+hit(x1,y-12,x2-x1,16)+'</g>')};
 // Text mit Führungslinie (Anschluss, ER-Größe, Plattenform)
 o.tag=(key,text,x,y,tx,ty,anchor)=>o.dims.push('<g class="dim" data-dim="'+key+'"><path d="M'+x+' '+y+'L'+tx+' '+ty+'"/><circle cx="'+x+'" cy="'+y+'" r="2.3" style="fill:'+INK+'" stroke="none"/><text class="tg" x="'+tx+'" y="'+(ty-3)+'" text-anchor="'+(anchor||'middle')+'">'+esc(o.m[text]||text)+'</text>'+hit(tx-34,ty-16,68,18)+'</g>');
 o.ang=(key,abbr,ax,ay,r,half,right)=>{const a=half*Math.PI/180,sg=right?1:-1,P=s=>[(ax-sg*r*Math.cos(a)).toFixed(1),(ay+s*r*Math.sin(a)).toFixed(1)];const p1=P(-1),p2=P(1);o.dims.push('<g class="dim" data-dim="'+key+'"><path d="M'+p1[0]+' '+p1[1]+'A'+r+' '+r+' 0 0 '+(right?0:1)+' '+p2[0]+' '+p2[1]+'"/><text x="'+(ax-sg*(r+7))+'" y="'+(ay+4)+'" text-anchor="'+(right?'end':'start')+'">'+A(abbr)+'</text>'+hit(ax-sg*(r+16)-(right?0:0),ay-r,r+16,2*r)+'</g>')};
 o.svg=H=>{const hl=Object.entries(o.hl).map(([k,v])=>'<g class="hl" data-dim="'+k+'">'+v.join('')+'</g>').join('');return '<svg class="t3d" viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Skizze mit Kürzeln" style="max-height:'+H+'px">'+CSS+DEFS+'<rect x="1" y="1" width="'+(W-2)+'" height="'+(H-2)+'" rx="12" fill="#ffffff" stroke="#d3dae1"/><g transform="translate('+SH+',0)">'+o.out.join('')+hl+o.dims.join('')+'</g></svg>'};
 return o;
}
// ---------- Skizzen je Art. Rückgabe: Höhe. rows werden getrennt geführt.
function mill(o,k){
 const cy=70,xs=44,hs=19,hc=22,x1=118,x2=140,xe=k==='ball'||k==='lolli'?286:290,xf=92;
 o.axis(xs-10,xe+10,cy);
 o.poly([[xs,cy-hs],[x1,cy-hs],[x1,cy+hs],[xs,cy+hs]],TINT.cutter,['shaftDiameter']);
 if(k==='lolli'){
  const hn=6,xh=xe-2*hc,yb=cy;
  o.poly([[x1,cy-hs],[x2,cy-hn],[xh+4,cy-hn],[xh+4,cy+hn],[x2,cy+hn],[x1,cy+hs]],TINT.cutter,['neckDiameter','neckLength']);
  o.circ(xh+hc,yb,hc,TINT.cutter,['diameter']);
  o.vdim('neckDiameter','d3',(x2+xh)/2,cy-hn,cy+hn,(x2+xh)/2);
  o.hdim('neckLength','l3',cy+hc+16,x2,xh,cy+hn,cy+hc);
  o.vdim('diameter','d1',xe+22,cy-hc,cy+hc,xe-hc);
 }else{
  o.poly([[x1,cy-hs],[x2,cy-hc],[x2,cy+hc],[x1,cy+hs]],TINT.cutter,[]);
  let d;
  if(k==='ball')d='M'+x2+' '+(cy-hc)+'H'+(xe-hc)+'A'+hc+' '+hc+' 0 0 1 '+(xe-hc)+' '+(cy+hc)+'H'+x2+'Z';
  else if(k==='radius'){const R=11;d='M'+x2+' '+(cy-hc)+'H'+(xe-R)+'A'+R+' '+R+' 0 0 1 '+xe+' '+(cy-hc+R)+'V'+(cy+hc-R)+'A'+R+' '+R+' 0 0 1 '+(xe-R)+' '+(cy+hc)+'H'+x2+'Z'}
  else d='M'+x2+' '+(cy-hc)+'H'+(xe-3)+'L'+xe+' '+(cy-hc+3)+'V'+(cy+hc-3)+'L'+(xe-3)+' '+(cy+hc)+'H'+x2+'Z';
  o.path(d,TINT.cutter,['diameter','cuttingLength']);
  for(let i=0;i<4;i++){const a=x2+14+i*38;o.line(a,cy+hc,a+24,cy-hc,.45)}
  o.vdim('diameter','d1',xe+22,cy-hc,cy+hc,k==='ball'?xe-hc:xe-(k==='radius'?11:0));
  if(k==='radius')o.tag('cornerRadius','r',xe-5,cy-hc+3,xe-30,cy-hc-14);
  o.hdim('cuttingLength','l2',cy+hc+16,x2,xe,cy+hc,cy+hc);
 }
 o.line(xf,cy-hs-12,xf,cy+hs+12,.8,'6 3');o.out.push('<text x="'+xf+'" y="'+(cy-hs-15)+'" font-size="10" text-anchor="middle" fill="'+INK+'" fill-opacity=".75">Futter</text>');
 o.vdim('shaftDiameter','d2',24,cy-hs,cy+hs,xs);
 o.hdim('projection','A',cy+hc+32,xf,xe,cy+hs+12,cy+hc);
 o.hdim('totalLength','l1',cy+hc+48,xs,xe,cy+hs,cy+hc);
 return cy+hc+62;
}
function drill(o){
 const cy=70,xs=44,hs=16,hc=20,x1=128,x2=140,xt=272,xa=xt+hc/Math.tan(59*Math.PI/180),xf=92;
 o.axis(xs-10,xa+12,cy);
 o.poly([[xs,cy-hs],[x1,cy-hs],[x1,cy+hs],[xs,cy+hs]],TINT.cutter,['shaftDiameter']);
 o.poly([[x1,cy-hs],[x2,cy-hc],[x2,cy+hc],[x1,cy+hs]],TINT.cutter,[]);
 o.poly([[x2,cy-hc],[xt,cy-hc],[xt,cy+hc],[x2,cy+hc]],TINT.cutter,['diameter','cuttingLength']);
 o.poly([[xt,cy-hc],[xa,cy],[xt,cy+hc]],TINT.cutter,['pointAngle']);
 for(let i=0;i<3;i++){const a=x2+8+i*44;o.out.push('<path d="M'+a+' '+(cy+hc)+'Q'+(a+14)+' '+cy+' '+(a+34)+' '+(cy-hc)+'" fill="none" stroke="'+INK+'" stroke-opacity=".5"/>')}
 o.ang('pointAngle','σ',xa,cy,24,59,true);
 o.line(xf,cy-hs-12,xf,cy+hs+12,.8,'6 3');o.out.push('<text x="'+xf+'" y="'+(cy-hs-15)+'" font-size="10" text-anchor="middle" fill="'+INK+'" fill-opacity=".75">Futter</text>');
 o.vdim('shaftDiameter','d2',24,cy-hs,cy+hs,xs);
 o.vdim('diameter','d1',xa+28,cy-hc,cy+hc,xt);
 o.hdim('cuttingLength','l2',cy+hc+16,x2,xa,cy+hc,cy);
 o.hdim('projection','A',cy+hc+32,xf,xa,cy+hs+12,cy);
 o.hdim('totalLength','l1',cy+hc+48,xs,xa,cy+hs,cy);
 return cy+hc+62;
}
function tap(o){
 const cy=70,xs=44,hs=14,hc=20,x1=124,x2=148,xt=270,xe=290,xf=92;
 o.axis(xs-10,xe+10,cy);
 o.poly([[xs,cy-hs],[x1,cy-hs],[x1,cy+hs],[xs,cy+hs]],TINT.cutter,['shaftDiameter']);
 o.poly([[xs,cy-9],[xs+22,cy-9],[xs+22,cy+9],[xs,cy+9]],TINT.cutter,[]);
 o.poly([[x1,cy-hs],[x2,cy-hc],[x2,cy+hc],[x1,cy+hs]],TINT.cutter,[]);
 o.poly([[x2,cy-hc],[xt,cy-hc],[xe,cy-hc+6],[xe,cy+hc-6],[xt,cy+hc],[x2,cy+hc]],TINT.cutter,['diameter','cuttingLength']);
 for(let a=x2+8;a<xt-4;a+=10)o.line(a,cy+hc,a+7,cy-hc,.4);
 o.line(xf,cy-hs-12,xf,cy+hs+12,.8,'6 3');o.out.push('<text x="'+xf+'" y="'+(cy-hs-15)+'" font-size="10" text-anchor="middle" fill="'+INK+'" fill-opacity=".75">Futter</text>');
 o.vdim('shaftDiameter','d2',24,cy-hs,cy+hs,xs);
 o.vdim('diameter','d1',xe+22,cy-hc,cy+hc,xt);
 o.hdim('cuttingLength','l2',cy+hc+16,x2,xe,cy+hc,cy+hc);
 o.hdim('projection','A',cy+hc+32,xf,xe,cy+hs+12,cy+hc);
 o.hdim('totalLength','l1',cy+hc+48,xs,xe,cy+hs,cy+hc);
 return cy+hc+62;
}
function turn(o){
 const cy=64,xs=40,xe=300,hh=22;
 o.axis(xs-8,xe+6,cy);
 o.poly([[xs,cy-hh],[268,cy-hh],[268,cy+hh],[xs,cy+hh]],TINT.holder,['shaftDiameter']);
 o.poly([[268,cy-hh],[xe,cy-hh],[xe,cy+6],[288,cy+hh],[268,cy+hh]],TINT.holder,[]);
 o.poly([[280,cy-hh],[xe,cy-hh],[xe,cy-hh+22],[288,cy-hh+22]],TINT.insert,['inSize']);
 o.vdim('shaftDiameter','h',22,cy-hh,cy+hh,xs);
 o.vdim('diameter','f',xe+16,cy-hh,cy,xe);
 o.hdim('totalLength','l1',cy+hh+18,xs,xe,cy+hh,cy+hh);
 o.tag('inSize','Platte',xe-12,cy-hh+6,xe-44,cy-hh-14);
 return cy+hh+32;
}
function millhead(o){
 const cy=76,x1=130,x2=196,h=40;
 o.axis(90,260,cy);
 o.poly([[x1,cy-h],[x2,cy-h],[x2,cy+h],[x1,cy+h]],TINT.holder,['diameter']);
 o.bore(x1,x2,cy,12,['shaftDiameter']);
 [-h,h-12].forEach(y=>o.poly([[x2,cy+y],[x2+12,cy+y],[x2+12,cy+y+12],[x2,cy+y+12]],TINT.insert,['outSize']));
 o.vdim('diameter','d1',250,cy-h,cy+h,x2+12);
 o.vdim('shaftDiameter','d2',100,cy-12,cy+12,x1);
 o.hdim('totalLength','l1',cy+h+18,x1,x2,cy+h,cy+h);
 o.tag('outSize','Platten',x2+6,cy-h+6,x2+30,cy-h-12,'start');
 return cy+h+32;
}
function holderBase(o,t,body,cy,noseX){
 o.axis(10,noseX+14,cy);
 o.poly([[20,cy-16],[48,cy-22],[48,cy+22],[20,cy+16]],TINT.spindle,['interface']);
 o.poly([[48,cy-40],[70,cy-40],[70,cy+40],[48,cy+40]],TINT.holder,['interface']);
 o.tag('interface',t.interface||t.inSize?String(t.interface||t.inSize):'Anschluss',34,cy-18,34,cy-56,'middle');
}
function erchuck(o,t){
 const cy=88,nose=290;holderBase(o,t,null,cy,nose);
 o.poly([[70,cy-26],[226,cy-22],[226,cy+22],[70,cy+26]],TINT.holder,[]);
 o.poly([[226,cy-27],[280,cy-27],[280,cy+27],[226,cy+27]],TINT.holder,['outSize']);
 [236,246,256,268].forEach(x=>o.line(x,cy-27,x,cy+27,.45));
 o.poly([[280,cy-12],[nose,cy-12],[nose,cy+12],[280,cy+12]],TINT.collet,['outSize']);
 o.tag('outSize',String(t.outSize||'ER'),256,cy-27,256,cy-56,'middle');
 o.hdim('totalLength','l1',cy+27+18,48,nose,cy+40,cy+12);
 return cy+27+32;
}
function boreHolder(o,t,k){
 const cy=88,nose=288;holderBase(o,t,null,cy,nose);
 if(k==='shrink')o.poly([[70,cy-28],[nose,cy-16],[nose,cy+16],[70,cy+28]],TINT.holder,[]);
 else if(k==='hydro')o.poly([[70,cy-30],[130,cy-22],[nose,cy-22],[nose,cy+22],[130,cy+22],[70,cy+30]],TINT.holder,[]);
 else{o.poly([[70,cy-24],[nose,cy-24],[nose,cy+24],[70,cy+24]],TINT.holder,[]);if(k==='weldon')o.poly([[240,cy-24],[254,cy-24],[254,cy-34],[240,cy-34]],TINT.holder,[])}
 o.bore(nose-90,nose,cy,9,['minDiameter']);
 o.vdim('minDiameter','d1',nose+24,cy-9,cy+9,nose);
 o.hdim('totalLength','l1',cy+34+18,48,nose,cy+40,cy+24);
 return cy+34+32;
}
function collet(o,t){
 const cy=70,xs=40,xe=284;o.axis(xs-14,xe+14,cy);
 o.poly([[xs,cy-26],[xs+22,cy-34],[xe-40,cy-34],[xe,cy-24],[xe,cy+24],[xe-40,cy+34],[xs+22,cy+34],[xs,cy+26]],TINT.collet,['interface']);
 [0,1,2,3,4].forEach(i=>{const y=cy-20+i*10;o.line(xe-100,y,xe,y,.3)});
 o.bore(xs,xe,cy,11,['minDiameter']);
 o.vdim('minDiameter','d1',xe+24,cy-11,cy+11,xe);
 o.hdim('totalLength','l1',cy+34+18,xs,xe,cy+26,cy+24);
 o.tag('interface',String(t.interface||'ER'),xs+60,cy-34,xs+60,cy-52,'middle');
 return cy+34+32;
}
function reducer(o){
 const cy=70,xs=50,xe=280;o.axis(xs-14,xe+14,cy);
 o.poly([[xs,cy-28],[xe,cy-28],[xe,cy+28],[xs,cy+28]],TINT.collet,['shaftDiameter']);
 o.bore(xs,xe,cy,10,['minDiameter']);
 o.vdim('shaftDiameter','d2',24,cy-28,cy+28,xs);
 o.vdim('minDiameter','d1',xe+26,cy-10,cy+10,xe);
 o.hdim('totalLength','l1',cy+28+18,xs,xe,cy+28,cy+28);
 return cy+28+32;
}
function extension(o){
 const cy=70,xs=44,xe=300;o.axis(xs-14,xe+14,cy);
 o.poly([[xs,cy-24],[xe,cy-24],[xe,cy+24],[xs,cy+24]],TINT.holder,['diameter']);
 [xs+10,xe-10].forEach(x=>o.line(x,cy-24,x,cy+24,.45));
 o.vdim('diameter','d1',24,cy-24,cy+24,xs);
 o.hdim('totalLength','l1',cy+24+18,xs,xe,cy+24,cy+24);
 return cy+24+32;
}
function insert(o,t){
 const cx=170,cy=84;
 o.poly([[cx,cy-66],[cx+55,cy],[cx,cy+66],[cx-55,cy]],TINT.insert,['inSize']);
 o.circ(cx,cy,12,'#ffffff',['inSize'],true);
 o.tag('inSize',String(t.inSize||'Plattenform'),cx+30,cy-30,cx+62,cy-72,'start');
 return cy+66+10;
}
const ROWS={
 mill:[['diameter','d1','Schneiden-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Schneidenlänge','mm'],['projection','A','Auskragung (Montagemaß)','mm']],
 radius:[['diameter','d1','Schneiden-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Schneidenlänge','mm'],['cornerRadius','r','Eckenradius','mm'],['projection','A','Auskragung (Montagemaß)','mm']],
 lolli:[['diameter','d1','Kugel-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['neckDiameter','d3','Hals-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['neckLength','l3','Halslänge','mm'],['projection','A','Auskragung (Montagemaß)','mm']],
 drill:[['diameter','d1','Bohrer-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Nutenlänge','mm'],['pointAngle','σ','Spitzenwinkel','°'],['projection','A','Auskragung (Montagemaß)','mm']],
 tap:[['diameter','d1','Gewinde-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Gewindelänge','mm'],['projection','A','Auskragung (Montagemaß)','mm']],
 turn:[['shaftDiameter','h = b','Vierkantschaft','mm'],['diameter','f','Bearbeitungsmaß','mm'],['totalLength','l1','Gesamtlänge','mm'],['inSize','Platte','Passende Wendeplatte','']],
 millhead:[['diameter','d1','Außen-Ø','mm'],['shaftDiameter','d2','Aufnahmebohrung','mm'],['totalLength','l1','Höhe','mm'],['outSize','Platte','Passende Wendeplatte','']],
 erchuck:[['interface','Anschluss','Maschinenaufnahme',''],['outSize','ER','Spannzangengröße',''],['totalLength','l1','Länge ab Messebene','mm']],
 bore:[['interface','Anschluss','Maschinenaufnahme',''],['minDiameter','d1','Aufnahme-Ø','mm'],['totalLength','l1','Länge ab Messebene','mm']],
 collet:[['interface','ER','Spannzangentyp',''],['minDiameter','d1','Spannbereich','mm'],['totalLength','l1','Länge','mm']],
 reducer:[['shaftDiameter','d2','Außen-Ø','mm'],['minDiameter','d1','Innen-Ø','mm'],['totalLength','l1','Länge','mm']],
 extension:[['diameter','d1','Außen-Ø','mm'],['totalLength','l1','Länge','mm']],
 insert:[['inSize','Form','Plattenform und Größe','']]
};
function type(k,t){
 if(['endmill','ball','lolli','radius'].includes(k))return k==='endmill'?'mill':k;
 if(k==='drill'||k==='tap')return k;
 if(k==='turn'||(k==='insertholder'&&t&&t.inKind==='Vierkantschaft'))return 'turn';
 if(k==='insertholder')return 'millhead';
 if(k==='erchuck')return 'erchuck';
 if(['shrink','hydro','weldon'].includes(k))return 'bore';
 if(k==='collet')return 'collet';
 if(k==='reducer')return 'reducer';
 if(k==='extension')return 'extension';
 if(k==='insert')return 'insert';
 return null;
}
function value(t,key,unit){
 if(key==='minDiameter'){const a=num(t.minDiameter),b=num(t.maxDiameter);if(a===null)return null;return (b!==null&&b!==a?fmt(a)+'–'+fmt(b):fmt(a))+' mm'}
 const v=t[key];if(v===''||v===null||v===undefined)return null;const n=num(v);return n===null?String(v):fmt(n)+(unit?' '+unit:'');
}
const MAP={mill:{A:'l4'},drill:{A:'l4'},tap:{A:'l4'}};
function draw(t,kindKey){
 const ty=type(kindKey,t);if(!ty)return null;
 const o=kit();let H;o.m=MAP[({ball:'mill',radius:'mill',lolli:'mill'})[ty]||ty]||{};
 switch(ty){
  case 'mill':case 'radius':case 'lolli':case 'ball':H=mill(o,ty==='mill'?'endmill':ty);break;
  case 'drill':H=drill(o);break;case 'tap':H=tap(o);break;case 'turn':H=turn(o);break;case 'millhead':H=millhead(o);break;
  case 'erchuck':H=erchuck(o,t);break;case 'bore':H=boreHolder(o,t,kindKey);break;case 'collet':H=collet(o,t);break;case 'reducer':H=reducer(o);break;
  case 'extension':H=extension(o);break;case 'insert':H=insert(o,t);break;
 }
 const rows=ROWS[ty==='ball'?'mill':ty].map(([key,abbr,name,unit])=>({key,abbr:o.m[abbr]||abbr,name,value:value(t,key,unit)}));
 return {svg:o.svg(H),rows,type:ty};
}
function legend(rows,on){
 return '<div class="t3d-legend">'+rows.map(r=>'<button type="button" class="leg'+(r.key===on?' on':'')+(r.value===null?' miss':'')+'" data-t3d-key="'+esc(r.key)+'"><b>'+esc(r.abbr)+'</b><span>'+esc(r.name)+'</span><i>'+(r.value===null?'fehlt':esc(r.value))+'</i></button>').join('')+'</div>';
}
const api={draw,legend,type,ROWS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncSketch=api;
})(typeof window!=='undefined'?window:globalThis);
