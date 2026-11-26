(function(root){'use strict';
// Arbeitsplatz-Ansicht (wie SAP): pro Arbeitsplatz Fortschritt, Ampel und fehlende Dinge.
const known=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const list=v=>Array.isArray(v)?v:[];
const RANK={red:3,yellow:2,green:1,idle:0};
const worst=(a,b)=>RANK[b]>RANK[a]?b:a;
const dayAdd=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function hoursOf(db,o,p,wf){const w=o&&wf&&wf.hours?wf.hours(p,o):null;const h=w!==null&&w!==undefined?w:Number(p.hours);return Number.isFinite(h)&&h>0?h:0}
function orderOf(db,p){return list(db.orders).find(o=>o.id===p.orderId||(!p.orderId&&p.order&&o.number===p.order))||null}
function placeName(db,p){const m=list(db.machines).find(x=>x.id===p.machineId);return (m&&m.title)||p.machine||p.kind||'Ohne Arbeitsplatz'}
function missingOf(db,o,p,isMachine){
  const out=[];
  const hasDrawing=list(p.drawingIds).length>0||(o&&o.partNumber&&list(db.pdm).some(x=>x.number===o.partNumber));
  if(!hasDrawing)out.push('Zeichnung');
  if(isMachine){
    const hasTool=list(p.assemblyIds).length>0||(o&&(list(o.assemblyIds).length>0||list(db.toolassemblies).some(a=>a.order===o.number)));
    if(!hasTool)out.push('Werkzeug');
  }
  const hasMat=list(p.materialIds).length>0||(o&&o.quoteMaterialId);
  if(!hasMat)out.push('Material');
  return out;
}
function analyze(db,today,wf){
  db=db||{};
  const machines=list(db.machines),steps=list(db.planning);
  const names=[];
  machines.forEach(m=>{if(m.title&&!names.includes(m.title))names.push(m.title)});
  steps.forEach(p=>{const n=placeName(db,p);if(!names.includes(n))names.push(n)});
  const horizon=dayAdd(today,6);
  const places=names.map(name=>{
    const machine=machines.find(m=>m.title===name)||null,isMachine=!!machine;
    const mine=steps.filter(p=>placeName(db,p)===name);
    const rows=[];
    mine.forEach(p=>{
      const o=orderOf(db,p);
      if(o&&['Abgelehnt','Storniert'].includes(o.status))return;
      const done=p.status==='Abgeschlossen';
      const state=done?'Abgeschlossen':(o&&o.workflowVersion&&wf?wf.state(db,o,p):(p.status||'Geplant'));
      const h=hoursOf(db,o,p,wf);
      const booked=list(db.time).filter(t=>t.stepId===p.id).reduce((n,t)=>n+(Number(t.hours)||0),0);
      const due=p.date||'';
      const checks={},C=(key,light,text)=>{checks[key]={light,text}};
      let reasons=[],light='green';
      if(done){light='done'}
      else{
        const urgent=!!due&&due<=today;
        // Termin
        const late=(due&&due<today)||(o&&o.due&&o.due<today&&!['Ausgeliefert','Bezahlt'].includes(o.status));
        if(late)C('date','red','Termin überschritten');else if(!due)C('date','yellow','Kein Termin');else C('date','green','Termin ok');
        // Material (Verfügbarkeit)
        const mats=list(p.materialIds).map(id=>list(db.materials).find(m=>m.id===id)).filter(Boolean);
        const empty=mats.filter(m=>known(m.qty)&&Number(m.qty)<=0);
        if(empty.length)C('material','red','Material leer: '+empty.map(m=>m.title).join(', '));
        else if(mats.length||(o&&o.quoteMaterialId))C('material','green','Material zugeordnet');
        else C('material',urgent?'red':'yellow','Material nicht zugeordnet');
        // Zeichnung
        const hasDrawing=list(p.drawingIds).length>0||(o&&o.partNumber&&list(db.pdm).some(x=>x.number===o.partNumber));
        C('drawing',hasDrawing?'green':(urgent?'red':'yellow'),hasDrawing?'Zeichnung zugeordnet':'Zeichnung fehlt');
        // Werkzeug (nur Maschinen)
        if(!isMachine)C('tool','na','Kein Werkzeug nötig');
        else{const hasTool=list(p.assemblyIds).length>0||(o&&(list(o.assemblyIds).length>0||list(db.toolassemblies).some(a=>a.order===o.number)));C('tool',hasTool?'green':(urgent?'red':'yellow'),hasTool?'Werkzeug zugeordnet':'Werkzeug fehlt')}
        // NC-Programm
        const progs=o&&wf&&wf.programIds?wf.programIds(db,o,p):[];
        if(!p.requiresProgram&&!progs.length)C('nc','na','Kein NC-Programm nötig');
        else if(!progs.length)C('nc','yellow','NC-Programm fehlt');
        else if(progs.some(id=>!list(db.cam).some(c=>c.id===id&&c.status==='Freigegeben')))C('nc','yellow','NC-Programm nicht freigegeben');
        else C('nc','green','NC-Programm freigegeben');
        // Vorarbeiten
        const waitFor=list(p.dependsOn).map(id=>list(db.planning).find(x=>x.id===id)).filter(x=>x&&x.status!=='Abgeschlossen');
        if(!list(p.dependsOn).length)C('pred','na','Keine Vorarbeit nötig');
        else if(waitFor.length)C('pred','yellow','Wartet auf: '+waitFor.map(x=>x.title).join(', '));
        else C('pred','green','Vorarbeiten fertig');
        // Freigabe
        if(o&&o.workflowVersion){if(!o.productionReleased)C('release','yellow','Plan noch nicht freigegeben');else if(/Plan prüfen/.test(state))C('release','yellow','Plan prüfen');else C('release','green','Plan freigegeben')}
        else C('release','na','Keine Freigabe nötig');
        // Zeit
        C('time',h?'green':'yellow',h?'Zeit geplant':'Zeit nicht geplant');
        // Revision (nur wenn im Auftrag eine Revision steht)
        const Rp=root.CncRepeat||(typeof require!=='undefined'?require('./wiederholung.js'):null);
        if(Rp&&o&&o.partNumber&&o.revision){const rc=Rp.checks(db,o),bad=rc.checks.filter(x=>x.light!=='green');if(!bad.length)C('rev','green','Revision '+o.revision+' passt');else C('rev',rc.light==='red'?'red':'yellow','Revision: '+bad.map(x=>x.text).join(' '))}else C('rev','na','Keine Revision');
        // Maschine
        if(machine&&machine.status==='Störung')C('machine','red','Maschine gestört');
        else if(machine&&machine.status==='Wartung')C('machine','yellow','Maschine in Wartung');
        else C('machine',isMachine?'green':'na',isMachine?'Maschine verfügbar':'Kein Maschinenstatus');
        Object.values(checks).forEach(c=>{if(c.light!=='na'){light=worst(light,c.light);if(c.light!=='green')reasons.push(c.text)}});
      }
      const waiting=Object.values(checks).filter(c=>c.light==='yellow'||c.light==='red').map(c=>c.text);
      rows.push({place:name,repeat:(()=>{const Rp=root.CncRepeat||(typeof require!=='undefined'?require('./wiederholung.js'):null);return Rp&&o?Rp.previous(db,o).length:0})(),p,order:o,state,hours:h,booked,due,done,light,reasons,checks,waiting,missing:done?[]:Object.entries(checks).filter(([k,c])=>['material','drawing','tool'].includes(k)&&(c.light==='yellow'||c.light==='red')).map(([k])=>({material:'Material',drawing:'Zeichnung',tool:'Werkzeug'}[k]))});
    });
    const open=rows.filter(r=>!r.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||(Number(a.p.sequence)||0)-(Number(b.p.sequence)||0));
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
    if(weekH>40){light=worst(light,'yellow');reasons.push('Woche überbucht ('+Math.round(weekH)+' h von 40 h)')}
    if(!reasons.length)reasons.push(open.length?'Alles bereit':'Nichts eingeplant');
    return {name,machine,isMachine,light,reasons,steps:open,doneSteps:doneRows,
      counts:{total:rows.length,done:doneRows.length,open:open.length,red:nRed,yellow:nYel,green:open.length-nRed-nYel,overdue:open.filter(r=>r.checks.date&&r.checks.date.text==='Termin überschritten').length,running:open.filter(r=>r.p.status==='Läuft'||r.state==='Läuft').length},
      hours:{planOpen,planDone,booked,today:todayH,week:weekH},
      progress:rows.length?doneRows.length/rows.length:0,
      hourProgress:planOpen+planDone>0?planDone/(planOpen+planDone):0,
      maintenance:maint,next:open[0]||null,
      orders:[...new Set(open.map(r=>r.order&&r.order.number).filter(Boolean))]};
  });
  const order=(a,b)=>RANK[b.light]-RANK[a.light]||a.name.localeCompare(b.name,'de');
  return {places:places.sort(order),today};
}
const api={analyze,hoursOf,placeName,missingOf};
if(typeof module!=='undefined')module.exports=api;root.CncWorkplace=api;
})(typeof window!=='undefined'?window:globalThis);
