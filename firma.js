(function(root){'use strict';
const num=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const ym=d=>String(d||'').slice(0,7);
const addMonths=(key,n)=>{const [y,m]=key.split('-').map(Number),t=y*12+(m-1)+n;return Math.floor(t/12)+'-'+String(t%12+1).padStart(2,'0')};
const monthsBetween=(a,b)=>{const [y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return (y2*12+m2)-(y1*12+m1)};
const recurring=f=>['Monatlich','Vierteljährlich','Jährlich'].includes(f.repeat);
const stepOf=f=>f.repeat==='Monatlich'?1:f.repeat==='Vierteljährlich'?3:12;
const net=f=>Math.max(0,num(f.amount)??0);
const vatRate=f=>{const v=num(f.vat);return v===null?(f.type==='Einnahme'?19:0):Math.max(0,v)};
const vatOf=f=>net(f)*vatRate(f)/100;
const gross=f=>net(f)+vatOf(f);
const isIncome=f=>f.type==='Einnahme';
// Kommt eine wiederkehrende Buchung im Monat key vor?
function occurs(f,key){if(!recurring(f))return false;const start=ym(f.date);if(!start)return false;const d=monthsBetween(start,key);return d>=0&&d%stepOf(f)===0}
// Beträge eines Monats. mode 'paid': nur Gebuchtes + Vorlagen; 'plan': alles Offene/Geplante + Vorlagen
function flows(db,key,mode,currentKey){const r={inNet:0,outNet:0,inGross:0,outGross:0,vatIn:0,vatOut:0};const temps=(db.finance||[]).filter(recurring);const same=(a,b)=>a.type===b.type&&String(a.title||'').trim()!==''&&String(a.title).trim().toLowerCase()===String(b.title||'').trim().toLowerCase();for(const f of db.finance||[]){let hit=false;if(recurring(f))hit=occurs(f,key);else{if(temps.some(t=>same(t,f)&&occurs(t,key)))continue;const d=ym(f.date);if(mode==='paid')hit=d===key&&f.status==='Bezahlt';else hit=f.status!=='Bezahlt'&&!!d&&(d===key||(key===currentKey&&d<key))}if(!hit)continue;if(isIncome(f)){r.inNet+=net(f);r.inGross+=gross(f);r.vatIn+=vatOf(f)}else{r.outNet+=net(f);r.outGross+=gross(f);r.vatOut+=vatOf(f)}}
return r}
const debtRates=(db,key)=>(db.debts||[]).filter(d=>(num(d.balance)??0)>0&&(!key||!d.endDate||ym(d.endDate)>=key)).reduce((s,d)=>s+Math.max(0,num(d.payment)??0),0);
const debtTotal=db=>(db.debts||[]).reduce((s,d)=>s+Math.max(0,num(d.balance)??0),0);
// Feste Kosten pro Monat (netto): wiederkehrende Ausgaben + Kreditraten
function fixedPerMonth(db,today){let s=0;for(const f of db.finance||[])if(recurring(f)&&!isIncome(f))s+=net(f)/stepOf(f);const k=today?ym(today):null;return {costs:s,rates:debtRates(db,k),total:s+debtRates(db,k)}}
// Umsatzsteuer-Rücklage für das laufende Quartal (aus gebuchten Beträgen)
function vatReserve(db,today){const cur=ym(today),mo=Number(today.slice(5,7)),q0=Math.floor((mo-1)/3)*3+1,start=today.slice(0,4)+'-'+String(q0).padStart(2,'0');const from=(mo===q0&&Number(today.slice(8,10))<=10)?addMonths(start,-3):start;let due=0;for(let k=from;k<=cur;k=addMonths(k,1)){const f=flows(db,k,'paid');due+=f.vatIn-f.vatOut}return Math.max(0,due)}
function balance(db){const e=(db.settings||[]).find(s=>String(s.title||'').trim().toLowerCase()==='kontostand');if(!e)return null;const v=num(String(e.value??'').replace(',','.'));return v===null?null:{value:v,date:e.notes||''}}
// Umsatzsteuer-Vorauszahlung: Quartalsmeldung, fällig bis zum 10. des Folgemonats (Jan, Apr, Jul, Okt)
function vatDue(db,key,cur,today){const mo=Number(key.slice(5,7));if(![1,4,7,10].includes(mo))return 0;if(key===cur&&Number(today.slice(8,10))>10)return 0;let d=0;for(let i=3;i>=1;i--){const k=addMonths(key,-i);let f=flows(db,k,k<cur?'paid':'plan',cur);d+=f.vatIn-f.vatOut;if(k===cur){const nr={...db,finance:(db.finance||[]).filter(x=>!recurring(x))},g=flows(nr,k,'paid');d+=g.vatIn-g.vatOut}}return Math.max(0,d)}
function forecast(db,today,start,months=3){const cur=ym(today);let bal=start;const rows=[];for(let i=0;i<months;i++){const key=addMonths(cur,i),f=flows(db,key,'plan',cur),rates=debtRates(db,key),vat=vatDue(db,key,cur,today),inflow=f.inGross,outflow=f.outGross+rates+vat;bal=bal===null?null:bal+inflow-outflow;rows.push({key,inflow,outflow,vat,end:bal})}return rows}
// margin: Anteil (0..1) aus Aufträgen mit bekanntem Erlös und Plankosten
function breakEven(db,margin,today){const fx=fixedPerMonth(db,today);return {...fx,revenue:margin&&margin>0?fx.total/margin:null}}
const clampDay=(k,day)=>{const [y,m]=k.split('-').map(Number),dim=new Date(Date.UTC(y,m,0)).getUTCDate();return k+'-'+String(Math.min(Number(day),dim)).padStart(2,'0')};
function nextDue(f,today){const d=String(f.date||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return null;const done=String(f.lastDone||'').slice(0,10);if(!recurring(f))return done?null:d;let k=ym(d),day=d.slice(8,10),cand=clampDay(k,day),g=0;while(g++<600&&((done&&cand<=done)||(!done&&cand<today))){k=addMonths(k,stepOf(f));cand=clampDay(k,day)}return cand}
function deadlines(db,today,days=60){const limit=new Date(today+'T12:00:00Z');limit.setUTCDate(limit.getUTCDate()+days);const lim=limit.toISOString().slice(0,10);return (db.deadlines||[]).map(f=>{const due=nextDue(f,today);if(!due)return null;const diff=Math.round((new Date(due+'T12:00:00Z')-new Date(today+'T12:00:00Z'))/86400000);return {f,due,diff,level:diff<0?'over':diff<=14?'soon':'ok'}}).filter(x=>x&&(x.diff<0||x.due<=lim)).sort((a,b)=>a.due.localeCompare(b.due))}
function backupAge(iso,today){if(!iso)return null;const t=new Date(iso);if(!Number.isFinite(+t))return null;return Math.floor((new Date(today+'T12:00:00Z')-t)/86400000)}
const wageMissing=db=>!(db.finance||[]).some(f=>recurring(f)&&!isIncome(f)&&/lohn|gehalt|entnahme|unternehmerlohn/i.test(String(f.title||'')));
const noVat=db=>(db.finance||[]).filter(f=>num(f.vat)===null&&f.type==='Ausgabe'&&net(f)>0).length;
const openPayables=db=>(db.finance||[]).filter(f=>f.type==='Ausgabe'&&f.status==='Offen'&&!recurring(f)).reduce((s,f)=>s+gross(f),0);
const api={wageMissing,noVat,openPayables,num,ym,addMonths,recurring,net,vatOf,gross,flows,fixedPerMonth,debtRates,debtTotal,vatReserve,balance,forecast,breakEven,nextDue,deadlines,backupAge};
if(typeof module!=='undefined')module.exports=api;root.CncFirma=api;
})(typeof window!=='undefined'?window:globalThis);
