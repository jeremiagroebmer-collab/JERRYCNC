/* CNC OS Geschäftsbelege: Angebot, Auftragsbestätigung, Lieferschein, Rechnung, Mahnung. Reine Modelle + PDF-Ausgabe. */
(function(root){
'use strict';
const list=v=>Array.isArray(v)?v:[];
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const r2=n=>Math.round(n*100+1e-9)/100;
const eur=n=>(n<0?'-':'')+Math.abs(n).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' EUR';
const dateDE=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v).slice(8,10)+'.'+String(v).slice(5,7)+'.'+String(v).slice(0,4):'';
function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function diffDays(a,b){return Math.round((new Date(a+'T12:00:00Z')-new Date(b+'T12:00:00Z'))/864e5)}
const kinds={angebot:'Angebot',bestaetigung:'Auftragsbestätigung',lieferschein:'Lieferschein',rechnung:'Rechnung',mahnung:'Mahnung'};

function profile(db){
 const p={company:'',contact:'',taxId:'',iban:'',bank:'',payDays:'14',smallBiz:'Nein',skontoPct:'0',skontoDays:'7',vatStd:'19',...list(db.settings).find(x=>x.id==='cncos-document-profile')?.documentProfile};
 if(p.company==='Eigene Firma noch nicht eingetragen')p.company='';
 const d=Math.round(Number(p.payDays));p.payDays=Number.isFinite(d)&&d>=0&&d<=365?d:14;const sp=Number(String(p.skontoPct).replace(',','.')),sd=Math.round(Number(p.skontoDays));p.skontoPct=Number.isFinite(sp)&&sp>0&&sp<=20?sp:0;p.skontoDays=Number.isFinite(sd)&&sd>0&&sd<=90?sd:7;
 return p;
}
// Pflichtangaben einer Rechnung; fehlt etwas, fragt die App einmal danach.
function missing(db){const p=profile(db),m=[];if(!p.company.trim())m.push('Firmenname');if(!String(p.contact||'').trim())m.push('Adresse');if(!String(p.taxId||'').trim())m.push('Steuernummer oder USt-IdNr');if(!String(p.iban||'').trim())m.push('IBAN');return m}
function customer(db,o){
 const name=String(o.customer||'').trim();
 const c=list(db.customers).find(x=>name&&String(x.title||'').trim().toLowerCase()===name.toLowerCase());
 return {name:c?.title||name,address:String(c?.address||'').trim(),number:c?.number||'',email:c?.email||'',known:!!c};
}
function positions(o){
 const s=o.offerSnapshot;
 const qty=num(s?s.qty:o.qty),unitRaw=num(s?s.price:o.price);
 if(!(qty>0)||unitRaw===null||unitRaw<0)return [];
 const total=s&&num(s.revenue)!==null?r2(num(s.revenue)):r2(qty*unitRaw);
 const unit=r2(total/qty);
 const title=[o.title,o.partNumber?('Zeichnung '+o.partNumber+(o.revision?' Rev. '+o.revision:'')):''].filter(Boolean).join(' · ')||'Fertigungsauftrag '+o.number;
 return [{pos:1,title,qty,unit:'Stk',price:unit,total}];
}
const vatRate=p=>{if(String(p.smallBiz)==='Ja')return 0;const v=Number(p.vatStd);return Number.isFinite(v)&&v>=0&&v<=30?v:19};
const isInvoice=f=>f&&f.docKind==='Rechnung'&&f.type==='Einnahme';
const invoicesFor=(db,o)=>list(db.finance).filter(f=>isInvoice(f)&&f.invoiceFor===o.id&&f.status!=='Storniert');
const deposits=(db,o)=>invoicesFor(db,o).filter(f=>f.deposit);
const finalInvoice=(db,o)=>invoicesFor(db,o).find(f=>!f.deposit);
function nextInvoiceNumber(db,today){
 const y=today.slice(0,4),re=new RegExp('^RE-'+y+'-(\\d+)$');
 const n=list(db.finance).reduce((m,f)=>{const x=re.exec(String(f.number||''));return x?Math.max(m,Number(x[1])):m},0);
 return 'RE-'+y+'-'+String(n+1).padStart(3,'0');
}
// Legt die Rechnung als Einnahme in den Finanzen an. Fällig am Zahlungsziel; die Vorschau rechnet damit.
function createInvoice(db,o,today,id,opts={}){
 const p=profile(db),pos=positions(o);
 if(!pos.length)throw Error('Stückzahl und Preis im Auftrag fehlen. Zuerst kalkulieren oder den Preis eintragen.');
 if(finalInvoice(db,o))throw Error('Für diesen Auftrag gibt es schon eine Rechnung.');
 const total=r2(pos.reduce((s,x)=>s+x.total,0)),due=addDays(today,p.payDays),deps=deposits(db,o);
 let net=total,extra={},title='Rechnung '+(o.number||'')+' · '+(o.customer||'ohne Kunde');
 if(opts.deposit){const pct=Number(opts.deposit);if(!(pct>0&&pct<=90))throw Error('Anzahlung zwischen 1 und 90 Prozent wählen.');net=r2(total*pct/100);extra={deposit:true,depositPct:pct};title='Anzahlung '+pct+' % · '+(o.number||'')+' · '+(o.customer||'ohne Kunde')}
 else if(deps.length){const paid=r2(deps.reduce((s,d)=>s+Number(d.amount),0));net=r2(total-paid);if(net<0)throw Error('Die Anzahlungen sind höher als der Auftragswert.');extra={fullNet:total,deductions:deps.map(d=>({number:d.number,net:Number(d.amount)}))}}
 if(p.skontoPct>0&&!opts.deposit){extra.skontoPct=p.skontoPct;extra.skontoUntil=addDays(today,p.skontoDays)}
 const f={id:id||('fin-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),number:nextInvoiceNumber(db,today),title,type:'Einnahme',amount:net,date:due,status:'Offen',category:'Rechnung',vat:String(vatRate(p)),repeat:'Einmalig',docKind:'Rechnung',invoiceFor:o.id,invoiceDate:today,order:o.number||'',...extra};
 db.finance=list(db.finance);db.finance.push(f);return f;
}
function markPaid(db,f,today){if(!isInvoice(f))throw Error('Keine Rechnung.');f.status='Bezahlt';f.dueDate=f.dueDate||f.date;f.date=today;f.paidAt=today;
 const o=list(db.orders).find(x=>x.id===f.invoiceFor);if(o&&o.status==='Ausgeliefert')o.status='Bezahlt';return f}
// Mahnstufe nach Tagen über Fälligkeit: 0 nicht fällig, 1 Erinnerung, 2 erste Mahnung, 3 letzte Mahnung
function reminderLevel(f,today){if(!f||f.status==='Bezahlt')return 0;const due=f.dueDate||f.date;if(!due)return 0;const d=diffDays(today,due);return d<=0?0:d<=14?1:d<=28?2:3}
const levelName=['','Zahlungserinnerung','1. Mahnung','2. Mahnung (letzte)'];
function overdueInvoices(db,today){return list(db.finance).filter(f=>isInvoice(f)&&reminderLevel(f,today)>0)}

function model(db,kind,orderId,opts={}){
 if(!kinds[kind])throw Error('Unbekannter Beleg.');
 const today=opts.today||new Date().toISOString().slice(0,10);
 const o=list(db.orders).find(x=>x.id===orderId);if(!o)throw Error('Auftrag nicht gefunden.');
 const p=profile(db),cu=customer(db,o),pos=positions(o),rate=vatRate(p);
 if(!pos.length)throw Error('Stückzahl und Preis im Auftrag fehlen. Zuerst kalkulieren oder den Preis eintragen.');
 let net=r2(pos.reduce((s,x)=>s+x.total,0)),vat=r2(net*rate/100),gross=r2(net+vat);
 const m={kind,title:kinds[kind],profile:p,customer:cu,order:o,positions:pos,rate,net,vat,gross,date:today,number:'',intro:'',outro:[],meta:[],showPrices:true};
 const lieferung=o.due?dateDE(o.due):'nach Absprache';
 if(kind==='angebot'){m.number='AN-'+(o.number||o.id);m.intro='vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen wie folgt an:';m.outro=['Dieses Angebot gilt bis '+dateDE(addDays(today,30))+'.','Voraussichtlicher Liefertermin: '+lieferung+'.','Zahlungsziel: '+p.payDays+' Tage netto.'];m.meta=[['Angebot Nr.',m.number],['Datum',dateDE(today)],['Gültig bis',dateDE(addDays(today,30))]]}
 if(kind==='bestaetigung'){m.number='AB-'+(o.number||o.id);m.intro='vielen Dank für Ihren Auftrag. Wir bestätigen ihn wie folgt:';m.outro=['Liefertermin: '+lieferung+'.','Zahlungsziel: '+p.payDays+' Tage netto.'];m.meta=[['Auftragsbestätigung Nr.',m.number],['Datum',dateDE(today)],['Liefertermin',lieferung]]}
 if(kind==='lieferschein'){m.number='LS-'+(o.number||o.id);m.showPrices=false;m.intro='wir liefern Ihnen folgende Ware:';m.outro=['Bitte prüfen Sie die Lieferung sofort auf Menge und Schäden und melden Sie Abweichungen umgehend.'];m.meta=[['Lieferschein Nr.',m.number],['Lieferdatum',dateDE(today)]]}
 if(kind==='rechnung'||kind==='mahnung'){
  const all=invoicesFor(db,o),f=(opts.invoiceId&&all.find(x=>x.id===opts.invoiceId))||(kind==='mahnung'?(all.find(x=>reminderLevel(x,today)>0)||all[0]):(finalInvoice(db,o)||all[0]));
  if(!f){if(kind==='mahnung')throw Error('Für diesen Auftrag gibt es noch keine Rechnung.');}
  if(f){m.rate=Number(f.vat)||0;m.net=r2(Number(f.amount));m.vat=r2(m.net*m.rate/100);m.gross=r2(m.net+m.vat);if(f.deposit){const q=1;m.positions=[{pos:1,title:'Anzahlung '+f.depositPct+' % auf Auftrag '+(o.number||'')+' ('+(o.title||'')+')',qty:q,unit:'psch.',price:m.net,total:m.net}];m.title='Anzahlungsrechnung'}else if(f.deductions){m.fullNet=Number(f.fullNet);m.deductions=f.deductions}else if(m.positions.length===1&&r2(m.positions[0].total)!==m.net){const q=m.positions[0].qty;m.positions=[{...m.positions[0],total:m.net,price:r2(m.net/q)}]}}
  const invNo=f?f.number:opts.number||nextInvoiceNumber(db,today),invDate=f?.invoiceDate||today,due=f?(f.dueDate||f.date):addDays(today,p.payDays);
  if(kind==='rechnung'){
   m.number=invNo;m.date=invDate;m.dueDate=due;m.intro=f?.deposit?'für den oben genannten Auftrag berechnen wir Ihnen folgende Anzahlung:':'für die erbrachte Lieferung berechnen wir Ihnen:';
   m.outro=['Bitte überweisen Sie den Betrag bis '+dateDE(due)+' unter Angabe der Rechnungsnummer '+invNo+'.'];
   if(f?.skontoPct>0&&f.skontoUntil)m.outro.push('Bei Zahlung bis '+dateDE(f.skontoUntil)+' gewähren wir '+String(f.skontoPct).replace('.',',')+' % Skonto. Zahlbetrag dann: '+eur(r2(m.gross*(1-f.skontoPct/100)))+'.');
   if(m.rate===0)m.outro.push('Keine Umsatzsteuer ausgewiesen (Kleinunternehmerregelung).');
   if(!f?.deposit)m.outro.push('Das Lieferdatum entspricht dem Rechnungsdatum, sofern nicht anders angegeben.');
   m.meta=[['Rechnung Nr.',invNo],['Rechnungsdatum',dateDE(invDate)],['Fällig am',dateDE(due)]];
  }else{
   const lv=Math.min(3,Math.max(1,Number(opts.level)||reminderLevel(f,today)||1));
   m.level=lv;m.title=levelName[lv];m.number='MA-'+invNo+'-'+lv;m.showPrices=false;m.positions=[];
   const open=m.gross;m.open=open;
   const newDue=addDays(today,lv===3?5:7);m.dueDate=newDue;
   m.intro=lv===1?'zu unserer Rechnung '+invNo+' vom '+dateDE(invDate)+' konnten wir noch keinen Zahlungseingang feststellen. Möglicherweise hat sich Ihre Zahlung mit diesem Schreiben überschnitten oder ist Ihrer Aufmerksamkeit entgangen.'
    :lv===2?'trotz unserer Zahlungserinnerung konnten wir zu unserer Rechnung '+invNo+' vom '+dateDE(invDate)+' noch keinen Zahlungseingang feststellen.'
    :'unsere Rechnung '+invNo+' vom '+dateDE(invDate)+' ist trotz Erinnerung und Mahnung weiterhin offen.';
   m.outro=['Offener Betrag: '+eur(open)+' (ursprünglich fällig am '+dateDE(due)+').','Bitte überweisen Sie den Betrag bis '+dateDE(newDue)+'.'];
   if(lv===3)m.outro.push('Sollte bis dahin keine Zahlung eingehen, behalten wir uns weitere Schritte vor.');
   m.outro.push('Falls Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.');
   m.meta=[['Mahnung zu Rechnung',invNo],['Datum',dateDE(today)],['Neue Frist',dateDE(newDue)]];
  }
 }
 if(cu.number)m.meta.push(['Kunden-Nr.',cu.number]);
 m.meta.push(['Auftrag',o.number||'']);
 m.warnings=[];if(!cu.address)m.warnings.push('Kundenadresse fehlt (beim Kunden eintragen).');
 return m;
}

function render(m,options){
 const {jsPDF,fonts}=options;
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 if(fonts){pdf.addFileToVFS('CncRegular.ttf',fonts.regular);pdf.addFont('CncRegular.ttf','Cnc','normal');pdf.addFileToVFS('CncBold.ttf',fonts.bold);pdf.addFont('CncBold.ttf','Cnc','bold')}
 const face=fonts?'Cnc':'helvetica',clean=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[‐-―]/g,'-').replace(/€/g,'EUR');
 const font=(size=10,bold=false,color=[36,51,58])=>{pdf.setFont(face,bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
 const wrap=(s,w,size=10,bold=false)=>{font(size,bold);return pdf.splitTextToSize(clean(s),w)};
 const p=m.profile;let y=18;
 pdf.setFillColor(22,108,101);pdf.rect(0,0,210,4,'F');
 font(15,true);pdf.text(clean(p.company||'Firma'),15,y);y+=6;
 font(8,false,[86,101,111]);const own=wrap(p.contact||'',90,8);pdf.text(own,15,y);
 // Absenderzeile + Empfänger
 let ry=54;font(7,false,[86,101,111]);pdf.text(clean([p.company,String(p.contact||'').split('\n').join(' · ')].join(' · ')).slice(0,95),15,ry-7);
 font(11,true);pdf.text(wrap(m.customer.name||'Kunde',85,11,true),15,ry);ry+=wrap(m.customer.name||'Kunde',85,11,true).length*5;
 font(10);const adr=wrap(m.customer.address||'(Adresse fehlt)',85,10);pdf.text(adr,15,ry);
 // Kennzahlen rechts
 let my=52;for(const [k,v] of m.meta){font(7,false,[86,101,111]);pdf.text(clean(k).toUpperCase(),120,my-2);font(10,true);pdf.text(clean(v),120,my+2.5);my+=9}
 y=Math.max(ry+adr.length*5,my)+10;
 font(17,true,[22,108,101]);pdf.text(clean(m.title)+' '+clean(m.number),15,y);y+=9;
 font(10);const intro=wrap('Sehr geehrte Damen und Herren,\n\n'+m.intro,180,10);pdf.text(intro,15,y);y+=intro.length*5+4;
 const need=h=>{if(y+h>262){pdf.addPage();y=20}};
 if(m.positions.length){
  const cols=m.showPrices?{pos:15,txt:24,qty:135,price:165,tot:195}:{pos:15,txt:24,qty:170,price:0,tot:0};
  pdf.setFillColor(237,244,244);pdf.rect(15,y-4,180,7,'F');font(8,true);
  pdf.text('Pos',cols.pos+1,y);pdf.text('Bezeichnung',cols.txt,y);
  if(m.showPrices){pdf.text('Menge',cols.qty,y,{align:'right'});pdf.text('Einzelpreis',cols.price,y,{align:'right'});pdf.text('Gesamt',cols.tot,y,{align:'right'})}else pdf.text('Menge',cols.qty,y,{align:'right'});
  y+=7;
  for(const r of m.positions){const t=wrap(r.title,m.showPrices?88:140,10);need(t.length*5+3);font(10);pdf.text(String(r.pos),cols.pos+1,y);pdf.text(t,cols.txt,y);
   if(m.showPrices){pdf.text(String(r.qty).replace('.',',')+' '+r.unit,cols.qty,y,{align:'right'});pdf.text(eur(r.price),cols.price,y,{align:'right'});pdf.text(eur(r.total),cols.tot,y,{align:'right'})}else pdf.text(String(r.qty).replace('.',',')+' '+r.unit,cols.qty,y,{align:'right'});
   y+=t.length*5+2;pdf.setDrawColor(214,225,226);pdf.line(15,y-1,195,y-1);y+=3}
  if(m.showPrices){need(26+(m.deductions?6*(m.deductions.length+1):0));font(10);if(m.deductions){pdf.text('Summe netto',150,y,{align:'right'});pdf.text(eur(m.fullNet),195,y,{align:'right'});y+=6;for(const d of m.deductions){pdf.text('abzgl. Anzahlung '+clean(d.number),150,y,{align:'right'});pdf.text(eur(-d.net),195,y,{align:'right'});y+=6}pdf.text('Noch zu zahlen netto',150,y,{align:'right'});pdf.text(eur(m.net),195,y,{align:'right'});y+=6}else{pdf.text('Summe netto',150,y,{align:'right'});pdf.text(eur(m.net),195,y,{align:'right'});y+=6}
   pdf.text(m.rate?'Umsatzsteuer '+m.rate+' %':'Umsatzsteuer',150,y,{align:'right'});pdf.text(eur(m.vat),195,y,{align:'right'});y+=6;
   font(11,true);pdf.text('Gesamtbetrag',150,y,{align:'right'});pdf.text(eur(m.gross),195,y,{align:'right'});y+=10}
 }
 for(const line of m.outro){const t=wrap(line,180,10);need(t.length*5+2);font(10);pdf.text(t,15,y);y+=t.length*5+2}
 need(14);font(10);pdf.text('Mit freundlichen Grüßen',15,y+4);pdf.text(clean(p.company),15,y+10);
 // Fußzeile
 const foot=[];if(p.taxId)foot.push('Steuernr./USt-IdNr.: '+p.taxId);if(p.iban)foot.push('IBAN: '+p.iban+(p.bank?' · '+p.bank:''));
 font(8,false,[86,101,111]);const pages=pdf.getNumberOfPages();
 for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setDrawColor(214,225,226);pdf.line(15,278,195,278);pdf.text(clean(foot.join('   ·   ')),15,283);pdf.text('Seite '+i+' von '+pages,195,283,{align:'right'})}
 pdf.setProperties({title:m.title+' '+m.number,author:p.company,creator:'CNC OS'});
 return {pdf,name:(m.title+'_'+m.number).replace(/[^A-Za-z0-9ÄÖÜäöüß._-]+/g,'_').slice(0,120)+'.pdf'};
}
// Monatsübersicht-PDF: lines aus CncFirma.monthLines, open = offene Rechnungen
function monthReport(lines,p,key,open,options){
 const {jsPDF,fonts}=options,pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 if(fonts){pdf.addFileToVFS('CncRegular.ttf',fonts.regular);pdf.addFont('CncRegular.ttf','Cnc','normal');pdf.addFileToVFS('CncBold.ttf',fonts.bold);pdf.addFont('CncBold.ttf','Cnc','bold')}
 const face=fonts?'Cnc':'helvetica',clean=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[\u2010-\u2015]/g,'-'),font=(sz=9,bold=false,c=[36,51,58])=>{pdf.setFont(face,bold?'bold':'normal');pdf.setFontSize(sz);pdf.setTextColor(...c)};
 let y=18;const head=()=>{pdf.setFillColor(22,108,101);pdf.rect(0,0,210,4,'F');font(14,true);pdf.text(clean(p.company||'Firma'),15,y);y+=7;font(12,true,[22,108,101]);const mn=new Date(key+'-15T12:00:00Z').toLocaleDateString('de-DE',{month:'long',year:'numeric',timeZone:'UTC'});pdf.text('Monatsübersicht '+mn,15,y);y+=8};
 head();
 const cols=[15,33,100,135,157,178];const th=()=>{pdf.setFillColor(237,244,244);pdf.rect(15,y-4,180,6,'F');font(8,true);['Datum','Text','Art','Netto','USt','Brutto'].forEach((t,i)=>pdf.text(t,i>=3?cols[i]+16:cols[i],y,i>=3?{align:'right'}:undefined));y+=6};
 const nextPage=()=>{pdf.addPage();y=18;head();th()};
 th();let inN=0,inV=0,outN=0,outV=0;
 for(const l of lines){if(y>272)nextPage();font(8);pdf.text(dateDE(l.date).slice(0,6)+l.date.slice(2,4),cols[0],y);pdf.text(clean((l.number?l.number+' ':'')+l.title).slice(0,48),cols[1],y);pdf.text(l.type==='Einnahme'?'Einnahme':'Ausgabe',cols[2],y);const sg=l.type==='Einnahme'?1:-1;pdf.text(eur(sg*l.net),cols[3]+16,y,{align:'right'});pdf.text(eur(sg*l.vat),cols[4]+16,y,{align:'right'});pdf.text(eur(sg*l.gross),cols[5]+16,y,{align:'right'});y+=5;
  if(l.type==='Einnahme'){inN+=l.net;inV+=l.vat}else{outN+=l.net;outV+=l.vat}}
 if(!lines.length){font(9);pdf.text('Keine Buchungen in diesem Monat.',15,y);y+=6}
 if(y>245)nextPage();y+=8;pdf.setDrawColor(214,225,226);pdf.line(15,y-5,195,y-5);font(9,true);
 const row=(t,v)=>{pdf.text(t,15,y);pdf.text(eur(v),195,y,{align:'right'});y+=6};
 row('Einnahmen netto',r2(inN));row('Ausgaben netto',r2(outN));row('Ergebnis netto (Gewinn)',r2(inN-outN));row('Umsatzsteuer aus Einnahmen',r2(inV));row('Vorsteuer aus Ausgaben',r2(outV));row('Umsatzsteuer-Zahllast des Monats',r2(inV-outV));
 y+=4;font(9,true);pdf.text('Offene Rechnungen an Kunden',15,y);y+=6;font(8);
 if(!open.length){pdf.text('Keine offenen Rechnungen.',15,y);y+=5}
 for(const o of open){if(y>275)nextPage();pdf.text(clean((o.number||'')+' '+(o.title||'')).slice(0,70),15,y);pdf.text('fällig '+dateDE(o.dueDate||o.date),135,y);pdf.text(eur(o.gross),195,y,{align:'right'});y+=5}
 font(7,false,[86,101,111]);pdf.text('Erstellt mit CNC OS. Zusammenstellung der erfassten Buchungen, keine Steuererklärung.',15,287);
 pdf.setProperties({title:'Monatsübersicht '+key,author:p.company,creator:'CNC OS'});
 return {pdf,name:'Monatsuebersicht_'+key+'.pdf'};
}
const api={monthReport,deposits,finalInvoice,kinds,levelName,profile,missing,customer,positions,invoicesFor,nextInvoiceNumber,createInvoice,markPaid,reminderLevel,overdueInvoices,model,render,addDays,eur,dateDE};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CncBelege=api;
})(typeof window!=='undefined'?window:globalThis);
