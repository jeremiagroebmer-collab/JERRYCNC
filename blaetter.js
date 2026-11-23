/* CNC OS Werkstattblätter: Rüstblatt, Messprotokoll, Angebot kopieren, Reststück, Lagerplatz-Codes. */
(function(root){
'use strict';
const list=v=>Array.isArray(v)?v:[];
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const dateDE=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v).slice(8,10)+'.'+String(v).slice(5,7)+'.'+String(v).slice(0,4):'';
const clean=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[‐-―]/g,'-').replace(/€/g,'EUR');
const forOrder=(rows,o)=>list(rows).filter(r=>(r.orderId&&r.orderId===o.id)||(r.order&&r.order===o.number));

function sheetModel(db,o,kind,today){
 const company=String(list(db.settings).find(s=>s&&s.documentProfile)?.documentProfile?.company||'').trim();
 const steps=forOrder(db.planning,o).slice().sort((a,b)=>(num(a.sequence)||0)-(num(b.sequence)||0)||String(a.date||'').localeCompare(String(b.date||'')));
 const programs=list(db.cam).filter(p=>p.order===o.number||(!p.order&&p.partNumber&&p.partNumber===o.partNumber));
 const checks=forOrder(db.quality,o);
 return {kind,company,today,order:o,steps,programs,checks,
  title:kind==='mess'?'Messprotokoll':'Rüstblatt',
  name:(kind==='mess'?'Messprotokoll-':'Ruestblatt-')+String(o.number||'Auftrag').replace(/[^\w.-]+/g,'-')+'.pdf'};
}

