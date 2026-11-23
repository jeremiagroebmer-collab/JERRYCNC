if('serviceWorker' in navigator&&location.protocol==='https:'&&!/[?&](demo|practice)=/.test(location.search))navigator.serviceWorker.register('sw.js').catch(function(){});
