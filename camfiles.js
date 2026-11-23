/* CNC OS: Dateien aus dem CAM-Ordner zuordnen und Werkzeuglisten (CSV/XML) lesen. Reine Funktionen. */
(function(root){
'use strict';
const EXT=['nc','tap','mpf','h','i','ngc','step','stp','stl','iges','igs','pdf','csv','xml','html','htm','txt','dxf','dwg','x_t','sldprt','f3d'];
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
// Dateien finden, deren Name Auftrags- oder Zeichnungsnummer enthält
function matchFiles(files,order){
 const keys=[order.number,order.partNumber].map(norm).filter(k=>k.length>=3);
 if(!keys.length)return [];
 return files.filter(f=>{const ext=String(f.name).split('.').pop().toLowerCase();if(!EXT.includes(ext))return false;const n=norm(f.name),p=norm(f.path||'');return keys.some(k=>n.includes(k)||p.includes(k))}).sort((a,b)=>String(a.path||a.name).localeCompare(String(b.path||b.name)));
}
const HEAD={no:/^(t|tool|werkzeug|wz|tnr|t-?nr|toolnumber|tool no|nr|nummer|pos)\b|^t$|tool.?(nr|no|number)|werkzeug.?(nr|nummer)/i,name:/beschreib|bezeichn|name|descr|comment|kommentar|text/i,diameter:/durchm|diam|^d$|^ø|dia\b|\bdc\b/i,length:/l(ä|ae)nge|length|\blen\b|^l$|ausspann|stickout|oal|\blc\b/i,holder:/halter|aufnahme|holder|futter|spann/i,flutes:/schneid|flute|z\b|zahn|teeth/i,note:/hinweis|note|bemerk|remark|material/i};
function splitLine(line,sep){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===sep&&!q){out.push(cur);cur=''}else cur+=c}out.push(cur);return out.map(x=>x.trim())}
function fromCsv(text){
 const lines=String(text).replace(/^﻿/,'').split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)return [];
 const sep=[';','\t',','].map(s=>[s,(lines[0].match(new RegExp(s==='\t'?'\t':'\\'+s,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const head=splitLine(lines[0],sep),col={};
 head.forEach((h,i)=>{for(const k of Object.keys(HEAD))if(col[k]===undefined&&HEAD[k].test(h.trim()))col[k]=i});
 if(col.no===undefined&&col.name===undefined)return [];
 return lines.slice(1).map(l=>{const c=splitLine(l,sep),g=k=>col[k]===undefined?'':c[col[k]]||'';return {no:g('no'),name:g('name'),diameter:g('diameter'),length:g('length'),holder:g('holder'),flutes:g('flutes'),note:g('note')}}).filter(t=>t.no||t.name);
}
function fromXml(text){
 const out=[],re=/<(?:Tool|Werkzeug|ToolItem|tool)\b([^>]*?)\/>|<(Tool|Werkzeug|ToolItem|tool)\b([^>]*)>([\s\S]*?)<\/\2>/g;let m;
 const attr=(a,names)=>{for(const n of names){const r=new RegExp('\\b'+n+'\\s*=\\s*"([^"]*)"','i').exec(a);if(r)return r[1]}return ''};
 const tag=(b,names)=>{for(const n of names){const r=new RegExp('<'+n+'[^>]*>([^<]*)</'+n+'>','i').exec(b||'');if(r)return r[1].trim()}return ''};
 const pick=(a,b,names)=>attr(a,names)||tag(b,names);
 while((m=re.exec(text))){const a=m[1]||m[3]||'',b=m[4]||'';
  const t={no:pick(a,b,['number','nr','id','tool_number','toolNumber','T']),name:pick(a,b,['description','name','bezeichnung','comment']),diameter:pick(a,b,['diameter','durchmesser','dc','D']),length:pick(a,b,['length','laenge','länge','oal','lc','L']),holder:pick(a,b,['holder','halter']),flutes:pick(a,b,['flutes','nof','schneiden','z']),note:pick(a,b,['note','hinweis','comment'])};
  if(t.no||t.name)out.push(t)}
 return out;
}
// Fusion-Werkzeugbibliothek (JSON): nach Beschreibung des Formats, noch nicht mit einer echten Datei geprüft
function fromJson(text){let j;try{j=JSON.parse(text)}catch{return []}const arr=Array.isArray(j)?j:Array.isArray(j.data)?j.data:Array.isArray(j.tools)?j.tools:[];const v=x=>x===undefined||x===null?'':String(x);return arr.filter(t=>t&&typeof t==='object').map(t=>{const g=t.geometry||{},pp=t['post-process']||{};return {no:v(pp.number??t.number??t.tool_number),name:v(t.description||t.name),diameter:v(g.DC??t.diameter),length:v(g.OAL??g.LB??t.length),flutes:v(g.NOF),holder:v(t.holder&&(t.holder.description||t.holder.name)),note:v(t.type)}}).filter(t=>t.no||t.name)}
function parseToolList(text,fileName=''){
 const raw=String(text||'');
 const isXml=/\.xml$/i.test(fileName)||/^\s*<\?xml|^\s*<[a-z]/i.test(raw);
 const isJson=/\.(json|tools)$/i.test(fileName)||/^\s*[\[{]/.test(raw);const tools=isJson?fromJson(raw):isXml?fromXml(raw):fromCsv(raw);
 return tools.slice(0,500);
}
function sheetModel(profile,order,tools,today){return {profile,order,tools,today}}
// Werkzeugblatt-PDF im Stil der übrigen Dokumente
function renderToolSheet(m,options){
 const {jsPDF,fonts}=options,pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 if(fonts){pdf.addFileToVFS('CncRegular.ttf',fonts.regular);pdf.addFont('CncRegular.ttf','Cnc','normal');pdf.addFileToVFS('CncBold.ttf',fonts.bold);pdf.addFont('CncBold.ttf','Cnc','bold')}
 const face=fonts?'Cnc':'helvetica',clean=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[‐-―]/g,'-'),font=(sz=9,bold=false,c=[36,51,58])=>{pdf.setFont(face,bold?'bold':'normal');pdf.setFontSize(sz);pdf.setTextColor(...c)};
 const o=m.order||{},p=m.profile||{};let y=0;
 const head=first=>{pdf.setFillColor(22,108,101);pdf.rect(0,0,210,4,'F');y=15;font(16,true);pdf.text(clean(p.appName||'CNC OS'),15,y);y+=7;font(10,true);pdf.text(clean(p.company||''),15,y);y+=9;font(19,true,[22,108,101]);pdf.text('Werkzeugblatt',15,y);y+=8;
  if(first){font(11,true);pdf.text(clean((o.number?o.number+' · ':'')+(o.title||'')),15,y);y+=6;font(9,false,[86,101,111]);pdf.text(clean(['Kunde: '+(o.customer||'-'),'Zeichnung: '+(o.partNumber||'-'),'Stand: '+(m.today||'')].join('   ·   ')),15,y);y+=7}
  pdf.setDrawColor(214,225,226);pdf.line(15,y,195,y);y+=7};
 const cols=[15,29,92,112,132,160],th=()=>{pdf.setFillColor(237,244,244);pdf.rect(15,y-4,180,6,'F');font(8,true);['T-Nr.','Bezeichnung','Ø mm','Länge mm','Halter','Hinweis'].forEach((t,i)=>pdf.text(t,cols[i],y));y+=6};
 head(true);th();
 if(!m.tools.length){font(10);pdf.text('Keine Werkzeuge gefunden.',15,y)}
 for(const t of m.tools){const name=pdf.splitTextToSize(clean(t.name||'-'),60),note=pdf.splitTextToSize(clean(t.note||''),34),h=Math.max(name.length,note.length,1)*4.4+2;if(y+h>274){pdf.addPage();head(false);th()}
  font(9,true);pdf.text(clean(t.no||'-'),cols[0],y);font(9);pdf.text(name,cols[1],y);pdf.text(clean(t.diameter||''),cols[2],y);pdf.text(clean(t.length||''),cols[3],y);pdf.text(clean(t.holder||'').slice(0,16),cols[4],y);pdf.text(note,cols[5],y);y+=h;pdf.setDrawColor(230,236,237);pdf.line(15,y-3,195,y-3)}
 font(7,false,[86,101,111]);const n=pdf.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.text('Aus der CAM-Werkzeugliste übernommen. Vor Einsatz am Werkzeug prüfen. Seite '+i+' von '+n,15,288)}
 pdf.setProperties({title:'Werkzeugblatt '+(o.number||''),author:p.company||'',creator:'CNC OS'});
 return {pdf,name:('Werkzeugblatt_'+(o.number||'Auftrag')).replace(/[^A-Za-z0-9._-]+/g,'_')+'.pdf'};
}
const api={EXT,matchFiles,parseToolList,sheetModel,renderToolSheet};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncCam=api;
})(typeof window!=='undefined'?window:globalThis);