function render(m,options){
 const {jsPDF,fonts}=options,pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 if(fonts){pdf.addFileToVFS('CncRegular.ttf',fonts.regular);pdf.addFont('CncRegular.ttf','Cnc','normal');pdf.addFileToVFS('CncBold.ttf',fonts.bold);pdf.addFont('CncBold.ttf','Cnc','bold')}
 const face=fonts?'Cnc':'helvetica';
 const font=(size=10,bold=false,color=[36,51,58])=>{pdf.setFont(face,bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
 const wrap=(s,w,size=10,bold=false)=>{font(size,bold);return pdf.splitTextToSize(clean(s),w)};
 const o=m.order;let y=18;
 pdf.setFillColor(22,108,101);pdf.rect(0,0,210,4,'F');
 font(15,true);pdf.text(clean(m.company||'Firma'),15,y);
 font(17,true,[22,108,101]);pdf.text(clean(m.title)+'  '+clean(o.number||''),195,y,{align:'right'});y+=9;
 font(9,false,[86,101,111]);pdf.text('Stand '+dateDE(m.today),195,y-3,{align:'right'});
 const meta=[['Bezeichnung',o.title],['Kunde',o.customer],['Zeichnung',[o.partNumber,o.revision?'Rev. '+o.revision:''].filter(Boolean).join(' ')],['Stückzahl',o.qty!==undefined&&o.qty!==''?String(o.qty):''],['Termin',dateDE(o.due||o.dueDate)],['Maschine',o.machine],['Material',o.material]];
 pdf.setFillColor(237,244,244);
 const shown=meta.filter(r=>r[1]);const rows=Math.ceil(shown.length/2);pdf.rect(15,y,180,rows*10+4,'F');
 shown.forEach(([k,v],i)=>{const cx=18+(i%2)*90,cy=y+6+Math.floor(i/2)*10;font(7,false,[86,101,111]);pdf.text(clean(k).toUpperCase(),cx,cy-1.5);font(10,true);pdf.text(wrap(v,84,10,true).slice(0,1),cx,cy+3)});
 y+=rows*10+10;
 const need=h=>{if(y+h>272){pdf.addPage();y=20}};
 const head=t=>{need(14);font(11,true,[22,108,101]);pdf.text(clean(t),15,y);y+=5};
 const hline=()=>{pdf.setDrawColor(200,210,212);pdf.line(15,y,195,y)};
 if(m.kind==='mess'){
  head('Prüfungen im System');
  if(!m.checks.length){font(9,false,[86,101,111]);pdf.text('Noch keine Prüfung angelegt.',15,y+3);y+=9}
  for(const c of m.checks){need(8);font(9,true);pdf.text(clean([c.number,c.title].filter(Boolean).join('  ')).slice(0,70),15,y+3);font(9);pdf.text(clean([c.result,c.status].filter(Boolean).join(' · ')).slice(0,40),195,y+3,{align:'right'});y+=6;hline()}
  y+=4;head('Messwerte (von Hand ausfüllen)');
  const cols=[['Merkmal',15],['Soll',75],['Tol.',100],['Ist 1',118],['Ist 2',137],['Ist 3',156],['i.O.',178]];
  pdf.setFillColor(237,244,244);pdf.rect(15,y-3.5,180,6.5,'F');font(8,true,[86,101,111]);for(const [t,x] of cols)pdf.text(t,x+1,y+1);y+=5;
  const free=Math.max(8,Math.floor((272-y)/8));
  for(let i=0;i<free;i++){if(y+8>272)break;pdf.setDrawColor(200,210,212);pdf.rect(15,y,180,8);for(const [,x] of cols.slice(1))pdf.line(x,y,x,y+8);y+=8}
  y+=6;font(8,false,[86,101,111]);pdf.text('Prüfer / Datum: ______________________    Messmittel: ______________________',15,Math.min(y,285));
 }else{
  head('Arbeitsgänge');
  if(!m.steps.length){font(9,false,[86,101,111]);pdf.text('Noch keine Arbeitsgänge geplant.',15,y+3);y+=9}
  else{
   pdf.setFillColor(237,244,244);pdf.rect(15,y-3.5,180,6.5,'F');font(8,true,[86,101,111]);[['Nr.',16],['Arbeitsgang',34],['Maschine',110],['Rüsten',150],['Je Stück',172]].forEach(([t,x])=>pdf.text(t,x,y+1));y+=6;
   m.steps.forEach((s,i)=>{const t=wrap(s.title||'',72,9);need(Math.max(7,t.length*4.2+2)+(s.notes?5:0));font(9);pdf.text(String(i+1),16,y+2);pdf.text(t,34,y+2);pdf.text(clean(s.machine||'').slice(0,22),110,y+2);pdf.text(num(s.setupMin)!==null?s.setupMin+' min':'',150,y+2);pdf.text(num(s.runMin)!==null?s.runMin+' min':'',172,y+2);y+=Math.max(7,t.length*4.2+2);
    if(s.notes){font(8,false,[86,101,111]);const n=wrap('Hinweis: '+s.notes,160,8);pdf.text(n.slice(0,3),34,y);y+=Math.min(3,n.length)*3.6+1}hline();y+=1.5});
  }
  y+=4;head('NC-Programme');
  if(!m.programs.length){font(9,false,[86,101,111]);pdf.text('Noch kein Programm zugeordnet.',15,y+3);y+=9}
  for(const p of m.programs){need(7);font(9,true);pdf.text(clean(p.number||'').slice(0,20),16,y+3);font(9);pdf.text(clean([p.title,p.machine,p.version?'V'+p.version:''].filter(Boolean).join(' · ')).slice(0,95),50,y+3);y+=6;hline()}
  y+=4;head('Beim Rüsten');
  for(const t of ['Nullpunkt gesetzt und geprüft','Werkzeuge vermessen und eingetragen','Spannmittel und Rohteil geprüft','Erstteil gemessen und freigegeben']){need(7);pdf.setDrawColor(86,101,111);pdf.rect(16,y-0.5,4,4);font(9);pdf.text(t,23,y+3);y+=6.5}
  y+=3;font(8,false,[86,101,111]);need(8);pdf.text('Gerüstet von / Datum: ______________________',15,y+3);
 }
 return {pdf,name:m.name};
}

// Angebot kopieren: nur Kopf- und Kalkulationsfelder, nichts aus der Abwicklung.
const DROP=['id','number','status','history','offerSnapshot','acceptedAt','productionReleased','reservations','documents','photo','photos','createdAt','updatedAt','workflowVersion','due','dueDate','deliveredAt','demo'];
function copyOrder(db,o,id,number){
 const c=JSON.parse(JSON.stringify(o));for(const k of DROP)delete c[k];
 c.id=id;c.number=number;c.status='Anfrage';c.title=String(o.title||'Auftrag')+' (Kopie)';
 return c;
}

// Reststück: neuer Lagerartikel mit Verweis auf das Ursprungsmaterial.
function remnant(db,m,{dimensions,qty,location},id,number){
 const q=num(qty);if(!(q>0))throw Error('Bitte die Menge des Reststücks eintragen.');
 const r={id,number,title:String(m.title||'Material')+' (Rest)',grade:m.grade||'',dimensions:String(dimensions||'').trim(),qty:q,min:0,cost:num(m.cost)||0,unit:m.unit||'Stück',location:String(location||m.location||'').trim(),notes:'Reststück aus '+(m.number||m.title),remnantOf:m.id};
 for(const k of ['materialGroup','materialCategory'])if(m[k])r[k]=m[k];
 return r;
}
const nextRemnantNumber=(db,m)=>{const base=String(m.number||'MAT')+'-R',n=list(db.materials).filter(x=>String(x.number||'').startsWith(base)).length+1;return base+n};

// Lagerplatz-Codes: Adresse "#loc=NAME"; Etiketten pro Platz.
const locCode=name=>'#loc='+encodeURIComponent(String(name||'').trim());
function locFromCode(raw){const t=String(raw||'').trim();const i=t.indexOf('#loc=');if(i<0||t.length>4096)return null;try{const v=decodeURIComponent(t.slice(i+5)).trim();return v||null}catch{return null}}
function locations(db){const seen=new Map();for(const m of list(db.materials)){const l=String(m.location||'').trim();if(!l||/^noch nicht erfasst$/i.test(l))continue;const k=l.toLowerCase(),e=seen.get(k)||{name:l,count:0};e.count++;seen.set(k,e)}return [...seen.values()].sort((a,b)=>a.name.localeCompare(b.name,'de'))}
function atLocation(db,name){const n=String(name||'').trim().toLowerCase();return list(db.materials).filter(m=>String(m.location||'').trim().toLowerCase()===n)}

const api={sheetModel,render,copyOrder,remnant,nextRemnantNumber,locCode,locFromCode,locations,atLocation};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncBlaetter=api;
})(typeof window!=='undefined'?window:globalThis);
