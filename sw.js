/* CNC OS: Offline-Betrieb. Immer zuerst das Netz (damit Updates sofort kommen), sonst der letzte gespeicherte Stand. */
const CACHE='cncos-offline-v1';
const CORE=['./','index.html','manifest.webmanifest','firma.js','belege.js','lager.js','blaetter.js','sicherung.js','werkzeugbild.js','werkzeugskizze.js','stlprofil.js','werkzeug3d.js','camfiles.js','workflow.js','tooling.js','inventory-model.js','disciplines.js','app-guide.js','demo-data.js','practice.js','pdf-engine.js','vendor/jspdf-4.2.1.min.js','vendor/qrcode-generator-1.4.4.js','vendor/pdf-fonts.js','vendor/jsQR-1.4.0.js','pwa.js','icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!/^https?:/.test(r.url))return;
 const u=new URL(r.url);if(u.hostname.endsWith('supabase.co'))return;
 e.respondWith(fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
