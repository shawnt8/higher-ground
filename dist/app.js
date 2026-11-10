const $=id=>document.getElementById(id);
const money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x);
const fields=[
['damage','Property damage per flood ($)',25000,500000,5000,'Building + contents; 80/20 split. Not a six-foot damage estimate.'],
['displacement','Disruption spending per flood ($)',0,50000,1000,'Additional lodging and recovery expenses.'],
['premium','Annual flood premium ($/year)',500,10000,100,'Same premium for every insured option; use a real quote.'],
['deductible','Deductible for EACH coverage ($)',1000,10000,500,'Applied separately to building and contents.'],
['elevation','All-in elevation cost ($)',50000,350000,5000,'Include engineering, accessible entry, utilities and lodging.'],
['residual','Loss remaining after elevation (%)',5,50,5,'10% means a 90% reduction in representative damage and disruption.'],
['smallCost','Small improvements cost ($)',1000,50000,1000,'Utilities, suitable materials and other limited measures.'],
['smallReduction','Loss reduction from small improvements (%)',0,30,5,'A scenario, not an engineering finding.'],
['moveCost','Net cash needed to move ($)',-100000,300000,5000,'Replacement purchase − sale proceeds + fees and moving. Negative releases cash.'],
['newRisk','New home annual flood chance (%)',0,2,0.1,'Held constant. Verify the destination independently.'],
['housing','Annual housing cost difference ($/year)',-6000,12000,500,'Extra costs after moving; negative means savings.'],
['discount','Real discount rate (%)',0,7,0.5,'Values future spending in today’s dollars.']
];
$('extra-inputs').innerHTML=fields.map(([id,label,min,max,step,hint])=>`<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" min="${min}" max="${max}" step="${step}" value="${FloodModel.defaults[id]}" aria-describedby="${id}-hint"><small id="${id}-hint">${hint} Range: ${min.toLocaleString()} to ${max.toLocaleString()}.</small></div>`).join('');
let state={...FloodModel.defaults};
function update(){
  $('risk-out').value=state.risk.toFixed(1)+'%';$('years-out').value=state.years+' years';$('growth-out').value=state.growth.toFixed(1)+'%';
  const r=FloodModel.calculate(state);window.currentFloodResult=r;
  $('chance').textContent=(r.chance*100).toFixed(1)+'%';
  $('risk-sentence').textContent=`Over ${state.years} ${state.years===1?'year':'years'} in this scenario. Annual chance: ${state.risk.toFixed(1)}% in year 1 → ${r.lastRisk.toFixed(1)}% in year ${state.years}. This is not the chance of another six-foot flood.`;
  $('horizon-label').textContent=`${state.years} years · ${state.discount}% real discount`;
  const points=r.rows[0].curve.map((p,i)=>`${35+i/state.years*255},${115-p*100}`).join(' ');
  $('risk-chart').innerHTML=`<title>Cumulative chance of at least one flood: ${(r.chance*100).toFixed(1)} percent over ${state.years} years</title>${[0,50,100].map(v=>`<line x1="35" x2="290" y1="${115-v}" y2="${115-v}" stroke="#ffffff" opacity=".15"/><text x="29" y="${119-v}" text-anchor="end" fill="#dde8d8" font-size="10">${v}%</text>`).join('')}<polygon points="35,115 ${points} 290,115" fill="#c1d8a9" opacity=".12"/><polyline points="${points}" fill="none" stroke="#d7dfad" stroke-width="3"/><text x="35" y="135" fill="#dde8d8" font-size="10">0</text><text x="290" y="135" text-anchor="end" fill="#dde8d8" font-size="10">${state.years} years</text>`;
  let low=0,high=1;r.rows.forEach(row=>{low=Math.min(low,[row.upfront,row.recurring,row.loss].filter(x=>x<0).reduce((a,b)=>a+b,0));high=Math.max(high,[row.upfront,row.recurring,row.loss].filter(x=>x>0).reduce((a,b)=>a+b,0));});high*=1.05;if(low<0)low*=1.05;
  const scale=v=>(v-low)/(high-low)*100;
  $('cost-chart').innerHTML=r.rows.map(row=>{let positive=0,negative=0;let bars='';[['upfront',row.upfront],['recurring',row.recurring],['loss',row.loss]].forEach(([cls,v])=>{const start=v>=0?positive:negative+v;if(v>=0)positive+=v;else negative+=v;bars+=`<span class="bar-segment ${cls}" style="left:${scale(start)}%;width:${Math.abs(v)/(high-low)*100}%"></span>`;});return `<div class="bar-row"><div class="bar-head"><span>${row.name}</span><strong>${money(row.total)}</strong></div><div class="bar-track">${bars}<span class="zero-line" style="left:${scale(0)}%"></span></div></div>`;}).join('');
  $('chart-scale').textContent=`Shared dollar scale: ${money(low)} to ${money(high)}. ${low<0?'Left of the zero line = released cash or savings. ':''}See exact totals below.`;
  $('comparison').innerHTML=r.rows.map(row=>`<tr><th scope="row">${row.name}</th><td>${money(row.upfront)}</td><td>${money(row.annual)}</td><td>${money(row.eventLoss)}</td><td><strong>${money(row.total)}</strong></td></tr>`).join('');
  const cheapest=r.rows.reduce((a,b)=>a.total<b.total?a:b);
  $('insight').innerHTML=`<strong>${cheapest.name}</strong> has the lowest modeled expected cost under these assumptions. That is not a recommendation: the ${money(cheapest.eventLoss)} one-flood bill, upfront cash and Grandma’s safety matter too. ${state.newRisk>state.risk?'The new home’s starting flood chance is higher than the current home’s in these settings.':''}`;
  let summary=$('print-values');if(!summary){summary=document.createElement('p');summary.id='print-values';summary.className='print-assumptions';$('comparison').closest('.table-wrap').before(summary);}summary.textContent='Inputs: '+Object.entries(state).map(([k,v])=>`${k}: ${v}`).join('; ')+'.';
}
Object.keys(state).forEach(id=>{$(id).addEventListener('input',()=>{const input=$(id);if(input.value===''||!Number.isFinite(input.valueAsNumber)||!input.validity.valid)return;state[id]=input.valueAsNumber;update();});$(id).addEventListener('change',()=>{if(!$(id).validity.valid||$(id).value===''){$(id).value=state[id];}});});
$('reset').addEventListener('click',()=>{state={...FloodModel.defaults};Object.keys(state).forEach(id=>$(id).value=state[id]);update();});
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.risk=1;state.growth=b.dataset.preset==='steady'?0:2;['risk','growth'].forEach(id=>$(id).value=state[id]);update();}));
$('print').addEventListener('click',()=>window.print());
update();
