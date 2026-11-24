/* CNC OS Werkzeugzeichnung im Stil technischer Hersteller-Illustrationen:
   Werkzeug senkrecht, helle Fläche, dünne Linien, Maße mit Pfeilen und ISO-13399-Kürzeln (DC, DCONMS, LF, APMX ...).
   Nicht maßstäblich. Hintergrund und Linienfarbe folgen dem App-Design. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
const fmt=n=>String(Math.round(n*100)/100).replace('.',',');
const INK='var(--ink,#cfe0ee)',HIT='#f59e0b',W=340;
const FILL={cutter:['#46b8c4',.4],holder:['#7f9bb8',.38],collet:['#d9a441',.42],insert:['#d9708a',.5],spindle:['#98a5b3',.3]};
const CSS='<style>.t3d .dim{cursor:pointer}.t3d .dim line,.t3d .dim path{stroke:'+INK+';stroke-width:1;fill:none}.t3d .dim polygon{fill:'+INK+';stroke:none}.t3d .dim text{fill:'+INK+';font-size:14.5px;font-weight:500}.t3d .dim tspan.sb{font-size:10px}.t3d .hl{display:none;pointer-events:none}.t3d[data-on] .dim{opacity:.45}.t3d[data-on] .dim.on{opacity:1}.t3d .dim.on line,.t3d .dim.on path{stroke:'+HIT+';stroke-width:2.2}.t3d .dim.on polygon{fill:'+HIT+'}.t3d .dim.on text{fill:'+HIT+';font-weight:700}.t3d .hl.on{display:inline}</style>';
const lab=s=>{s=String(s);const m=/^([a-zα]+)(\d)$/.exec(s);return m?m[1]+'<tspan class="sb" dy="3">'+m[2]+'</tspan>':esc(s)};
function kit(){
 const o={out:[],dims:[],hl:{}};
 const reg=(keys,el)=>(keys||[]).forEach(k=>(o.hl[k]=o.hl[k]||[]).push(el));
 const ps=p=>p.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ');
 const fl=t=>'fill="'+FILL[t][0]+'" fill-opacity="'+FILL[t][1]+'"';
 const hlf='fill="'+HIT+'" fill-opacity=".6" stroke="'+HIT+'" stroke-width="1.6"';
 o.poly=(p,t,keys)=>{o.out.push('<polygon points="'+ps(p)+'" '+fl(t)+' stroke="'+INK+'" stroke-width="1.2" stroke-linejoin="round"/>');reg(keys,'<polygon points="'+ps(p)+'" '+hlf+'/>')};
 o.path=(d,t,keys)=>{o.out.push('<path d="'+d+'" '+fl(t)+' stroke="'+INK+'" stroke-width="1.2" stroke-linejoin="round"/>');reg(keys,'<path d="'+d+'" '+hlf+'/>')};
 o.circ=(cx,cy,r,t,keys,dash)=>{o.out.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" '+(t?fl(t):'fill="none"')+' stroke="'+INK+'" stroke-width="1.2"'+(dash?' stroke-dasharray="4 3"':'')+'/>');reg(keys,'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" '+hlf+'/>')};
 o.line=(x1,y1,x2,y2,op,dash)=>o.out.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+INK+'" stroke-width="1" stroke-opacity="'+(op||.6)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>');
 o.swoosh=(cx,y,w)=>o.out.push('<path d="M'+(cx-w)+' '+(y+14)+'Q'+cx+' '+(y+10)+' '+(cx+w)+' '+(y-8)+'" fill="none" stroke="'+INK+'" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>');
 o.bore=(x1,x2,y1,y2,keys)=>{o.out.push('<path d="M'+x1+' '+y1+'V'+y2+'M'+x2+' '+y1+'V'+y2+'" fill="none" stroke="'+INK+'" stroke-dasharray="5 3" stroke-opacity=".8"/>');reg(keys,'<rect x="'+x1+'" y="'+y1+'" width="'+(x2-x1)+'" height="'+(y2-y1)+'" fill="'+HIT+'" fill-opacity=".7"/>')};
 o.axis=(cx,y1,y2)=>o.out.push('<line x1="'+cx+'" y1="'+y1+'" x2="'+cx+'" y2="'+y2+'" stroke="'+INK+'" stroke-opacity=".5" stroke-dasharray="12 3 2 3"/>');
 const hit=(x,y,w,h)=>'<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+Math.max(w,8).toFixed(1)+'" height="'+Math.max(h,8).toFixed(1)+'" fill="transparent" stroke="none"/>';
 const arr=(x,y,d)=>{const p={u:[[x,y],[x-2.6,y+8],[x+2.6,y+8]],d:[[x,y],[x-2.6,y-8],[x+2.6,y-8]],l:[[x,y],[x+8,y-2.6],[x+8,y+2.6]],r:[[x,y],[x-8,y-2.6],[x-8,y+2.6]]}[d];return '<polygon points="'+ps(p)+'"/>'};
 o.hin=(key,label,y,xl,xr,yext)=>{const s=y<yext?-1:1;o.dims.push('<g class="dim" data-dim="'+key+'"><line x1="'+xl+'" y1="'+yext+'" x2="'+xl+'" y2="'+(y+s*6)+'"/><line x1="'+xr+'" y1="'+yext+'" x2="'+xr+'" y2="'+(y+s*6)+'"/><line x1="'+(xl-22)+'" y1="'+y+'" x2="'+xl+'" y2="'+y+'"/><line x1="'+xr+'" y1="'+y+'" x2="'+(xr+22)+'" y2="'+y+'"/>'+arr(xl,y,'r')+arr(xr,y,'l')+'<text x="'+(xr+28)+'" y="'+(y+5)+'">'+lab(label)+'</text>'+hit(xl-24,y-12,xr-xl+90,24)+'</g>')};
 o.vd=(key,label,x,y1,y2,xs1,xs2,side)=>{const e=x+side*5;o.dims.push('<g class="dim" data-dim="'+key+'"><line x1="'+xs1+'" y1="'+y1+'" x2="'+e+'" y2="'+y1+'"/><line x1="'+xs2+'" y1="'+y2+'" x2="'+e+'" y2="'+y2+'"/><line x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+'"/>'+arr(x,y1,'u')+arr(x,y2,'d')+'<text x="'+(x+side*9)+'" y="'+(((y1+y2)/2)+5).toFixed(1)+'" text-anchor="'+(side>0?'start':'end')+'">'+lab(label)+'</text>'+hit(side>0?x-8:x-60,y1,68,y2-y1)+'</g>')};
 o.tag=(key,text,x,y,tx,ty,anchor)=>{const dx=x-tx,dy=y-ty,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,bx=x-ux*8,by=y-uy*8;o.dims.push('<g class="dim" data-dim="'+key+'"><line x1="'+tx+'" y1="'+ty+'" x2="'+bx.toFixed(1)+'" y2="'+by.toFixed(1)+'"/><polygon points="'+x+','+y+' '+(bx-uy*2.6).toFixed(1)+','+(by+ux*2.6).toFixed(1)+' '+(bx+uy*2.6).toFixed(1)+','+(by-ux*2.6).toFixed(1)+'"/><text x="'+tx+'" y="'+(ty-4)+'" text-anchor="'+(anchor||'middle')+'">'+lab(text)+'</text>'+hit(tx-40,ty-18,80,24)+'</g>')};
 o.svg=H=>{const hl=Object.entries(o.hl).map(([k,v])=>'<g class="hl" data-dim="'+k+'">'+v.join('')+'</g>').join('');return '<svg class="t3d" viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Technische Zeichnung mit Kürzeln" style="max-height:'+H+'px">'+CSS+o.out.join('')+hl+o.dims.join('')+'</svg>'};
 return o;
}
// Schaft und Schneide im Verhältnis der eingegebenen Durchmesser (grob, begrenzt); ohne Werte: Schaft größer
function prop(t,big,dflt){const d1=num(t.diameter),d2=num(t.shaftDiameter);if(!(d1>0)||!(d2>0))return dflt;const r=d2/d1;return r>=1?[big,Math.max(8,big/Math.min(r,3))]:[Math.max(8,big*Math.max(r,.33)),big]}
function mill(o,k,t){
 const P=prop(t,k==='lolli'?22:19,k==='lolli'?[22,16]:[19,13]);
 const cx=150,yt=46,hs=P[0],y1=128,y2=140,hc=P[1],hn=5,yh=218,ye=k==='lolli'?252:246,yf=yt+66;
 const hcut=hc;
 o.axis(cx,yt-10,ye+10);
 o.poly([[cx-hs,yt],[cx+hs,yt],[cx+hs,y1],[cx-hs,y1]],'cutter',['shaftDiameter']);
 if(String(t.shaftType)==='Weldon'){o.out.push('<rect x="'+(cx-6)+'" y="'+(yt+30)+'" width="12" height="18" rx="3" fill="none" stroke="'+INK+'"/><circle cx="'+cx+'" cy="'+(yt+39)+'" r="3.4" fill="none" stroke="'+INK+'"/>')}
 if(k==='lolli'){
  o.poly([[cx-hs,y1],[cx+hs,y1],[cx+hn,y2],[cx-hn,y2]],'cutter',[]);
  o.poly([[cx-hn,y2],[cx+hn,y2],[cx+hn,yh+4],[cx-hn,yh+4]],'cutter',['neckDiameter','neckLength']);
  o.circ(cx,ye-hc,hc,'cutter',['diameter']);
  o.hin('neckDiameter','d3',(y2+yh)/2,cx-hn,cx+hn,(y2+yh)/2);
  o.vd('neckLength','l3',cx-60,y2,yh,cx-hn,cx-hc,-1);
 }else{
  o.poly([[cx-hs,y1],[cx+hs,y1],[cx+hc,y2],[cx-hc,y2]],'cutter',[]);
  let d;
  if(k==='ball')d='M'+(cx-hc)+' '+y2+'V'+(ye-hc)+'A'+hc+' '+hc+' 0 0 0 '+(cx+hc)+' '+(ye-hc)+'V'+y2+'Z';
  else if(k==='radius')d='M'+(cx-hc)+' '+y2+'V'+(ye-10)+'Q'+(cx-hc)+' '+ye+' '+(cx-hc+10)+' '+ye+'H'+(cx+hc-10)+'Q'+(cx+hc)+' '+ye+' '+(cx+hc)+' '+(ye-10)+'V'+y2+'Z';
  else d='M'+(cx-hc)+' '+y2+'V'+(ye-2)+'L'+(cx-hc+2)+' '+ye+'H'+(cx+hc-2)+'L'+(cx+hc)+' '+(ye-2)+'V'+y2+'Z';
  o.path(d,'cutter',['diameter','cuttingLength']);
  for(let i=0;i<4;i++)o.swoosh(cx,y2+22+i*24,hc-1);
  o.vd('cuttingLength','l2',cx-60,y2,ye,cx-hc,cx-(k==='ball'?3:hc),-1);
  if(k==='radius'){
   const dx=66,dy=ye+50,R=40;
   o.out.push('<clipPath id="skc"><circle cx="'+dx+'" cy="'+dy+'" r="'+R+'"/></clipPath>');
   o.out.push('<circle cx="'+dx+'" cy="'+dy+'" r="'+R+'" fill="none" stroke="'+INK+'" stroke-width="1.2"/>');
   o.out.push('<path clip-path="url(#skc)" d="M'+(dx-R)+' '+(dy-R)+'H'+(dx+14)+'V'+(dy+6)+'Q'+(dx+14)+' '+(dy+24)+' '+(dx-6)+' '+(dy+24)+'H'+(dx-R)+'Z" fill="'+FILL.cutter[0]+'" fill-opacity="'+FILL.cutter[1]+'" stroke="'+INK+'" stroke-width="1.2"/>');
   o.line(dx+R-8,dy-22,cx-hc+2,ye-2,.7);o.out.push('<circle cx="'+(cx-hc+4)+'" cy="'+(ye-4)+'" r="6" fill="none" stroke="'+INK+'"/>');
   o.tag('cornerRadius','r1',dx+10,dy+20,dx+64,dy+36,'start');
  }
 }
 o.hin('shaftDiameter','d2',yt-24,cx-hs,cx+hs,yt);
 o.hin('diameter','d1',ye+26,cx-hcut,cx+hcut,k==='ball'||k==='lolli'?ye-hc:ye);
 o.vd('totalLength','l1',cx+58,yt,ye,cx+hs,cx+3,1);
 o.line(cx-hs-8,yf,cx+hs+8,yf,.7,'6 3');
 o.vd('projection','l4',cx+100,yf,ye,cx+hs+8,cx+3,1);
 return k==='radius'?ye+100:ye+52;
}
function drill(o,t){
 const yc=232,pa=Math.min(170,Math.max(60,num(t.pointAngle)||118))/2,P=prop(t,18,[18,12]),hs=P[0],hc=P[1],cx=150,yt=46,y1=118,y2=130,ya=yc+hc/Math.tan(pa*Math.PI/180),yf=yt+60;
 o.axis(cx,yt-10,ya+10);
 o.poly([[cx-hs,yt],[cx+hs,yt],[cx+hs,y1],[cx-hs,y1]],'cutter',['shaftDiameter']);
 if(String(t.shaftType)==='Weldon')o.out.push('<rect x="'+(cx-6)+'" y="'+(yt+26)+'" width="12" height="18" rx="3" fill="none" stroke="'+INK+'"/>');
 o.poly([[cx-hs,y1],[cx+hs,y1],[cx+hc,y2],[cx-hc,y2]],'cutter',[]);
 o.poly([[cx-hc,y2],[cx+hc,y2],[cx+hc,yc],[cx-hc,yc]],'cutter',['diameter','cuttingLength']);
 o.poly([[cx-hc,yc],[cx+hc,yc],[cx,ya]],'cutter',['pointAngle']);
 for(let i=0;i<4;i++)o.swoosh(cx,y2+20+i*22,hc-1);
 const r=30,a=pa*Math.PI/180,p1=[cx-r*Math.sin(a),ya-r*Math.cos(a)],p2=[cx+r*Math.sin(a),ya-r*Math.cos(a)];
 o.dims.push('<g class="dim" data-dim="pointAngle"><path d="M'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+'A'+r+' '+r+' 0 0 1 '+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+'"/><text x="'+(cx+hc+10)+'" y="'+(ya-12)+'">a<tspan class="sb" dy="3">1</tspan></text><rect x="'+(cx-40)+'" y="'+(ya-r-6)+'" width="110" height="'+(r+10)+'" fill="transparent" stroke="none"/></g>');
 o.hin('shaftDiameter','d2',yt-24,cx-hs,cx+hs,yt);
 o.hin('diameter','d1',ya+28,cx-hc,cx+hc,yc);
 o.vd('cuttingLength','l3',cx-60,y2,ya,cx-hc,cx,-1);
 o.vd('totalLength','l1',cx+58,yt,ya,cx+hs,cx+3,1);
 o.line(cx-hs-8,yf,cx+hs+8,yf,.7,'6 3');
 o.vd('projection','l4',cx+100,yf,ya,cx+hs+8,cx+3,1);
 return ya+56;
}
function tap(o,t){
 const P=prop(t,18,[18,13]),hs=P[0],hc=P[1],cx=150,yt=46,y1=124,y2=140,ye=240,yf=yt+60;
 o.axis(cx,yt-10,ye+10);
 o.poly([[cx-hs,yt],[cx+hs,yt],[cx+hs,y1],[cx-hs,y1]],'cutter',['shaftDiameter']);
 o.out.push('<rect x="'+(cx-6)+'" y="'+(yt+5)+'" width="12" height="12" fill="none" stroke="'+INK+'"/>');
 o.poly([[cx-hs,y1],[cx+hs,y1],[cx+hc,y2],[cx-hc,y2]],'cutter',[]);
 o.poly([[cx-hc,y2],[cx+hc,y2],[cx+hc,ye-18],[cx+hc-5,ye],[cx-hc+5,ye],[cx-hc,ye-18]],'cutter',['diameter','cuttingLength']);
 for(let y=y2+8;y<ye-6;y+=9)o.line(cx-hc,y+5,cx+hc,y-3,.55);
 o.hin('shaftDiameter','d2',yt-24,cx-hs,cx+hs,yt);
 o.hin('diameter','d1',ye+26,cx-hc,cx+hc,ye);
 o.vd('cuttingLength','l3',cx-60,y2,ye,cx-hc,cx-hc+5,-1);
 o.vd('totalLength','l1',cx+58,yt,ye,cx+hs,cx+hc-5,1);
 o.line(cx-hs-8,yf,cx+hs+8,yf,.7,'6 3');
 o.vd('projection','l4',cx+100,yf,ye,cx+hs+8,cx+hc-5,1);
 return ye+52;
}
function turn(o){
 const cx=150,yt=46,ye=240,hw=22;
 o.axis(cx,yt-10,ye+20);
 o.poly([[cx-hw,yt],[cx+hw,yt],[cx+hw,ye-34],[cx-hw,ye-34]],'holder',['shaftDiameter']);
 o.poly([[cx-hw,ye-34],[cx+hw,ye-34],[cx+hw,ye],[cx+10,ye+14],[cx-hw,ye+6]],'holder',[]);
 o.poly([[cx+hw-12,ye-6],[cx+hw,ye-6],[cx+hw,ye],[cx+10,ye+14]],'insert',['inSize']);
 o.hin('shaftDiameter','b1',yt-24,cx-hw,cx+hw,yt);
 o.vd('totalLength','l1',cx+62,yt,ye+14,cx+hw,cx+12,1);
 o.hin('diameter','f1',ye+40,cx,cx+hw,ye+14);
 o.tag('inSize','Platte',cx+hw-4,ye-3,cx-60,ye-40,'end');
 return ye+66;
}
function millhead(o){
 const cx=150,yt=110,yb=168,h=48;
 o.axis(cx,yt-50,yb+30);
 o.poly([[cx-h,yt],[cx+h,yt],[cx+h,yb],[cx-h,yb]],'holder',['diameter']);
 o.bore(cx-12,cx+12,yt,yb,['shaftDiameter']);
 [-h,h-10].forEach(x=>o.poly([[cx+x,yb-14],[cx+x+10,yb-14],[cx+x+10,yb+4],[cx+x,yb+4]],'insert',['outSize']));
 o.hin('shaftDiameter','d4',yt-34,cx-12,cx+12,yt);
 o.hin('diameter','d1',yb+34,cx-h,cx+h,yb+4);
 o.vd('totalLength','l1',cx+h+30,yt,yb,cx+h,cx+h,1);
 o.tag('outSize','Platte',cx+h-4,yb-6,cx-80,yb+24,'end');
 return yb+66;
}
function holderTop(o,t,cx){
 o.poly([[cx-14,40],[cx+14,40],[cx+20,70],[cx-20,70]],'spindle',['interface']);
 o.poly([[cx-40,70],[cx+40,70],[cx+40,86],[cx-40,86]],'holder',['interface']);
 o.tag('interface',String(t.interface||t.inSize||'Anschluss'),cx-14,54,cx-80,34,'end');
}
function erchuck(o,t){
 const cx=150,nose=246;o.axis(cx,30,nose+14);holderTop(o,t,cx);
 o.poly([[cx-30,86],[cx+30,86],[cx+25,190],[cx-25,190]],'holder',[]);
 o.poly([[cx-30,190],[cx+30,190],[cx+30,236],[cx-30,236]],'holder',['outSize']);
 [200,210,220,228].forEach(y=>o.line(cx-30,y,cx+30,y,.45));
 o.poly([[cx-13,236],[cx+13,236],[cx+13,nose],[cx-13,nose]],'collet',['outSize']);
 o.tag('outSize',String(t.outSize||'ER'),cx-30,213,cx-82,196,'end');
 o.vd('totalLength','l1',cx+70,70,nose,cx+40,cx+13,1);
 return nose+30;
}
function boreHolder(o,t,k){
 const cx=150,nose=236;o.axis(cx,30,nose+14);holderTop(o,t,cx);
 if(k==='shrink')o.poly([[cx-30,86],[cx+30,86],[cx+17,nose],[cx-17,nose]],'holder',[]);
 else if(k==='hydro')o.poly([[cx-34,86],[cx+34,86],[cx+24,120],[cx+24,nose],[cx-24,nose],[cx-24,120]],'holder',[]);
 else{o.poly([[cx-26,86],[cx+26,86],[cx+26,nose],[cx-26,nose]],'holder',[]);if(k==='weldon')o.out.push('<rect x="'+(cx+26)+'" y="'+(nose-44)+'" width="10" height="14" fill="none" stroke="'+INK+'"/>')}
 o.bore(cx-9,cx+9,nose-100,nose,['minDiameter']);
 o.hin('minDiameter','d4',nose+28,cx-9,cx+9,nose);
 o.vd('totalLength','l1',cx+74,70,nose,cx+40,cx+26,1);
 return nose+56;
}
function arbor(o,t){
 const cx=150,nose=236;o.axis(cx,30,nose+14);holderTop(o,t,cx);
 o.poly([[cx-18,86],[cx+18,86],[cx+18,nose-34],[cx-18,nose-34]],'holder',['outSize']);
 o.poly([[cx-30,nose-34],[cx+30,nose-34],[cx+30,nose],[cx-30,nose]],'holder',[]);
 o.line(cx-18,nose-34,cx+18,nose-34,.6);
 o.hin('outSize','d4',nose+28,cx-18,cx+18,nose-34);
 o.vd('totalLength','l1',cx+74,70,nose,cx+40,cx+30,1);
 return nose+56;
}
function chuck(o,t){
 const cx=150,nose=236;o.axis(cx,30,nose+14);holderTop(o,t,cx);
 o.poly([[cx-36,86],[cx+36,86],[cx+36,170],[cx+22,nose],[cx-22,nose]],'holder',[]);
 for(let y=100;y<164;y+=10)o.line(cx-36,y,cx+36,y,.35);
 o.circ(cx+36,128,4,null,[]);
 o.bore(cx-9,cx+9,nose-110,nose,['minDiameter']);
 o.hin('minDiameter','d4',nose+28,cx-9,cx+9,nose);
 o.vd('totalLength','l1',cx+74,70,nose,cx+40,cx+22,1);
 return nose+56;
}
function collet(o,t){
 const cx=150,yt=60,yb=230;o.axis(cx,yt-20,yb+14);
 o.poly([[cx-24,yt+8],[cx-30,yt+22],[cx-30,yb-30],[cx-22,yb],[cx+22,yb],[cx+30,yb-30],[cx+30,yt+22],[cx+24,yt+8]],'collet',['interface']);
 for(let i=-2;i<=2;i++)o.line(cx+i*10,yb-80,cx+i*10,yb,.3);
 o.bore(cx-11,cx+11,yt+8,yb,['minDiameter']);
 o.hin('minDiameter','d4',yb+28,cx-11,cx+11,yb);
 o.vd('totalLength','l1',cx+66,yt+8,yb,cx+30,cx+22,1);
 o.tag('interface',String(t.interface||'ER'),cx-26,yt+16,cx-76,yt-2,'end');
 return yb+56;
}
function reducer(o){
 const cx=150,yt=60,yb=220;o.axis(cx,yt-20,yb+14);
 o.poly([[cx-30,yt],[cx+30,yt],[cx+30,yb],[cx-30,yb]],'collet',['shaftDiameter']);
 o.bore(cx-11,cx+11,yt,yb,['minDiameter']);
 o.hin('shaftDiameter','d2',yt-26,cx-30,cx+30,yt);
 o.hin('minDiameter','d4',yb+28,cx-11,cx+11,yb);
 o.vd('totalLength','l1',cx+66,yt,yb,cx+30,cx+30,1);
 return yb+56;
}
function extension(o){
 const cx=150,yt=60,yb=230;o.axis(cx,yt-20,yb+14);
 o.poly([[cx-26,yt],[cx+26,yt],[cx+26,yb],[cx-26,yb]],'holder',['diameter']);
 [yt+10,yb-10].forEach(y=>o.line(cx-26,y,cx+26,y,.5));
 o.hin('diameter','d1',yt-26,cx-26,cx+26,yt);
 o.vd('totalLength','l1',cx+62,yt,yb,cx+26,cx+26,1);
 return yb+30;
}
function insert(o,t){
 const cx=150,cy=130,L=String(t.inSize||'C').trim().charAt(0).toUpperCase();
 const S={C:[[cx,cy-76],[cx+62,cy],[cx,cy+76],[cx-62,cy]],D:[[cx,cy-84],[cx+40,cy],[cx,cy+84],[cx-40,cy]],V:[[cx,cy-88],[cx+27,cy],[cx,cy+88],[cx-27,cy]],S:[[cx-58,cy-58],[cx+58,cy-58],[cx+58,cy+58],[cx-58,cy+58]],T:[[cx,cy-72],[cx+66,cy+46],[cx-66,cy+46]],W:[[cx-44,cy-52],[cx+44,cy-52],[cx+70,cy],[cx+28,cy+60],[cx-28,cy+60],[cx-70,cy]]};
 if(L==='R')o.circ(cx,cy,62,'insert',['inSize']);else o.poly(S[L]||S.C,'insert',['inSize']);
 o.circ(cx,cy,13,null,['inSize'],true);
 o.tag('inSize',String(t.inSize||'Plattenform'),cx+32,cy-38,cx+80,cy-90,'start');
 return cy+90;
}
const ROWS={
 mill:[['diameter','d1','Schneiden-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Schneidenlänge','mm'],['projection','l4','Auspannlänge','mm']],
 radius:[['diameter','d1','Schneiden-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l2','Schneidenlänge','mm'],['cornerRadius','r1','Eckenradius','mm'],['projection','l4','Auspannlänge','mm']],
 lolli:[['diameter','d1','Kugel-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['neckDiameter','d3','Hals-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['neckLength','l3','Halslänge','mm'],['projection','l4','Auspannlänge','mm']],
 drill:[['diameter','d1','Bohrer-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l3','Nutenlänge','mm'],['pointAngle','a1','Spitzenwinkel','°'],['projection','l4','Auspannlänge','mm']],
 tap:[['diameter','d1','Gewinde-Ø','mm'],['shaftDiameter','d2','Schaft-Ø','mm'],['totalLength','l1','Gesamtlänge','mm'],['cuttingLength','l3','Gewindelänge','mm'],['projection','l4','Auspannlänge','mm']],
 turn:[['shaftDiameter','b1','Vierkantschaft','mm'],['diameter','f1','Bearbeitungsmaß','mm'],['totalLength','l1','Gesamtlänge','mm'],['inSize','Platte','Passende Wendeplatte','']],
 millhead:[['diameter','d1','Außen-Ø','mm'],['shaftDiameter','d4','Aufnahmebohrung','mm'],['totalLength','l1','Höhe','mm'],['outSize','Platte','Passende Wendeplatte','']],
 arbor:[['interface','Anschluss','Maschinenaufnahme',''],['outSize','d4','Dorn-Ø','mm'],['totalLength','l1','Länge ab Messebene','mm']],
 erchuck:[['interface','Anschluss','Maschinenaufnahme',''],['outSize','ER','Spannzangengröße',''],['totalLength','l1','Länge ab Messebene','mm']],
 bore:[['interface','Anschluss','Maschinenaufnahme',''],['minDiameter','d4','Aufnahme-Ø','mm'],['totalLength','l1','Länge ab Messebene','mm']],
 collet:[['interface','ER','Spannzangentyp',''],['minDiameter','d4','Spannbereich','mm'],['totalLength','l1','Länge','mm']],
 reducer:[['shaftDiameter','d2','Außen-Ø','mm'],['minDiameter','d4','Innen-Ø','mm'],['totalLength','l1','Länge','mm']],
 extension:[['diameter','d1','Außen-Ø','mm'],['totalLength','l1','Länge','mm']],
 insert:[['inSize','Form','Plattenform und Größe','']]
};
function type(k,t){
 if(['endmill','ball','lolli','radius'].includes(k))return k==='endmill'?'mill':k;
 if(k==='drill'||k==='tap')return k;
 if(k==='turn'||(k==='insertholder'&&t&&t.inKind==='Vierkantschaft'))return 'turn';
 if(k==='insertholder')return 'millhead';
 if(k==='erchuck')return 'erchuck';
 if(t&&t.toolKind==='Fräsdorn')return 'arbor';
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
function draw(t,kindKey){
 const ty=type(kindKey,t);if(!ty)return null;
 const o=kit();let H;
 switch(ty){
  case 'mill':H=mill(o,'endmill',t);break;case 'ball':case 'radius':case 'lolli':H=mill(o,ty,t);break;
  case 'drill':H=drill(o,t);break;case 'tap':H=tap(o,t);break;case 'turn':H=turn(o);break;case 'millhead':H=millhead(o);break;
  case 'erchuck':H=erchuck(o,t);break;case 'bore':H=(t&&t.toolKind==='Bohrfutter')?chuck(o,t):boreHolder(o,t,kindKey);break;case 'arbor':H=arbor(o,t);break;case 'collet':H=collet(o,t);break;case 'reducer':H=reducer(o);break;
  case 'extension':H=extension(o);break;case 'insert':H=insert(o,t);break;
 }
 const rows=ROWS[ty==='ball'?'mill':ty].map(([key,abbr,name,unit])=>({key,abbr,name,value:value(t,key,unit)}));
 return {svg:o.svg(H),rows,type:ty};
}
function legend(rows,on){
 return '<div class="t3d-legend">'+rows.map(r=>'<button type="button" class="leg'+(r.key===on?' on':'')+(r.value===null?' miss':'')+'" data-t3d-key="'+esc(r.key)+'"><b>'+esc(r.abbr)+'</b><span>'+esc(r.name)+'</span><i>'+(r.value===null?'fehlt':esc(r.value))+'</i></button>').join('')+'</div>';
}
const api={draw,legend,type,ROWS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncSketch=api;
})(typeof window!=='undefined'?window:globalThis);
