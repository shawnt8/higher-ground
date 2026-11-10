(function(root){
  const defaults={risk:1,years:20,growth:2,damage:150000,displacement:15000,premium:2000,deductible:2500,elevation:150000,residual:10,smallCost:15000,smallReduction:10,moveCost:75000,newRisk:0.2,housing:0,discount:3};
  const definitions=[['stay','Stay as she is'],['insure','Buy flood insurance'],['small','Small improvements + insurance'],['raise','Raise the house'],['both','Raise + insure'],['move','Move to a lower-risk home']];
  function insuredLoss(d, deductible){const building=.8*d,contents=.2*d;return d-Math.min(250000,Math.max(0,building-deductible))-Math.min(100000,Math.max(0,contents-deductible));}
  function calculate(s){
    const probabilities=Array.from({length:s.years},(_,i)=>Math.min(1,s.risk/100*Math.pow(1+s.growth/100,i)));
    const result=definitions.map(([id,name])=>{
      const raised=id==='raise'||id==='both',insured=['insure','small','both'].includes(id),moving=id==='move';
      const residual=raised?s.residual/100:id==='small'?1-s.smallReduction/100:1;
      const damage=s.damage*residual,displacement=s.displacement*residual;
      const eventLoss=(insured?insuredLoss(damage,s.deductible):damage)+displacement;
      const upfront=raised?s.elevation:id==='small'?s.smallCost:moving?s.moveCost:0;
      const annual=insured?s.premium:moving?s.housing:0;
      const probs=moving?Array(s.years).fill(s.newRisk/100):probabilities;
      let recurring=0,loss=0,survival=1;const curve=[0];
      probs.forEach((p,i)=>{const factor=Math.pow(1+s.discount/100,i+1);recurring+=annual/factor;loss+=p*eventLoss/factor;survival*=1-p;curve.push(1-survival);});
      return {id,name,upfront,annual,recurring,loss,total:upfront+recurring+loss,eventLoss,physicalDamage:damage,probability:1-survival,curve};
    });
    return {rows:result,probabilities,chance:result[0].probability,lastRisk:probabilities.at(-1)*100};
  }
  const api={defaults,calculate,insuredLoss};if(typeof module!=='undefined')module.exports=api;root.FloodModel=api;
})(typeof window!=='undefined'?window:globalThis);
