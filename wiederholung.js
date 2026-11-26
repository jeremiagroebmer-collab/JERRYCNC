(function(root){'use strict';
// Wiederholteile erkennen (Kunde + Zeichnungs-/Materialnummer des Kunden) und Revisionen kontrollieren.
const list=v=>Array.isArray(v)?v:[];
const norm=v=>String(v==null?'':v).toLowerCase().replace(/\s+/g,'').replace(/[–—]/g,'-');
const nameNorm=v=>String(v==null?'':v).toLowerCase().replace(/\s+/g,' ').trim();
const RANK={red:3,yellow:2,green:1};
const worst=(a,b)=>RANK[b]>RANK[a]?b:a;
const key=o=>o&&o.customer&&o.partNumber?nameNorm(o.customer)+'|'+norm(o.partNumber):'';
const steps=(db,o)=>list(db.planning).filter(p=>p.orderId===o.id||(!p.orderId&&p.order===o.number));
function previous(db,o){
  const k=key(o);if(!k)return [];
  return list(db.orders).filter(x=>x.id!==o.id&&key(x)===k&&steps(db,x).length&&!['Abgelehnt','Storniert'].includes(x.status))
    .sort((a,b)=>String(b.acceptedAt||b.createdAt||b.due||'').localeCompare(String(a.acceptedAt||a.createdAt||a.due||'')));
}
const sameRev=(a,b)=>norm(a)===norm(b);
function checks(db,o){
  const out=[],add=(id,title,light,text)=>out.push({id,title,light,text});
  if(!o||!o.partNumber){return {light:'green',checks:[],ack:false,list:[]}}
  const rev=o.revision||'';
  if(!rev)add('rev','Revision im Auftrag','yellow','Revision im Auftrag fehlt.');else add('rev','Revision im Auftrag','green','Revision '+rev);
  const part=list(db.pdm).find(x=>norm(x.number)===norm(o.partNumber));
  if(!part)add('pdm','Zeichnung im System','yellow','Keine Zeichnung zur Nummer '+o.partNumber+' angelegt.');
  else if(part.status&&part.status!=='Freigegeben')add('pdm','Zeichnung im System','red','Zeichnung hat den Status "'+part.status+'", nicht Freigegeben.');
  else if(rev&&part.revision&&!sameRev(part.revision,rev))add('pdm','Zeichnung im System','red','Zeichnung hat Revision '+part.revision+', Auftrag hat '+rev+'.');
  else add('pdm','Zeichnung im System','green','Zeichnung passt'+(part.revision?' (Rev. '+part.revision+')':''));
  const progs=list(db.cam).filter(c=>c.order===o.number||(c.partNumber&&norm(c.partNumber)===norm(o.partNumber)));
  const badProg=progs.filter(c=>rev&&c.revision&&!sameRev(c.revision,rev));
  const prevOrders=previous(db,o),prevNums=new Set(prevOrders.map(x=>x.number));
  // Programm stammt aus einem früheren Auftrag und die Revision hat sich geändert, ohne dass es geprüft wurde
  const carried=progs.filter(c=>rev&&!c.revision&&c.order&&c.order!==o.number&&prevNums.has(c.order)&&prevOrders.some(x=>x.number===c.order&&x.revision&&!sameRev(x.revision,rev)));
  const ncIds=[...badProg,...carried].map(c=>c.id);
  if(badProg.length)add('nc','NC-Programm','red','NC-Programm '+(badProg[0].number||badProg[0].title)+' hat Revision '+badProg[0].revision+', Auftrag hat '+rev+'.');
  else if(carried.length)add('nc','NC-Programm','yellow','NC-Programm '+(carried[0].number||carried[0].title)+' stammt aus '+carried[0].order+' (andere Revision). Für Revision '+rev+' prüfen und neu freigeben.');
  else add('nc','NC-Programm','green',progs.length?'NC-Programm passt':'Noch kein Programm');
  const mine=steps(db,o),planRevs=[...new Set(mine.map(p=>p.planRevision).filter(Boolean))];
  const badPlan=planRevs.filter(r=>rev&&!sameRev(r,rev));
  if(badPlan.length)add('plan','Arbeitsplan','red','Arbeitsplan gehört zu Revision '+badPlan[0]+', Auftrag hat '+rev+'.');
  else add('plan','Arbeitsplan','green',mine.length?'Arbeitsplan passt':'Noch kein Arbeitsplan');
  const prev=previous(db,o);
  if(prev.length){const last=prev[0];if(rev&&last.revision&&!sameRev(last.revision,rev))add('prev','Letzter Auftrag','yellow','Letzter Auftrag '+last.number+' hatte Revision '+last.revision+', jetzt '+rev+'. Plan prüfen.');else add('prev','Letzter Auftrag','green','Schon gefertigt: '+last.number)}
  let light='green';out.forEach(c=>{light=worst(light,c.light)});
  const sig=out.filter(c=>c.light==='red').map(c=>c.text).join('|');
  const ack=!!(sig&&o.revisionAck&&o.revisionAck.sig===sig);
  return {light:ack&&light==='red'?'yellow':light,checks:out,ack,sig,raw:light,list:prev,ncIds};
}
// Kopiert den Arbeitsplan von "from" nach "to". newId liefert neue IDs.
function copyPlan(db,from,to,newId,nextNumber){
  const src=steps(db,from).slice().sort((a,b)=>(Number(a.sequence)||0)-(Number(b.sequence)||0));
  const map=new Map(src.map(p=>[p.id,newId('step')]));
  return src.map(p=>{
    const c=JSON.parse(JSON.stringify(p));
    return {...c,id:map.get(p.id),number:nextNumber?nextNumber():c.number,order:to.number,orderId:to.id,status:'Geplant',date:to.due||'',dependsOn:list(p.dependsOn).map(id=>map.get(id)).filter(Boolean),planRevision:to.revision||from.revision||'',copiedFrom:from.number,startedAt:undefined,finishedAt:undefined};
  });
}
// Programme für die neue Revision übernehmen: Revision setzen, Freigabe zurücknehmen
function adoptPrograms(db,o,day){const c=checks(db,o),done=[];c.ncIds.forEach(id=>{const p=list(db.cam).find(x=>x.id===id);if(!p)return;const old=p.revision||'ohne';p.revision=o.revision;if(p.status==='Freigegeben')p.status='Freigabe offen';p.notes=(p.notes?p.notes+'\n':'')+(day||'')+' Revision '+old+' → '+o.revision+' für '+o.number+' geprüft. Neu freigeben.';done.push(p)});return done}
const api={norm,key,previous,checks,copyPlan,steps,adoptPrograms};
if(typeof module!=='undefined')module.exports=api;root.CncRepeat=api;
})(typeof window!=='undefined'?window:globalThis);
