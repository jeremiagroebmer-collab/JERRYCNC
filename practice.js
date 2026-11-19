(function(root){'use strict';
// A new, empty, in-memory storage for every practice page. Never copies production data.
function memoryStorage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()}}
function memoryFiles(){const data=new Map();return {close(){},transaction(){const tx={objectStore(){return {get(id){const req={};queueMicrotask(()=>{req.result=data.get(id);req.onsuccess?.()});return req},put(item){data.set(item.id,item);queueMicrotask(()=>tx.oncomplete?.())}}}};return tx},clear(){data.clear()}}}
const examples={
machine:{id:'practice-machine',title:'Übung · Fräse SK40',spindle:'SK40',type:'Fanuc',status:'Bereit',rate:60},
tool:{id:'practice-tool',stockGroup:'cutting',toolKind:'Schaftfräser',title:'Übung · Schaftfräser Ø12',shaftDiameter:12,diameter:12,cuttingLength:30,totalLength:75,shaftType:'glatt',brand:'Übungshersteller',qty:3,suitableMaterials:'Aluminium',isoGroups:'N'},
holder:{id:'practice-holder',stockGroup:'holders',toolKind:'Schrumpffutter',title:'Übung · Schrumpffutter SK40 Ø12',interface:'SK40',minDiameter:12,qty:2,projection:80},
material:{id:'practice-material',title:'Übung · Alu-Rohling 100 × 60 × 20',materialCategory:'metal',materialGroup:'N',grade:'EN AW-6082',qty:20,unit:'Stk.',cost:5},
order:{id:'practice-order',title:'Übung · Montageplatte',customer:'Musterkunde Technik',qty:10,notes:'Lernauftrag: 10 Montageplatten aus Aluminium. Nur Übungsdaten, keine Fertigungsfreigabe für reale Teile.',status:'Anfrage',workflowVersion:1}
};
const steps={
machine:['Maschine anlegen','Bestand → Maschinen. Lege die Übungsfräse an. Der Anschluss gehört zur Maschine, nicht zum Schaftfräser.','machines'],
tool:['Schaftfräser anlegen','Bestand → Bearbeitungswerkzeuge. Wähle Schaftfräser und trage Schaft- und Schneidendurchmesser ein. Nummer und QR-Code vergibt die App.','tools'],
holder:['Halter anlegen','Bestand → Aufnahmen & Zubehör. Wähle Schrumpffutter: SK40 ist der Maschinenanschluss, Ø12 die Werkzeugaufnahme.','tools'],
material:['Material anlegen','Bestand → Material. Ein Rohling kostet 5 €, Bestand 20 Stück. Für unseren Auftrag brauchen wir später 10 Stück.','materials'],
assembly:['Werkzeug zusammenbauen','Wähle die Übungsfräse. Klicke den Schrumpfhalter an, danach den Fräser. Alternativ die angezeigte interne Nummer eingeben. Der Name entsteht automatisch.','toolassemblies'],
order:['Anfrage erfassen','Lege 10 Montageplatten für Musterkunde Technik an. Die Zeichnungsbeschreibung folgt im nächsten Schritt.','orders'],
drawing:['Zeichnung zuordnen','Hinterlege die bereitgestellte Übungszeichnung. Sie ist bewusst nur ein Lernblatt und keine fertigungstaugliche Zeichnung.','orders'],
mill:['Fräsen planen','Arbeitsplan: Fräsen auf der Übungsfräse, Rüsten 30 Minuten, Bearbeitung 6 Minuten pro Stück, Gesamtsatz 60 €/h. Das ergibt 1,5 Stunden und 90 €.','planning'],
ship:['Versand planen','Arbeitsplan: Versand, 15 Minuten für das gesamte Los, 40 €/h. Unter Vorarbeiten den Schritt Fräsen auswählen. Das ergibt 10 €.','planning'],
links:['Werkzeugliste zuordnen','Wähle beim Fräsen unter Werkzeugbaugruppen das zuvor zusammengebaute Werkzeug und unter Material den Alu-Rohling. Speichere die Zuordnungen. So landet der Zusammenbau in den Arbeitsunterlagen.','planning'],
quote:['Kalkulieren und Angebot festhalten','Material: Übung · Alu-Rohling; Menge 10; Zusatzkosten 0; Verkaufspreis 20 €/Stück. Kalkulation speichern, dann Angebot festhalten. Erwartet: Kosten 150 €, Angebot 200 €.','orders'],
accept:['Kundenantwort erfassen','Im Übungsfall hat der Kunde zugesagt. In der Auftragsübersicht „Kunde hat angenommen“ wählen. Das verschickt keine Nachricht.','orders'],
release:['Fertigung freigeben','Arbeitsplan prüfen und „Plan freigeben“ wählen. Versand bleibt gesperrt, solange Fräsen nicht abgeschlossen ist.','orders'],
produce:['Fertigen und Zeit buchen','Bei Fräsen „Zeit nachtragen“: Name Übung, 90 Minuten. Danach Arbeitsgang fertig. Beim Versand 15 Minuten nachtragen und ebenfalls fertig melden.','orders'],
actual:['Ergebnis vergleichen','Unter Kosten die tatsächlichen Kosten erfassen: Material 50 €, Werkzeuge 0 €, Sonstiges 0 €. Erwartet bei den Beispielzeiten: Ist-Kosten 150 €, Ergebnis 50 €.','orders'],
pdf:['Arbeitsplan ansehen','Öffne das Arbeitsplan-PDF. Prüfe Kunde, Arbeitsgänge und QR-Verweise. Übungs-QRs sind nicht dauerhaft nutzbar.','orders']
};
const courses={machine:{title:'Maschine',time:'3 Minuten',steps:['machine']},tool:{title:'Bearbeitungswerkzeug',time:'5 Minuten',steps:['tool']},holder:{title:'Halter / Aufnahme',time:'4 Minuten',steps:['holder']},material:{title:'Material',time:'3 Minuten',steps:['material']},assembly:{title:'Werkzeug zusammenbauen',time:'5 Minuten',steps:['assembly']},order:{title:'Anfrage & Zeichnung',time:'5 Minuten',steps:['order','drawing']},plan:{title:'Arbeitsplan',time:'7 Minuten',steps:['mill','ship','pdf']},full:{title:'Gesamter Auftrag',time:'20–30 Minuten',steps:Object.keys(steps)}};
function find(db,k){return (db[steps[k]?.[2]||'orders']||[]).find(x=>x.title===examples[k]?.title)}
function seed(course,keys,normalize){const db=Object.fromEntries(keys.map(k=>[k,[]]));db._discipline='cnc';db.settings.push({id:'cncos-document-profile',title:'Übungs-Dokumentprofil',documentProfile:{appName:'CNC OS · ÜBUNG',company:'Musterbetrieb · keine echten Firmendaten',generalNote:'Nur zum Lernen. Nicht zur Fertigung verwenden. Übungsdaten werden beim Beenden verworfen; QR-Verweise sind danach nicht verfügbar.'}});const add=k=>db[steps[k][2]].push(k==='tool'||k==='holder'?normalize({...examples[k]}):{...examples[k]});if(course==='assembly'){['machine','tool','holder'].forEach(add)}if(course==='plan'){['machine','order'].forEach(add)}return db}
function check(k,db,viewed){const o=find(db,'order'),m=find(db,'machine'),t=find(db,'tool'),h=find(db,'holder'),list=(db.planning||[]).filter(p=>o&&(p.orderId===o.id||p.order===o.number));switch(k){
case 'machine':return !!m&&m.spindle==='SK40';
case 'tool':return !!t&&t.toolKind==='Schaftfräser'&&Number(t.shaftDiameter)===12&&Number(t.diameter)===12&&Number(t.qty)===3;
case 'holder':return !!h&&h.toolKind==='Schrumpffutter'&&h.inSize==='SK40'&&Number(h.minDiameter)===12;
case 'material':{const x=find(db,k);return !!x&&Number(x.qty)===20&&Number(x.cost)===5}
case 'assembly':return !!m&&!!t&&!!h&&(db.toolassemblies||[]).some(a=>a.machineId===m.id&&a.components?.some(c=>c.id===t.id)&&a.components?.some(c=>c.id===h.id));
case 'order':return !!o&&o.qty===10&&o.customer===examples.order.customer;
case 'drawing':return !!o?.documents?.length;
case 'mill':return list.some(p=>p.kind==='Fräsen'&&p.machineId===m?.id&&p.timeBasis==='piece'&&p.setupMin===30&&p.runMin===6&&p.rateOverride===60);
case 'ship':return list.some(p=>p.kind==='Versand'&&p.timeBasis==='lot'&&p.runMin===15&&p.rateOverride===40&&p.dependsOn?.some(id=>list.some(x=>x.id===id&&x.kind==='Fräsen')));
case 'links':return list.some(p=>p.kind==='Fräsen'&&p.assemblyIds?.includes(db.toolassemblies[0]?.id)&&p.materialIds?.includes(find(db,'material')?.id));
case 'quote':return !!o?.offerSnapshot&&o.offerSnapshot.cost===150&&o.offerSnapshot.revenue===200;
case 'accept':return !!o?.acceptedAt;
case 'release':return !!o?.productionReleased;
case 'produce':return o?.status==='Ausgeliefert';
case 'actual':return o?.actualMaterial===50&&o?.actualTools===0&&o?.actualOther===0;
case 'pdf':return !!viewed;
default:return false}}
const api={memoryStorage,memoryFiles,examples,steps,courses,find,seed,check};if(typeof module!=='undefined')module.exports=api;root.CncPractice=api;
})(typeof window!=='undefined'?window:globalThis);
