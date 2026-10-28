import {dateMinute,today,clock,DAY,journeyTimeline} from './time.js';
export const active=x=>x.enabled!==false&&!x.archived;
const arrays=['destinations','journeys','bases','zones','activities','hotels','vehicles','transfers','connections'];
const timePattern=/^([01]\d|2[0-3]):[0-5]\d$/;
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const asset=v=>typeof v==='string'&&(/^\/images\/(logo|goa|manali|kerala|jaipur)\.svg$/.test(v)||(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v)&&v.length<700000));
export function validateConfig(c){
 const errors=[];const fail=s=>errors.push(s);
 if(!c||c.schemaVersion!==2||c.engineVersion!=='1.2.0')return ['Unsupported schema or engine version.'];
 if(!Number.isInteger(c.revision)||c.revision<1)fail('Revision must be a positive integer.');
 const checkSafe=(x,path='configuration')=>{if(typeof x==='string'&&(/<\s*(script|iframe|svg|html)|javascript:|data:text\/html/i.test(x)||x.length>700000))fail(`${path}: unsafe or oversized content.`);if(x&&typeof x==='object')for(const [k,v]of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(k))fail(`${path}: unsafe key.`);checkSafe(v,`${path}.${k}`);}};checkSafe(c);
 const top=['schemaVersion','engineVersion','revision','brand','departure','rules','meals','fee','independent','scenarios',...arrays];
 Object.keys(c).filter(k=>!top.includes(k)).forEach(k=>fail(`Unknown configuration key: ${k}.`));
 if(!c.brand||!asset(c.brand.logo)||!/^#[0-9a-f]{6}$/i.test(c.brand.primary)||!/^#[0-9a-f]{6}$/i.test(c.brand.accent))fail('Brand: valid local logo and six-digit theme colours required.');
 if(/^#[0-9a-f]{6}$/i.test(c.brand?.primary)&&(1.05/(luminance(c.brand.primary)+.05))<4.5)fail('Brand: primary colour needs at least 4.5:1 contrast against white.');
 if(c.departure?.timezone!=='Asia/Kolkata'||!timePattern.test(c.departure?.time)||!c.departure?.origin)fail('Departure: origin, valid time and Asia/Kolkata required.');
 for(const k of arrays)if(!Array.isArray(c[k])||c[k].length>5000)fail(`${k}: expected at most 5,000 records.`);
 if(errors.length)return errors;
 const ids=new Set();for(const k of arrays)for(const r of c[k]){if(!r.id||!/^[a-zA-Z0-9_-]+$/.test(r.id)||ids.has(r.id))fail(`${k}: missing, unsafe or duplicate ID ${r.id}.`);ids.add(r.id);}
 const find=(k,id)=>c[k].find(x=>x.id===id);
 const num=(n,lo,hi,path)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)fail(`${path}: must be ${lo}–${hi}.`);};
 const tm=(s,path)=>{if(!timePattern.test(s))fail(`${path}: use HH:mm.`);};
 const nonnegative=(obj,path)=>{for(const[k,v]of Object.entries(obj||{})){if(typeof v==='number'&&(!Number.isFinite(v)||v<0||v>10000000))fail(`${path}.${k}: invalid numeric value.`);}};
 for(const k of arrays)for(const r of c[k]){nonnegative(r,`${k}.${r.id}`);if(k!=='destinations'&&!find('destinations',r.destination))fail(`${r.id}: unknown destination.`);}
 const same=(k,id,d)=>{const r=find(k,id);return r&&r.destination===d;};
 for(const d of c.destinations){if(!asset(d.image))fail(`${d.name}: unsupported image.`);if(!Number.isInteger(d.minStayDays)||!Number.isInteger(d.maxStayDays)||d.minStayDays<2||d.maxStayDays>60||d.maxStayDays<d.minStayDays)fail(`${d.name}: stay-day limits must be whole numbers from 2–60, with maximum at least minimum.`);num(d.minStayMinutes,60,20000,d.id+'.minStayMinutes');if(!Array.isArray(d.categories)||!d.categories.length||!Array.isArray(d.interests))fail(`${d.name}: categories and interests required.`);
 if(active(d)){if(c.journeys.filter(j=>j.destination===d.id).length!==1)fail(`${d.name}: exactly one journey required.`);if(!c.bases.some(b=>b.destination===d.id))fail(`${d.name}: a base required.`);if(!c.activities.some(a=>a.destination===d.id&&active(a)))fail(`${d.name}: enabled activities required.`);for(const b of c.bases.filter(b=>b.destination===d.id))for(const category of d.categories)if(!c.hotels.some(h=>h.base===b.id&&h.category===category&&active(h)))fail(`${b.name}: missing ${category} hotel.`);if(!c.vehicles.some(v=>v.destination===d.id&&active(v)))fail(`${d.name}: enabled vehicle required.`);}}
 for(const b of c.bases){if(!same('zones',b.zone,b.destination))fail(`${b.id}: unknown zone.`);num(b.minNights,1,14,b.id+'.minNights');tm(b.checkIn,b.id+'.checkIn');tm(b.checkOut,b.id+'.checkOut');if(!b.luggageDrop)fail(`${b.id}: baseline model requires luggage drop before check-in.`);}
 for(const j of c.journeys){for(const k of ['extraBreakMinutes','arrivalBuffer','returnBuffer','outboundFare','returnFare'])num(j[k],0,100000,j.id+'.'+k);for(const k of ['outboundMinutes','returnMinutes'])num(j[k],1,4320,j.id+'.'+k);tm(j.returnTime,j.id+'.returnTime');if(!j.gateway||ids.has(j.gateway))fail(`${j.id}: unique gateway ID required.`);if(j.includeFares&&(!(j.outboundFare>0)||!(j.returnFare>0)))fail(`${j.id}: both fares required when included.`);}
 for(const a of c.activities){if(!same('zones',a.zone,a.destination)||!same('bases',a.base,a.destination))fail(`${a.id}: base/zone relationship invalid.`);if(a.fallback&&(!same('activities',a.fallback,a.destination)||a.fallback===a.id))fail(`${a.id}: invalid fallback.`);for(const k of ['open','close','lastStart','preferredStart'])tm(a[k],a.id+'.'+k);if(clock(a.open)>=clock(a.close)||clock(a.lastStart)>clock(a.close))fail(`${a.id}: invalid opening window.`);num(a.visitMinutes,5,600,a.id+'.visitMinutes');num(a.minAge,0,100,a.id+'.minAge');num(a.maxAge,a.minAge,120,a.id+'.maxAge');if(!['light','moderate','heavy'].includes(a.intensity))fail(`${a.id}: invalid intensity.`);if(!['person','group'].includes(a.priceUnit))fail(`${a.id}: invalid price unit.`);for(const [key,max,min]of [['closedWeekdays',6,0],['months',12,1]])if(!Array.isArray(a[key])||a[key].some(n=>!Number.isInteger(n)||n<min||n>max))fail(`${a.id}: invalid ${key}.`);if(!Array.isArray(a.blackoutDates)||a.blackoutDates.some(s=>!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(dateMinute(s))))fail(`${a.id}: invalid blackout dates.`);if(!Array.isArray(a.tags))fail(`${a.id}: tags required.`);if(a.freeUnder>a.childUnder||a.childUnder>18)fail(`${a.id}: invalid child price age bands.`);if(a.required)fail(`${a.id}: required visits are unsupported in this baseline; use selected priority.`);}
 for(const h of c.hotels){if(!same('bases',h.base,h.destination))fail(`${h.id}: unknown hotel base.`);if(!find('destinations',h.destination)?.categories.includes(h.category))fail(`${h.id}: unsupported category.`);num(h.maxOccupancy,1,12,h.id+'.maxOccupancy');num(h.minAdultsPerRoom,1,h.maxOccupancy,h.id+'.minAdultsPerRoom');if(Array.isArray(h.dateRates)&&new Set(h.dateRates.map(r=>r.date)).size!==h.dateRates.length)fail(`${h.id}: duplicate date overrides.`);if(!Array.isArray(h.dateRates)||h.dateRates.some(r=>!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!(r.rate>=0)))fail(`${h.id}: invalid date rates.`);}
 for(const v of c.vehicles){num(v.capacity,1,60,v.id+'.capacity');num(v.hoursIncluded,1,24,v.id+'.hoursIncluded');num(v.kmIncluded,1,3000,v.id+'.kmIncluded');if(!Number.isInteger(v.capacity))fail(`${v.id}: seat capacity must be an integer.`);if(!v.fuelDriverIncluded||!v.gatewayIncluded||!v.relocationsIncluded)fail(`${v.id}: baseline private day rate must include driver, fuel, gateways and relocations.`);}
 for(const t of c.transfers){num(t.capacity,1,60,t.id+'.capacity');if(!['arrival','departure'].includes(t.leg))fail(`${t.id}: unsupported transfer leg.`);}
 const linkPairs=new Set();for(const e of c.connections.filter(active)){const keys=[e.from+'>'+e.to,...(e.symmetric?[e.to+'>'+e.from]:[])];for(const k of keys){if(linkPairs.has(k))fail(`${e.id}: duplicate active connection direction ${k}.`);linkPairs.add(k);}}
 const allNodes=new Set([...c.bases,...c.activities].map(n=>n.id).concat(c.journeys.map(j=>j.gateway)));
 for(const e of c.connections){if(!allNodes.has(e.from)||!allNodes.has(e.to)||e.from===e.to)fail(`${e.id}: invalid connection endpoints.`);const nodeDest=id=>c.journeys.find(j=>j.gateway===id)?.destination||[...c.bases,...c.activities].find(n=>n.id===id)?.destination;if(nodeDest(e.from)!==e.destination||nodeDest(e.to)!==e.destination)fail(`${e.id}: endpoints cross destinations.`);num(e.minutes,1,1440,e.id+'.minutes');num(e.km,0,3000,e.id+'.km');num(e.extraBreakMinutes,0,1440,e.id+'.extraBreakMinutes');if(e.mode!=='road')fail(`${e.id}: baseline local connections use road.`);}
 for(const d of c.destinations.filter(active)){const j=c.journeys.find(j=>j.destination===d.id);if(!j)continue;for(const days of [d.minStayDays]){try{const t=journeyTimeline({destination:d.id,startDate:'2027-01-10',days},c),count=(t.returnDay-Math.floor(t.arrive/DAY)*DAY)/DAY,min=c.bases.filter(b=>b.destination===d.id).reduce((n,b)=>n+b.minNights,0);if(count<min||t.returnDepart-t.arrive<d.minStayMinutes)fail(`${d.name}: ${days} destination stay days cannot fit this journey and minimum useful stay/nights.`);}catch{fail(`${d.name}: invalid journey timeline.`);}}}
 const edge=(a,b)=>c.connections.some(e=>active(e)&&((e.from===a&&e.to===b)||(e.symmetric&&e.from===b&&e.to===a)));
 for(const d of c.destinations.filter(active)){const j=c.journeys.find(j=>j.destination===d.id);if(!j)continue;const bs=c.bases.filter(b=>b.destination===d.id).sort((a,b)=>a.order-b.order);if(!bs.length)continue;if(!edge(j.gateway,bs[0].id)||!edge(bs.at(-1).id,j.gateway))fail(`${d.name}: essential gateway connection missing.`);for(let i=1;i<bs.length;i++)if(!edge(bs[i-1].id,bs[i].id))fail(`${d.name}: relocation connection missing.`);for(const a of c.activities.filter(a=>a.destination===d.id&&active(a)))if(!edge(a.base,a.id))fail(`${a.id}: base connection missing.`);}
 for(const[k,v]of Object.entries(c.rules||{})){if(k.endsWith('Start')||k==='dayEnd')tm(v,'rules.'+k);else if(typeof v==='number')num(v,0,1000,'rules.'+k);}
 if(clock(c.rules.dayStart)>=clock(c.rules.dayEnd))fail('Rules: day end must follow day start.');if(c.rules.lunchMinutes<15||clock(c.rules.lunchStart)<clock(c.rules.dayStart)||clock(c.rules.lunchStart)+c.rules.lunchMinutes>clock(c.rules.dayEnd))fail('Rules: lunch must fit inside the day.');if(c.rules.familyMaxVisits>c.rules.maxVisits)fail('Rules: family visit limit cannot exceed the normal visit limit.');if(c.rules.maxHeavyPerDay!==1)fail('Rules: baseline allows one heavy main session daily.');if(c.rules.attemptLimit<1||c.rules.maxVisits<1||c.rules.familyMaxVisits<1)fail('Rules: visit and attempt limits must be positive.');
 for(const key of ['breakfast','lunch','dinner','childFreeUnder','childDiscountUnder','childMultiplier'])num(c.meals[key],0,100000,'meals.'+key);num(c.independent.dailyPerPerson,0,100000,'independent.dailyPerPerson');num(c.independent.relocationPerKmPerPerson,0,10000,'independent.relocationPerKmPerPerson');nonnegative(c.meals,'meals');nonnegative(c.fee,'fee');nonnegative(c.independent,'independent');if(!Array.isArray(c.meals.plans)||!c.meals.plans.length||c.meals.plans.some(p=>!Array.isArray(p.meals)||p.meals.some(m=>!['breakfast','lunch','dinner'].includes(m))))fail('Meals: invalid plans.');if(c.meals.childFreeUnder>c.meals.childDiscountUnder||c.meals.childMultiplier>1)fail('Meals: invalid child bands.');
 if(!Array.isArray(c.scenarios)||c.scenarios.length>100)fail('Scenarios: expected at most 100 demo cases.');
 return [...new Set(errors)];
}
export function validatePreferences(p,c,{ignorePast=false}={}){
 const e=[],d=c.destinations.find(d=>d.id===p.destination&&active(d));if(!d)return ['Choose an enabled destination.'];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)||!Number.isFinite(dateMinute(p.startDate))||new Date(dateMinute(p.startDate)*60000).toISOString().slice(0,10)!==p.startDate)e.push('Choose a valid departure date.');else if(!ignorePast&&p.startDate<today())e.push('Departure date cannot be in the past.');
 if(!Number.isInteger(p.days)||p.days<d.minStayDays||p.days>d.maxStayDays)e.push(`Enter a whole number of stay days from ${d.minStayDays} to ${d.maxStayDays} for ${d.name}. ${d.minStayDays} days allows ${d.minStayDays-1} hotel night(s); shorter stays cannot fit this route.`);
 if(!Number.isInteger(p.adults)||p.adults<1||p.adults>30)e.push('Choose 1–30 adults.');
 if(!Number.isInteger(p.childCount)||p.childCount<0||p.childCount>12||p.childCount!==p.childAges?.length)e.push('Enter the number of children explicitly (0 if none), then every child age.');
 if(!Array.isArray(p.childAges)||p.childAges.length>12||p.childAges.some(a=>!Number.isInteger(a)||a<0||a>17))e.push('Each child must have an age from 0–17.');
 if(p.group==='solo'&&(p.adults!==1||p.childAges.length))e.push('Solo travel requires one adult and no children.');
 if(['friends','family'].includes(p.group)&&p.adults+(p.childAges?.length||0)<2)e.push('Family and friends trips need at least two travellers.');
 if(p.group==='couple'&&(p.adults!==2||p.childAges.length))e.push('Couple travel requires two adults and no children.');
 if(!['solo','couple','family','friends'].includes(p.group))e.push('Select a valid group type.');
 if(!d.categories.includes(p.category))e.push('Choose an available hotel category.');
 if(!Number.isInteger(p.rooms)||p.rooms<1||p.rooms>p.adults)e.push('Every room needs at least one adult; check the room count.');
 for(const b of c.bases.filter(b=>b.destination===d.id)){const h=c.hotels.find(h=>h.base===b.id&&h.category===p.category&&active(h));if(!h&&p.category)e.push(`No active ${p.category} accommodation at ${b.name}.`);else if(h&&(p.adults+(p.childAges?.length||0)>p.rooms*h.maxOccupancy||p.adults<p.rooms*h.minAdultsPerRoom))e.push(`${b.name}: rooms support ${h.maxOccupancy} people each, including children, with ${h.minAdultsPerRoom} adult per room.`);}
 if(!['private','independent'].includes(p.transport))e.push('Choose local transport.');if(!c.meals.plans.some(m=>m.id===p.mealPlan))e.push('Choose an available meal plan.');
 if(!Array.isArray(p.interests)||!p.interests.length||p.interests.some(i=>i!=='any'&&!d.interests.includes(i))||(p.interests.includes('any')&&p.interests.length>1))e.push('Choose your interests, or explicitly select Open to suggestions.');
 if(!['auto','custom'].includes(p.activityChoice))e.push('Choose automatic activity selection or choose your own activities.');
 if(p.activityChoice==='custom'&&!p.selected.length&&!p.excluded.length)e.push('Prioritise or skip at least one activity, or choose automatic selection.');
 if(p.transport==='independent'&&!['own','choose'].includes(p.transferChoice))e.push('Choose how you will arrange gateway transfers.');
 if(p.transport==='independent'&&p.transferChoice==='choose'&&!p.transfers.length)e.push('Select at least one gateway transfer, or choose to arrange both yourself.');
 for(const id of [...(p.selected||[]),...(p.excluded||[])])if(!c.activities.some(a=>a.id===id&&a.destination===d.id&&active(a)))e.push('An activity selection is no longer available; review activities.');
 if((p.selected||[]).some(id=>p.excluded?.includes(id)))e.push('An activity cannot be both selected and excluded.');
 if(!e.length){const t=journeyTimeline(p,c);if(t.returnDepart-t.arrive<d.minStayMinutes)e.push('This duration leaves too little useful time at the destination. Choose a longer trip.');}
 return [...new Set(e)];
}

