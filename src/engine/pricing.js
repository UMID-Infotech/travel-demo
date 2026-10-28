import {active} from './validation.js';import {DAY,isoDate} from './time.js';
export const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export function activityCharge(a,p){if(a.priceUnit==='group')return a.adultPrice;return p.adults*a.adultPrice+p.childAges.reduce((sum,age)=>sum+(age<a.freeUnder?0:age<a.childUnder?a.childPrice:a.adultPrice),0);}
export function priceTrip(p,c,s){
 const people=p.adults+p.childAges.length,ledger=[],vehicles=[],transfers=[],mealItems=[];
 const add=(component,label,formula,total)=>ledger.push({component,label,formula,total:Math.round(total)});
 for(const n of s.nights)add('Accommodation',`${n.hotel.name} · ${n.date}`,`${n.rate} × ${p.rooms} room(s) × 1 night`,n.rate*p.rooms);
 const days=[...new Set(s.blocks.filter(b=>['local-travel','relocation','gateway'].includes(b.type)).map(b=>isoDate(b.start)))];
 if(p.transport==='private'){
 const pool=c.vehicles.filter(v=>v.destination===p.destination&&active(v));
 for(const date of days){const blocks=s.blocks.filter(b=>isoDate(b.start)===date&&['local-travel','relocation','gateway'].includes(b.type)),km=blocks.reduce((sum,b)=>sum+(b.km||0),0),hours=(Math.max(...blocks.map(b=>b.end))-Math.min(...blocks.map(b=>b.start)))/60;
 const priced=pool.map(v=>{const quantity=Math.ceil(people/v.capacity),overHours=Math.max(0,Math.ceil(hours-v.hoursIncluded)),overKm=Math.max(0,Math.ceil(km-v.kmIncluded));return {date,...structuredClone(v),quantity,km,hours:Math.round(hours*10)/10,overHours,overKm,total:quantity*(v.dailyRate+overHours*v.extraHour+overKm*v.extraKm)};}).sort((a,b)=>a.total-b.total||a.id.localeCompare(b.id));
 const v=priced[0];if(!v)throw Error('No enabled private vehicle.');vehicles.push(v);add('Local transport',`${date} · ${v.quantity} × ${v.name}`,`${v.dailyRate} daily + ${v.overHours} extra hr × ${v.extraHour} + ${v.overKm} extra km × ${v.extraKm}, per vehicle`,v.total);
 }
 }else{for(const date of days)add('Local transport',`${date} · independent allowance`,`${people} travellers × ${c.independent.dailyPerPerson}; gateway & relocation separate`,people*c.independent.dailyPerPerson);
 for(const leg of ['arrival','departure'])if(p.transferChoice==='choose'&&p.transfers?.includes(leg)){const t=c.transfers.find(t=>t.destination===p.destination&&t.leg===leg&&active(t));if(t){const quantity=Math.ceil(people/t.capacity);transfers.push({...structuredClone(t),quantity});add('Transfers',t.name,`${quantity} vehicle(s) × ${t.price}`,quantity*t.price);}}
 // Independent relocation is explicitly costed once, outside daily local allowance.
 for(const b of s.blocks.filter(b=>b.type==='relocation'))add('Transfers',`${isoDate(b.start)} · base relocation allowance`,`${people} travellers × ${Math.ceil(b.km*c.independent.relocationPerKmPerPerson)}`,people*Math.ceil(b.km*c.independent.relocationPerKmPerPerson));
 }
 for(const b of s.blocks.filter(b=>b.activity))add('Activities',b.title, b.activity.priceUnit==='group'?'One group participation':`${p.adults} adults; ${p.childAges.length} children at recorded age bands`,activityCharge(b.activity,p));
 const plan=c.meals.plans.find(m=>m.id===p.mealPlan),childUnits=p.childAges.reduce((s,a)=>s+(a<c.meals.childFreeUnder?0:a<c.meals.childDiscountUnder?c.meals.childMultiplier:1),0);
 for(const b of s.blocks.filter(b=>b.type==='meal')){if(!plan.meals.includes(b.meal))continue;const included=b.meal==='breakfast'&&s.nights.some(n=>n.date===isoDate(b.start-DAY)&&n.hotel.includedBreakfast);const total=included?0:(p.adults+childUnits)*c.meals[b.meal];mealItems.push({date:isoDate(b.start),meal:b.meal,included,total:Math.round(total)});add('Meals',`${isoDate(b.start)} · ${b.meal}${included?' (hotel included)':''}`,included?'Included; no additional charge':`${p.adults+childUnits} adult-equivalent portions × ${c.meals[b.meal]}`,total);}
 if(s.timeline.journey.includeFares)add('Intercity travel',s.timeline.journey.mode,`${people} × (${s.timeline.journey.outboundFare} + ${s.timeline.journey.returnFare})`,people*(s.timeline.journey.outboundFare+s.timeline.journey.returnFare));
 if(c.fee.enabled)add('Agency fee',c.fee.name,`${c.fee.percent}% of rounded component subtotal`,ledger.reduce((s,r)=>s+r.total,0)*c.fee.percent/100);
 const total=ledger.reduce((s,r)=>s+r.total,0),components=Object.fromEntries([...new Set(ledger.map(r=>r.component))].map(k=>[k,ledger.filter(r=>r.component===k).reduce((s,r)=>s+r.total,0)]));
 return {ledger,total,average:total/people,components,vehicles,transfers,mealItems,people};
}
