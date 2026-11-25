/* CNC OS: eigene STL-Datei in ein Drehprofil umwandeln.
   Aus der STL-Datei wird die Außenform entlang der Werkzeugachse gelesen: Radius je Position (größter Abstand von der Achse).
   Daraus entstehen Zeichnung, 3D und Zusammenbau wie bei den eingegebenen Maßen. Nicht-runde Merkmale (Flächen, Nuten) werden nicht übernommen. */
(function(root){
'use strict';
function parse(buf){
 const u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);
 const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
 if(u8.byteLength>=84){const n=dv.getUint32(80,true);if(84+50*n===u8.byteLength&&n>0){const v=new Float32Array(n*9);for(let i=0;i<n;i++){const o=84+i*50+12;for(let j=0;j<9;j++)v[i*9+j]=dv.getFloat32(o+j*4,true)}return v}}
 const txt=new TextDecoder('latin1').decode(u8),out=[],re=/vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g;let m;
 while((m=re.exec(txt)))out.push(+m[1],+m[2],+m[3]);
 if(out.length<9||out.length%9)throw Error('Keine gültige STL-Datei.');
 return Float32Array.from(out);
}
const UNITS={mm:1,inch:25.4,m:1000};
// opts: axis 'auto'|'x'|'y'|'z', flip bool, unit 'mm'|'inch'|'m'|'fit', fitLength (für 'fit'), group 'holder'|'cutter'|'collet'|'other'
function analyze(v,opts={}){
 const n=v.length/3;if(n<3)throw Error('Zu wenig Punkte in der STL-Datei.');
 const lo=[1e30,1e30,1e30],hi=[-1e30,-1e30,-1e30];
 for(let i=0;i<n;i++)for(let a=0;a<3;a++){const x=v[i*3+a];if(!Number.isFinite(x))throw Error('Ungültige Zahl in der STL-Datei.');if(x<lo[a])lo[a]=x;if(x>hi[a])hi[a]=x}
 const ext=[0,1,2].map(a=>hi[a]-lo[a]);
 let ax=['x','y','z'].indexOf(String(opts.axis||'auto').toLowerCase());if(ax<0)ax=ext.indexOf(Math.max(...ext));
 const o1=(ax+1)%3,o2=(ax+2)%3,c1=(lo[o1]+hi[o1])/2,c2=(lo[o2]+hi[o2])/2,rawLen=ext[ax];
 if(!(rawLen>0))throw Error('Die Datei hat keine Länge.');
 let sc=UNITS[opts.unit]||1;if(opts.unit==='fit'&&opts.fitLength>0)sc=opts.fitLength/rawLen;
 const N=Math.max(24,Math.min(140,Math.ceil(rawLen*sc/0.6))),bin=rawLen/N,r=new Float64Array(N).fill(-1);
 const flip=!!opts.flip,pos=a=>flip?hi[ax]-a:a-lo[ax];
 const put=(a,b,c)=>{const s=pos(a),k=Math.max(0,Math.min(N-1,Math.floor(s/bin))),d=Math.hypot(b-c1,c-c2);if(d>r[k])r[k]=d};
 const tri=(i)=>{const P=[0,1,2].map(j=>{const o=(i*3+j)*3;return [v[o+ax],v[o+o1],v[o+o2]]});
  let e=0;for(let j=0;j<3;j++){const A=P[j],B=P[(j+1)%3];e=Math.max(e,Math.abs(A[0]-B[0]))}
  const st=Math.max(1,Math.min(14,Math.ceil(e/bin)));
  for(let a=0;a<=st;a++)for(let b=0;b<=st-a;b++){const w0=a/st,w1=b/st,w2=1-w0-w1;put(P[0][0]*w0+P[1][0]*w1+P[2][0]*w2,P[0][1]*w0+P[1][1]*w1+P[2][1]*w2,P[0][2]*w0+P[1][2]*w1+P[2][2]*w2)}};
 const T=n/3;for(let i=0;i<T;i++)tri(i);
 // Lücken füllen
 for(let i=0;i<N;i++)if(r[i]<0){let a=i-1,b=i+1;while(a>=0&&r[a]<0)a--;while(b<N&&r[b]<0)b++;r[i]=a>=0&&b<N?r[a]+(r[b]-r[a])*(i-a)/(b-a):a>=0?r[a]:b<N?r[b]:0}
 const rMax=Math.max(...r);
 let pts=[];for(let i=0;i<N;i++)pts.push([(i+0.5)*bin*sc,r[i]*sc]);
 pts.unshift([0,r[0]*sc]);pts.push([rawLen*sc,r[N-1]*sc]);
 // Messebene bei Haltern: Beginn des Flansches (erster Punkt mit fast größtem Radius)
 let ref=0;if(opts.group==='holder'){const q=pts.find(p=>p[1]>=0.9*rMax*sc);ref=q?q[0]:0}
 pts=pts.map(p=>[p[0]-ref,p[1]]);
 // vereinfachen (Douglas-Peucker)
 const dp=(a,tol)=>{if(a.length<3)return a;const A=a[0],B=a[a.length-1];let md=-1,mi=0;for(let i=1;i<a.length-1;i++){const t=(a[i][0]-A[0])/((B[0]-A[0])||1e-9),d=Math.abs(A[1]+t*(B[1]-A[1])-a[i][1]);if(d>md){md=d;mi=i}}return md>tol?dp(a.slice(0,mi+1),tol).slice(0,-1).concat(dp(a.slice(mi),tol)):[A,B]};
 pts=dp(pts,Math.max(0.03,rMax*sc*0.004)).map(p=>[Math.round(p[0]*100)/100,Math.round(p[1]*100)/100]);
 const L=pts[pts.length-1][0];
 return {pts,L,rawLength:rawLen,scale:sc,axis:'xyz'[ax],rMax:rMax*sc,triangles:T,warn:rawLen*sc>1500?'Die Datei ist sehr groß ('+Math.round(rawLen*sc)+' mm). Vielleicht stimmt die Einheit nicht: Zoll oder Meter wählen.':(rawLen*sc<2?'Die Datei ist sehr klein. Vielleicht Meter als Einheit wählen.':'')};
}
const api={parse,analyze,UNITS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncStl=api;
})(typeof window!=='undefined'?window:globalThis);