// Fixed-choice chat advances only after the current question has an explicit, valid answer.
export function isStepComplete(p,c,step){
 const d=c.destinations.find(d=>d.id===p.destination&&active(d));
 if(step===0)return !!d;
 if(step===1)return /^\d{4}-\d{2}-\d{2}$/.test(p.startDate)&&Number.isFinite(dateMinute(p.startDate))&&new Date(dateMinute(p.startDate)*60000).toISOString().slice(0,10)===p.startDate&&p.startDate>=today();
 if(!d)return false;
 if(step===2)return Number.isInteger(p.days)&&p.days>=d.minStayDays&&p.days<=d.maxStayDays;
 if(step===3)return Number.isInteger(p.adults)&&p.adults>=1&&p.adults<=30&&Number.isInteger(p.childCount)&&p.childCount>=0&&p.childCount<=12&&p.childCount===p.childAges.length&&p.childAges.every(a=>Number.isInteger(a)&&a>=0&&a<=17)&&['couple','family','friends','solo'].includes(p.group)&&(p.group!=='solo'||p.adults===1&&!p.childCount)&&(p.group!=='couple'||p.adults===2&&!p.childCount)&&(!['family','friends'].includes(p.group)||p.adults+p.childCount>=2);
 if(step===4)return d.categories.includes(p.category)&&Number.isInteger(p.rooms)&&p.rooms>=1&&p.rooms<=p.adults&&c.bases.filter(b=>b.destination===d.id).every(b=>{const h=c.hotels.find(h=>h.base===b.id&&h.category===p.category&&active(h));return h&&p.adults+p.childCount<=p.rooms*h.maxOccupancy&&p.adults>=p.rooms*h.minAdultsPerRoom;});
 if(step===5)return p.interests.length>0&&p.interests.every(i=>i==='any'||d.interests.includes(i))&&(!p.interests.includes('any')||p.interests.length===1);
 if(step===6)return p.activityChoice==='auto'||p.activityChoice==='custom'&&(p.selected.length+p.excluded.length)>0&&[...p.selected,...p.excluded].every(id=>c.activities.some(a=>a.id===id&&a.destination===d.id&&active(a)));
 if(step===7)return p.transport==='private'||p.transport==='independent'&&(p.transferChoice==='own'||p.transferChoice==='choose'&&p.transfers.length>0);
 if(step===8)return c.meals.plans.some(m=>m.id===p.mealPlan);
 return false;
}
