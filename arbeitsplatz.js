(function(root){'use strict';
// Arbeitsplatz-Ansicht (wie SAP): pro Arbeitsplatz Fortschritt, Ampel, spätester Start und das, was dieser Arbeitsbereich braucht.
const known=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const list=v=>Array.isArray(v)?v:[];
const RANK={red:3,yellow:2,green:1,idle:0};
const worst=(a,b)=>RANK[b]>RANK[a]?b:a;
const dayAdd=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return y+'-'+String(mo).padStart(2,'0')+'-'+String(da).padStart(2,'0')}
const holCache=new Map();
function holidays(y){if(holCache.has(y))return holCache.get(y);const f=['01-01','01-06','04-25','05-01','06-02','08-15','11-01','12-08','12-25','12-26'].map(x=>y+'-'+x);f.push(dayAdd(easter(y),1));const s=new Set(f);holCache.set(y,s);return s}
const isHoliday=day=>holidays(Number(day.slice(0,4))).has(day);
// Betriebsurlaub: Liste aus Einzeltagen "2026-12-24" oder Bereichen "2026-12-24..2026-12-31"
function closedSet(text){const s=new Set();String(text||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean).forEach(t=>{const m=t.match(/^(\d{4}-\d{2}-\d{2})(?:\s*(?:\.\.|bis|–|-{1,2})\s*(\d{4}-\d{2}-\d{2}))?$/);if(!m)return;let d=m[1];const e=m[2]||m[1];for(let i=0;i<400&&d<=e;i++){s.add(d);d=dayAdd(d,1)}});return s}
function calendar(cfg,name){const g=(cfg&&cfg.places&&cfg.places[name])||{},days=Math.min(7,Math.max(1,Number(g.weekDays)||5)),hours=Math.min(24,Math.max(0.5,Number(g.dayHours)||8)),closed=closedSet(cfg&&cfg.closed);
  const isWork=day=>{const w=new Date(day+'T12:00:00Z').getUTCDay()||7;return w<=days&&!isHoliday(day)&&!closed.has(day)};return {dayHours:hours,weekDays:days,week:hours*days,isWork}}
function workBack(day,n,isWork){isWork=isWork||(d=>{const w=new Date(d+'T12:00:00Z').getUTCDay();return w!==0&&w!==6&&!isHoliday(d)});let d=day,g=0;while(!isWork(d)&&g++<800)d=dayAdd(d,-1);let k=n;while(k>0&&g++<2000){d=dayAdd(d,-1);if(isWork(d))k--}return d}
const dde=d=>d?d.slice(8,10)+'.'+d.slice(5,7)+'.':'';
function hoursOf(db,o,p,wf){const w=o&&wf&&wf.hours?wf.hours(p,o):null;const h=w!==null&&w!==undefined?w:Number(p.hours);return Number.isFinite(h)&&h>0?h:0}
function orderOf(db,p){return list(db.orders).find(o=>o.id===p.orderId||(!p.orderId&&p.order&&o.number===p.order))||null}
function placeName(db,p){const m=list(db.machines).find(x=>x.id===p.machineId);return (m&&m.title)||p.machine||p.kind||'Ohne Arbeitsplatz'}
// Art des Arbeitsbereichs aus Name oder Arbeitsgang
function classify(text){const t=String(text||'').toLowerCase();
  if(/säg|zuschn/.test(t))return 'saege';if(/cam|programm/.test(t))return 'cam';if(/fräs|bohr|mill|achs/.test(t))return 'fraesen';if(/dreh|turn/.test(t))return 'drehen';
  if(/schleif/.test(t))return 'schleifen';if(/entgrat/.test(t))return 'entgraten';if(/prüf|mess/.test(t))return 'pruefen';if(/verpack/.test(t))return 'verpacken';if(/versand/.test(t))return 'versand';return ''}
function placeType(name,rowsSteps){const n=classify(name);if(n)return n;const c={};rowsSteps.forEach(p=>{const k=classify(p.kind||p.title);if(k)c[k]=(c[k]||0)+1});const best=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return best?best[0]:'default'}
const MACHINE_TYPES=['fraesen','drehen','schleifen'];
// Spätester Start je Arbeitsgang: vom Liefertermin des Auftrags rückwärts über die Vorgänger
function latestStarts(db,o,wf,steps,capOf){
  const map=new Map();if(!o||!o.due)return map;
  const by=new Map(steps.map(p=>[p.id,p])),succ=new Map(steps.map(p=>[p.id,[]]));
  steps.forEach(p=>list(p.dependsOn).forEach(id=>{if(succ.has(id))succ.get(id).push(p.id)}));
  const visiting=new Set();
  function ls(p){if(map.has(p.id))return map.get(p.id);if(visiting.has(p.id))return '';visiting.add(p.id);
    const h=hoursOf(db,o,p,wf),cp=capOf?capOf(p):{dayHours:8,isWork:null},d=Math.max(1,Math.ceil(h/cp.dayHours));let lf=o.due;
    const wd=Math.ceil((Number(p.waitHours)||0)/24);succ.get(p.id).forEach(id=>{const s=ls(by.get(id));if(s){const e=workBack(s,1+wd,cp.isWork);if(e<lf)lf=e}});
    const v=workBack(workBack(lf,0,cp.isWork),d-1,cp.isWork);visiting.delete(p.id);map.set(p.id,v);return v}
  steps.forEach(p=>ls(p));return map;
}
function analyze(db,today,wf){
  db=db||{};
  const Rp=root.CncRepeat||(typeof require!=='undefined'?require('./wiederholung.js'):null);
  const machines=list(db.machines),steps=list(db.planning);
  const names=[];
  machines.forEach(m=>{if(m.title&&!names.includes(m.title))names.push(m.title)});
  steps.forEach(p=>{const n=placeName(db,p);if(!names.includes(n))names.push(n)});
  const cfgRow=list(db.settings).find(x=>x.id==='workplace-config'),cfg=cfgRow||{};
  const calOf=name=>calendar(cfg,name),capOf=p=>calOf(placeName(db,p));
  const horizon=dayAdd(today,6),lsCache=new Map();
  const orderSteps=o=>list(db.planning).filter(p=>p.orderId===o.id||(!p.orderId&&p.order===o.number));
  const lsFor=o=>{if(!o)return new Map();if(!lsCache.has(o.id))lsCache.set(o.id,latestStarts(db,o,wf,orderSteps(o),capOf));return lsCache.get(o.id)};
  const places=names.map(name=>{
    const machine=machines.find(m=>m.title===name)||null,isMachine=!!machine;
    const mine=steps.filter(p=>placeName(db,p)===name);
    const type=placeType(name,mine),cap=calOf(name);
    const rows=[];
    mine.forEach(p=>{
      const o=orderOf(db,p);
      if(o&&['Abgelehnt','Storniert'].includes(o.status))return;
      const done=p.status==='Abgeschlossen';
      const state=done?'Abgeschlossen':(o&&o.workflowVersion&&wf?wf.state(db,o,p):(p.status||'Geplant'));
      const h=hoursOf(db,o,p,wf);
      const booked=list(db.time).filter(t=>t.stepId===p.id).reduce((n,t)=>n+(Number(t.hours)||0),0);
      const due=p.date||'';
      const sched=lsFor(o),ls=sched.get(p.id)||'';
      const checks={},info={},C=(key,light,text)=>{checks[key]={light,text}};
      let reasons=[],light='green',nextText='';
      if(done){light='done'}
      else{
        const urgent=!!due&&due<=today,all=o?orderSteps(o):[];
        const stepWhen=q=>{const s=sched.get(q.id);return s?' (muss bis '+dde(s)+' starten)':''};
        const late=(due&&due<today)||(o&&o.due&&o.due<today&&!['Ausgeliefert','Bezahlt'].includes(o.status));
        if(late)C('date','red','Termin überschritten');else if(!due)C('date','yellow','Kein Termin');else C('date','green','Termin ok');
        // Spätester Start
        if(!ls)C('start','na','Kein Liefertermin für Rückrechnung');
        else if(p.status==='Läuft'||/^Läuft/.test(state))C('start','green','Läuft');
        else if(ls<today)C('start','red','Hätte bis '+dde(ls)+' starten müssen');
        else if(ls===today)C('start','yellow','Muss heute starten');
        else C('start','green','Start spätestens '+dde(ls));
        // Material
        const mats=list(p.materialIds).map(id=>list(db.materials).find(m=>m.id===id)).filter(Boolean);
        const empty=mats.filter(m=>known(m.qty)&&Number(m.qty)<=0);
        if(empty.length)C('material','red','Material leer: '+empty.map(m=>m.title).join(', '));
        else if(mats.length||(o&&o.quoteMaterialId))C('material','green','Material zugeordnet');
        else C('material',urgent?'red':'yellow','Material nicht zugeordnet');
        // Zeichnung
        const hasDrawing=list(p.drawingIds).length>0||(o&&o.partNumber&&list(db.pdm).some(x=>Rp?Rp.norm(x.number)===Rp.norm(o.partNumber):x.number===o.partNumber));
        C('drawing',hasDrawing?'green':(urgent?'red':'yellow'),hasDrawing?'Zeichnung zugeordnet':'Zeichnung fehlt');
        // Werkzeuge hergerichtet (Baugruppen einsatzbereit)
        if(!isMachine&&!MACHINE_TYPES.includes(type))C('tool','na','Kein Werkzeug nötig');
        else{
          const ids=new Set([...list(p.assemblyIds),...(o?list(o.assemblyIds):[])]);
          list(db.toolassemblies).forEach(a=>{if(o&&a.order===o.number)ids.add(a.id)});
          const as=[...ids].map(id=>list(db.toolassemblies).find(a=>a.id===id)).filter(Boolean);
          const ready=as.filter(a=>a.status==='Einsatzbereit'),locked=as.filter(a=>a.status==='Gesperrt');
          if(!as.length)C('tool',urgent?'red':'yellow','Werkzeug fehlt');
          else if(locked.length)C('tool','red','Werkzeug gesperrt: '+(locked[0].number||locked[0].title));
          else if(ready.length===as.length)C('tool','green','Alle Werkzeuge hergerichtet ('+as.length+')');
          else C('tool',urgent?'red':'yellow',ready.length+' von '+as.length+' Werkzeugen hergerichtet');
        }
        // Material zugeschnitten (Säge)
        const saw=all.filter(q=>q.id!==p.id&&classify(q.kind||q.title)==='saege');
        if(!['fraesen','drehen','schleifen'].includes(type))C('cut','na','Kein Zuschnitt nötig');
        else if(!saw.length)C('cut',(checks.material.light==='green'?'green':'yellow'),checks.material.light==='green'?'Kein Zuschnitt geplant, Material zugeordnet':'Weder Zuschnitt noch Material geplant');
        else{const open=saw.filter(q=>q.status!=='Abgeschlossen');
          if(!open.length)C('cut','green','Material zugeschnitten');
          else{const q=open[0],s=sched.get(q.id);C('cut',q.status==='Läuft'?'yellow':(s&&s<today)?'red':'yellow',(q.status==='Läuft'?'Zuschnitt läuft':'Zuschnitt offen')+stepWhen(q))}}
        // Programm gemacht
        const cams=all.filter(q=>q.id!==p.id&&classify(q.kind||q.title)==='cam');
        const progs=o&&wf&&wf.programIds?wf.programIds(db,o,p):[];
        const camAll=list(db.cam).filter(c=>o&&(c.order===o.number));
        const progList=progs.length?progs:camAll.map(c=>c.id);
        const prev=Rp&&o?Rp.previous(db,o):[];
        if(!['fraesen','drehen','schleifen','cam'].includes(type))C('prog','na','Kein Programm nötig');
        else{
          const fr=progList.map(id=>list(db.cam).find(c=>c.id===id)).filter(Boolean),notFree=fr.filter(c=>c.status!=='Freigegeben'),openCam=cams.filter(q=>q.status!=='Abgeschlossen');
          if(fr.length&&!notFree.length&&(type==='cam'||!openCam.length))C('prog','green','Programm gemacht und freigegeben');
          else if(fr.length)C('prog','yellow','Programm '+(notFree.length?'nicht freigegeben':'wird noch geprüft'));
          else if(openCam.length){const q=openCam[0],s=sched.get(q.id);C('prog',(s&&s<today)?'red':'yellow','Programm wird noch erstellt'+stepWhen(q))}
          else if(type==='cam')C('prog',urgent?'red':'yellow','Programm noch nicht erstellt');
          else C('prog',urgent?'red':'yellow','Programm fehlt');
        }
        // Programm neu oder Teil schon gemacht (nur Information, zählt nicht für die Ampel)
        {const had=prev.length?prev[0]:null,progOk=checks.prog.light==='green';
          if(had)info.progNew={light:progOk?'green':'yellow',text:'Schon gemacht: '+had.number+(had.revision?' (Rev. '+had.revision+')':'')+(progOk?'':'. Altes Programm zuordnen.')};
          else info.progNew={light:progOk?'green':'yellow',text:'Neues Teil: Programm '+(progOk?'ist fertig':'muss neu erstellt werden')}}
        // Vorarbeiten
        const waitFor=list(p.dependsOn).map(id=>list(db.planning).find(x=>x.id===id)).filter(x=>x&&x.status!=='Abgeschlossen');
        if(!list(p.dependsOn).length)C('pred','na','Keine Vorarbeit nötig');
        else if(waitFor.length)C('pred','yellow','Wartet auf: '+waitFor.map(x=>x.title).join(', '));
        else C('pred','green','Vorarbeiten fertig');
        // Prüfung dokumentiert
        {const q=list(db.quality).filter(x=>o&&x.order===o.number&&x.kind!=='Reklamation');
          if(!['pruefen','versand','verpacken'].includes(type))C('qual','na','Keine Prüfung nötig');
          else if(q.length)C('qual','green','Prüfung dokumentiert');
          else C('qual',type==='pruefen'?'yellow':'yellow','Keine Prüfung dokumentiert')}
        // Freigabe
        if(o&&o.workflowVersion){if(!o.productionReleased)C('release','yellow','Plan noch nicht freigegeben');else if(/Plan prüfen/.test(state))C('release','yellow','Plan prüfen');else C('release','green','Plan freigegeben')}
        else C('release','na','Keine Freigabe nötig');
        C('time',h?'green':'yellow',h?'Zeit geplant':'Zeit nicht geplant');
        // Revision
        if(Rp&&o&&o.partNumber&&o.revision){const rc=Rp.checks(db,o),bad=rc.checks.filter(x=>x.light!=='green');if(!bad.length)C('rev','green','Revision '+o.revision+' passt');else C('rev',rc.light==='red'?'red':'yellow','Revision: '+bad.map(x=>x.text).join(' '))}else C('rev','na','Keine Revision');
        // Maschine
        if(machine&&machine.status==='Störung')C('machine','red','Maschine gestört');
        else if(machine&&machine.status==='Wartung')C('machine','yellow','Maschine in Wartung');
        else C('machine',isMachine?'green':'na',isMachine?'Maschine verfügbar':'Kein Maschinenstatus');
        // Nachfolger (für Säge / Programmierung: bis wann muss der nächste Bereich starten)
        const nx=all.filter(q=>list(q.dependsOn).includes(p.id)&&q.status!=='Abgeschlossen');
        nextText=nx.map(q=>placeName(db,q)+(sched.get(q.id)?' ab '+dde(sched.get(q.id)):'')).join(', ');
        Object.entries(checks).forEach(([k,c])=>{if(c.light!=='na'){light=worst(light,c.light);if(c.light!=='green')reasons.push(c.text)}});
      }
      const waiting=Object.values(checks).filter(c=>c.light==='yellow'||c.light==='red').map(c=>c.text);
      rows.push({place:name,type,repeat:Rp&&o?Rp.previous(db,o).length:0,p,order:o,state,hours:h,booked,due,ls,done,light,reasons,checks,info,nextText,waiting,missing:done?[]:Object.entries(checks).filter(([k,c])=>['material','drawing','tool'].includes(k)&&(c.light==='yellow'||c.light==='red')).map(([k])=>({material:'Material',drawing:'Zeichnung',tool:'Werkzeug'}[k]))});
    });
    const open=rows.filter(r=>!r.done).sort((a,b)=>(a.ls||a.due||'9999').localeCompare(b.ls||b.due||'9999')||(Number(a.p.sequence)||0)-(Number(b.p.sequence)||0));
    const doneRows=rows.filter(r=>r.done);
    const planOpen=open.reduce((n,r)=>n+r.hours,0),planDone=doneRows.reduce((n,r)=>n+r.hours,0);
    const booked=rows.reduce((n,r)=>n+r.booked,0);
    const todayH=open.filter(r=>r.due===today).reduce((n,r)=>n+r.hours,0);
    const weekH=open.filter(r=>r.due&&r.due>=today&&r.due<=horizon).reduce((n,r)=>n+r.hours,0);
    const maint=list(db.maintenance).filter(m=>m.machine===name&&m.status!=='Erledigt'&&m.due).sort((a,b)=>a.due.localeCompare(b.due));
    const reasons=[];let light=open.length?'green':'idle';
    open.forEach(r=>{light=worst(light,r.light)});
    const nRed=open.filter(r=>r.light==='red').length,nYel=open.filter(r=>r.light==='yellow').length;
    if(nRed)reasons.push(nRed+(nRed===1?' Arbeitsgang':' Arbeitsgänge')+' kritisch');
    if(nYel)reasons.push(nYel+(nYel===1?' Arbeitsgang wartet':' Arbeitsgänge warten')+' oder '+(nYel===1?'ist':'sind')+' unvollständig');
    if(machine&&machine.status==='Störung'){light='red';reasons.unshift('Maschine gestört')}
    else if(machine&&machine.status==='Wartung'){light=worst(light==='idle'?'green':light,'yellow');reasons.unshift('Maschine in Wartung')}
    if(maint.length&&maint[0].due<today){light='red';reasons.push('Wartung überfällig: '+maint[0].title)}
    else if(maint.length&&maint[0].due<=horizon){light=worst(light==='idle'?'green':light,'yellow');reasons.push('Wartung bald fällig: '+maint[0].title)}
    if(weekH>cap.week){light=worst(light,'yellow');reasons.push('Woche überbucht ('+Math.round(weekH)+' h von '+cap.week+' h)')}
    if(!reasons.length)reasons.push(open.length?'Alles bereit':'Nichts eingeplant');
    return {name,type,machine,isMachine,light,reasons,steps:open,doneSteps:doneRows,
      counts:{total:rows.length,done:doneRows.length,open:open.length,red:nRed,yellow:nYel,green:open.length-nRed-nYel,overdue:open.filter(r=>r.checks.date&&r.checks.date.text==='Termin überschritten').length,running:open.filter(r=>r.p.status==='Läuft'||r.state==='Läuft').length},
      hours:{planOpen,planDone,booked,today:todayH,week:weekH},cap:{dayHours:cap.dayHours,weekDays:cap.weekDays,week:cap.week},
      progress:rows.length?doneRows.length/rows.length:0,
      hourProgress:planOpen+planDone>0?planDone/(planOpen+planDone):0,
      maintenance:maint,next:open[0]||null,
      orders:[...new Set(open.map(r=>r.order&&r.order.number).filter(Boolean))]};
  });
  const order=(a,b)=>RANK[b.light]-RANK[a.light]||a.name.localeCompare(b.name,'de');
  return {places:places.sort(order),today};
}
const api={analyze,hoursOf,placeName,classify,latestStarts,workBack,easter,isHoliday,closedSet,calendar};
if(typeof module!=='undefined')module.exports=api;root.CncWorkplace=api;
})(typeof window!=='undefined'?window:globalThis);
