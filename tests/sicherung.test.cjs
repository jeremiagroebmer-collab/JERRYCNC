const assert=require('node:assert/strict');const S=require('../sicherung.js');
assert.deepEqual(S.excess(['2026-11-01','2026-11-03','2026-11-02'],2),['2026-11-01']);
assert.deepEqual(S.excess(['a'],7),[]);
assert.equal(S.excess(Array.from({length:10},(_,i)=>'2026-11-'+String(i+10)),7).length,3);
(async()=>{assert.equal(await S.daily('',"2026-11-23"),false);assert.equal(await S.daily('x','kein-datum'),false);console.log('sicherung ok')})();
