const assert=require('node:assert/strict');const {defaults,calculate,insuredLoss}=require('./dist/model.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
close(calculate({...defaults,years:30,growth:0}).chance,1-.99**30);
close(insuredLoss(150000,2500),5000);
close(insuredLoss(500000,2500),152500);
close(calculate({...defaults,risk:0,newRisk:0}).rows[0].total,0);
close(calculate({...defaults,risk:1,years:20,growth:0,discount:0}).rows[0].total,33000);
close(calculate({...defaults,risk:1,years:20,growth:0,discount:0}).rows[1].total,44000);
const base=calculate(defaults);assert.ok(calculate({...defaults,risk:2}).chance>base.chance);assert.ok(calculate({...defaults,growth:5}).chance>base.chance);assert.ok(calculate({...defaults,years:30}).chance>base.chance);
assert.equal(base.rows[0].physicalDamage,base.rows[1].physicalDamage);assert.ok(base.rows[4].eventLoss<=base.rows[3].eventLoss);assert.ok(base.rows[3].eventLoss<base.rows[0].eventLoss);
for(const risk of [0,10])for(const years of [1,30])for(const growth of [0,5])for(const damage of [25000,500000])for(const discount of [0,7]){const r=calculate({...defaults,risk,years,growth,damage,discount,moveCost:-100000,housing:-6000});assert.ok(r.chance>=0&&r.chance<=1);r.rows.forEach(x=>{assert.ok(Number.isFinite(x.total));assert.ok(x.eventLoss>=0);assert.ok(x.probability>=0&&x.probability<=1);});}
console.log('PASS: probability benchmark, deductibles and limits, zero hazard, hand-calculated totals, monotonic risk, protection behavior and 32 extreme combinations.');
