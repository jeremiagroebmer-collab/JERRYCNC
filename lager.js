/* CNC OS Einkaufsliste, Lieferantenvergleich und QR-Etiketten. Reine Funktionen. */
(function(root){
'use strict';
const list=v=>Array.isArray(v)?v:[];
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const OPEN=['Anfrage','Bestellt','Teilgeliefert'];
const incoming=(db,m)=>list(db.purchasing).filter(p=>p.materialId===m.id&&OPEN.includes(p.status)).reduce((s,p)=>s+Math.max(0,(num(p.qty)||0)-(num(p.receivedQty)||0)),0);
// Durchschnittlicher Stückpreis je Lieferant aus bisherigen Bestellungen; der günstigste steht vorn.
function suppliers(db,m){
 const by=new Map();
 for(const p of list(db.purchasing)){if(p.materialId!==m.id||!p.supplier)continue;const q=num(p.qty),a=num(p.amount);if(!(q>0)||a===null||a<0)continue;const e=by.get(p.supplier)||{supplier:p.supplier,qty:0,amount:0,n:0};e.qty+=q;e.amount+=a;e.n++;by.set(p.supplier,e)}
 return [...by.values()].map(e=>({supplier:e.supplier,unit:e.amount/e.qty,orders:e.n})).sort((a,b)=>a.unit-b.unit);
}
// extra: [{materialId, qty, reason}] fehlendes Material aus Aufträgen
function shoppingList(db,extra=[]){
 const rows=[];
 for(const m of list(db.materials)){
  const stock=num(m.qty),min=num(m.min)||0,reasons=[];let need=0;
  if(stock!==null&&min>0&&stock<min){need+=min-stock;reasons.push('unter Mindestbestand')}
  for(const x of extra)if(x.materialId===m.id&&x.qty>0){need+=x.qty;reasons.push(x.reason)}
  if(!(need>0))continue;
  const inc=incoming(db,m);need=Math.max(0,need-inc);if(!(need>0.00005))continue;
  const s=suppliers(db,m);
  rows.push({materialId:m.id,title:m.title,number:m.number||'',unit:m.unit||'',stock,min,incoming:inc,need:Math.ceil(need*1000)/1000,reasons,best:s[0]||null,others:s.slice(1)});
 }
 return rows.sort((a,b)=>a.title.localeCompare(b.title,'de'));
}
// Legt aus einer Zeile eine Einkaufsanfrage an. Lieferant und Preis kommen aus der Bestellhistorie.
function makeRequest(db,row,today,id){
 const m=list(db.materials).find(x=>x.id===row.materialId);if(!m)throw Error('Material nicht gefunden.');
 if(list(db.purchasing).some(p=>p.materialId===m.id&&p.status==='Anfrage'&&!p.order&&p.auto))throw Error('Für dieses Material gibt es schon eine offene Anfrage.');
 const sup=row.best?list(db.suppliers).find(s=>s.title===row.best.supplier):null,lead=num(sup?.lead);
 const d=new Date(today+'T12:00:00Z');if(lead!==null&&lead>=0)d.setUTCDate(d.getUTCDate()+Math.round(lead));
 const p={id:id||('pur-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),title:m.title,supplier:row.best?.supplier||'',qty:row.need,amount:row.best?Math.round(row.best.unit*row.need*100)/100:'',due:lead!==null&&lead>=0?d.toISOString().slice(0,10):'',order:'',materialId:m.id,status:'Anfrage',auto:true};
 db.purchasing=list(db.purchasing);db.purchasing.push(p);return p;
}
// Etiketten-PDF: 3 x 8 pro A4-Seite (70 x 37 mm). items: {title, line2, url}
function labels(items,options){
 const {jsPDF,qrcode,fonts}=options,pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 if(fonts){pdf.addFileToVFS('CncRegular.ttf',fonts.regular);pdf.addFont('CncRegular.ttf','Cnc','normal');pdf.addFileToVFS('CncBold.ttf',fonts.bold);pdf.addFont('CncBold.ttf','Cnc','bold')}
 const face=fonts?'Cnc':'helvetica',W=70,H=37,per=24;
 items.forEach((it,i)=>{
  if(i&&i%per===0)pdf.addPage();
  const k=i%per,x=(k%3)*W,y=Math.floor(k/3)*H+0.5;
  pdf.setDrawColor(200,210,212);pdf.rect(x+1,y+1,W-2,H-2);
  const code=qrcode(0,'M');code.addData(it.url);code.make();const n=code.getModuleCount(),size=29,mod=size/(n+4);
  pdf.setFillColor(0,0,0);for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(code.isDark(r,c))pdf.rect(x+3+(c+2)*mod,y+4+(r+2)*mod,mod+0.015,mod+0.015,'F');
  pdf.setTextColor(36,51,58);pdf.setFont(face,'bold');pdf.setFontSize(9);pdf.text(pdf.splitTextToSize(String(it.title||'').slice(0,80),34).slice(0,4),x+35,y+9);
  pdf.setFont(face,'normal');pdf.setFontSize(7.5);pdf.text(pdf.splitTextToSize(String(it.line2||'').slice(0,60),34).slice(0,3),x+35,y+26);
 });
 return {pdf,name:'QR-Etiketten.pdf'};
}
const api={incoming,suppliers,shoppingList,makeRequest,labels};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncLager=api;
})(typeof window!=='undefined'?window:globalThis);
