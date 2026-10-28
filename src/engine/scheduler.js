import {DAY,clock,isoDate,weekday,month,journeyTimeline} from './time.js';
import {active,validateConfig,validatePreferences} from './validation.js';
import {priceTrip} from './pricing.js';
const intersects=(a,b)=>a.start<b.end&&b.start<a.end;
export function connection(c,from,to){if(from===to)return {minutes:0,km:0};const e=c.connections.find(e=>active(e)&&((e.from===from&&e.to===to)||(e.symmetric&&e.from===to&&e.to===from)));if(!e)throw Error(`Missing travel connection: ${from} → ${to}. Add it in Zones and Travel Times.`);return {...e,minutes:e.minutes+(e.breaksIncluded?0:e.extraBreakMinutes)};}
export function createPlan(p,c,{ignorePast=false,skipConfigValidation=false}={}){
 const errors=[...(!skipConfigValidation?validateConfig(c):[]),...validatePreferences(p,c,{ignorePast})];if(errors.length)return {ok:false,errors};
 try{return schedule(p,c);}catch(e){return {ok:false,errors:[e.message]};}
}
function schedule(p,c){
 const d=c.destinations.find(d=>d.id===p.destination),timeline=journeyTimeline(p,c),j=timeline.journey,r=c.rules,blocks=[],nights=[],rejections=[],used=new Set(),ages=[18,90,...p.childAges];
 const bases=c.bases.filter(b=>b.destination===d.id).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 const firstDate=Math.floor(timeline.arrive/DAY)*DAY,returnDate=Math.floor(timeline.returnDepart/DAY)*DAY,nightCount=(returnDate-firstDate)/DAY;
 if(nightCount<bases.reduce((s,b)=>s+b.minNights,0))throw Error('Not enough hotel nights for this route and its minimum stays. Enter more stay days.');
 let extras=nightCount-bases.reduce((s,b)=>s+b.minNights,0),nightBases=[];
 bases.forEach((b,i)=>{const extra=Math.floor(extras/(bases.length-i));extras-=extra;nightBases.push(...Array(b.minNights+extra).fill(b));});
 const add=(type,title,start,end,extra={})=>{if(end<=start)return;const block={type,title,start,end,...extra};if(blocks.some(b=>intersects(block,b)))throw Error(`Schedule conflict at ${isoDate(start)}: ${title}. Review journey/rules.`);blocks.push(block);};
 add('journey',`${c.departure.origin} → ${d.name} · ${j.mode}`,timeline.depart,timeline.arrive);
 add('rest','Arrival formalities & rest buffer',timeline.arrive,timeline.arrive+j.arrivalBuffer);
 let ready=timeline.arrive+j.arrivalBuffer;const incoming=connection(c,j.gateway,bases[0].id);
 add('gateway',`Gateway → ${bases[0].name}`,ready,ready+incoming.minutes,{km:incoming.km});ready+=incoming.minutes;
 if(ready<firstDate+clock(bases[0].checkIn))add('rest','Luggage drop & unhurried rest; early check-in is not included',ready,firstDate+clock(bases[0].checkIn));
 ready=Math.max(ready,firstDate+clock(bases[0].checkIn));add('hotel',`Check in · ${bases[0].name}`,ready,ready+30);ready+=30;
 const lastBase=bases.at(-1),outgoing=connection(c,lastBase.id,j.gateway),gatewayLeave=timeline.returnDepart-j.returnBuffer-outgoing.minutes;
 if(gatewayLeave<=ready)throw Error('Gateway deadlines leave no useful destination stay. Choose a longer trip.');
 add('hotel',`Check out · ${lastBase.name}`,Math.min(gatewayLeave-30,returnDate+clock(lastBase.checkOut)-30),Math.min(gatewayLeave,returnDate+clock(lastBase.checkOut)));
 add('gateway',`${lastBase.name} → gateway`,gatewayLeave,gatewayLeave+outgoing.minutes,{km:outgoing.km});
 add('rest','Gateway reporting & return safety buffer',gatewayLeave+outgoing.minutes,timeline.returnDepart);
 add('journey',`${d.name} → ${c.departure.origin} · ${j.mode}`,timeline.returnDepart,timeline.home);
 for(let i=0;i<nightBases.length;i++){
 const b=nightBases[i],date=isoDate(firstDate+i*DAY),hotel=c.hotels.find(h=>h.base===b.id&&h.category===p.category&&active(h));
 if(!hotel)throw Error(`No enabled ${p.category} accommodation for ${b.name}.`);
 nights.push({date,base:structuredClone(b),hotel:structuredClone(hotel),rate:hotel.dateRates.find(o=>o.date===date)?.rate??hotel.nightlyRate,rooms:p.rooms});
 }
 const young=p.childAges.some(a=>a<r.youngChildAge),maxVisits=young?r.familyMaxVisits:r.maxVisits;
 const options=c.activities.filter(a=>a.destination===d.id&&active(a));const exclusive=a=>(!a.fallback||!used.has(a.fallback))&&!options.some(primary=>primary.fallback===a.id&&used.has(primary.id));let previousHeavy=false;
 for(let day=firstDate;day<=returnDate;day+=DAY){
 const index=Math.round((day-firstDate)/DAY),base=nightBases[index]||lastBase,previousBase=nightBases[index-1];let localStart=Math.max(day+clock(r.dayStart),day===firstDate?ready:0),localEnd=Math.min(day+clock(r.dayEnd),day===returnDate?Math.min(gatewayLeave-30,day+clock(lastBase.checkOut)-30):Infinity);
 if(previousBase&&previousBase.id!==base.id){
 const edge=connection(c,previousBase.id,base.id),leave=day+clock(r.dayStart);
 add('hotel',`Check out · ${previousBase.name}`,leave-30,leave);
 add('relocation',`${previousBase.name} → ${base.name} · base relocation`,leave,leave+edge.minutes,{km:edge.km});
 const checkIn=Math.max(leave+edge.minutes,day+clock(base.checkIn));
 if(checkIn>leave+edge.minutes)add('rest',`Luggage drop & rest · ${base.name}`,leave+edge.minutes,checkIn);
 add('hotel',`Check in · ${base.name}`,checkIn,checkIn+30);localStart=checkIn+30;
 }
 let visits=0,mainZone='',heavy=false;
 // A heavy main session may span midday. Reserve a delayed lunch at the excursion,
 // within the configured flexibility window, instead of slicing it into short stops.
 const heavyOptions=options.filter(a=>a.intensity==='heavy'&&exclusive(a)&&a.base===base.id&&!used.has(a.id)&&!p.excluded.includes(a.id)&&(p.selected.includes(a.id)||p.interests.some(i=>a.tags.includes(i)))&&!(previousHeavy&&r.avoidConsecutiveHeavy)&&!a.closedWeekdays.includes(weekday(day))&&a.months.includes(month(day))&&!a.blackoutDates.includes(isoDate(day))&&ages.every(age=>age>=a.minAge&&age<=a.maxAge)&&(!young||a.familySuitable)).map(a=>{
 const travel=connection(c,base.id,a.id),back=connection(c,a.id,base.id),start=Math.max(localStart+travel.minutes+a.prepMinutes,day+clock(a.open),day+clock(a.preferredStart)),finish=start+a.visitMinutes+Math.max(a.recoveryMinutes,r.restMinutes),lunch=Math.max(finish,day+clock(r.lunchStart)),end=lunch+r.lunchMinutes+back.minutes;
 return {a,travel,back,start,finish,lunch,end,score:(p.selected.includes(a.id)?r.selectedWeight:0)+a.tags.filter(t=>p.interests.includes(t)).length*r.interestWeight-travel.minutes*r.travelPenalty};
 }).filter(x=>x.start<=day+clock(x.a.lastStart)&&x.finish<=day+clock(x.a.close)&&x.lunch<=day+clock(r.lunchStart)+r.lunchFlexMinutes&&x.end+r.returnMargin<=localEnd&&!blocks.some(b=>intersects(b,{start:localStart,end:x.end}))).sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id)).slice(0,r.attemptLimit);
 if(heavyOptions.length){const {a,travel,back,start,finish,lunch,end}=heavyOptions[0];add('local-travel',`Excursion travel to ${a.name}`,localStart,localStart+travel.minutes,{km:travel.km});add('preparation',`${a.name} · preparation & operator checks`,localStart+travel.minutes,start);add('activity',a.name,start,start+a.visitMinutes,{activity:structuredClone(a),zone:c.zones.find(z=>z.id===a.zone)?.name,condition:a.condition});add('recovery',`${a.name} · recovery & rest`,start+a.visitMinutes,finish);add('rest','Excursion rest before lunch',finish,lunch);add('meal',`Lunch · excursion break`,lunch,lunch+r.lunchMinutes,{meal:'lunch'});add('local-travel',`Return to ${base.name}`,lunch+r.lunchMinutes,end,{km:back.km});used.add(a.id);visits=1;mainZone=a.zone;heavy=true;}
 for(const [meal,key,duration]of [['breakfast','breakfastStart',r.breakfastMinutes],['lunch','lunchStart',r.lunchMinutes],['dinner','dinnerStart',r.dinnerMinutes]]){
 const start=day+clock(r[key]),candidate={start,end:start+duration};
 if(start>=ready&&candidate.end<=gatewayLeave-30&&!blocks.some(b=>b.type==='meal'&&b.meal===meal&&isoDate(b.start)===isoDate(day))&&!blocks.some(b=>intersects(b,candidate)))add('meal',`${meal[0].toUpperCase()+meal.slice(1)} · ${base.name}`,start,candidate.end,{meal});
 }
 const lunchBlock=blocks.find(b=>b.type==='meal'&&b.meal==='lunch'&&isoDate(b.start)===isoDate(day));
 if(lunchBlock&&!heavy&&lunchBlock.end+r.restMinutes<=localEnd&&!blocks.some(b=>intersects(b,{start:lunchBlock.end,end:lunchBlock.end+r.restMinutes})))add('rest','Unhurried post-lunch rest',lunchBlock.end,lunchBlock.end+r.restMinutes);
 const reserved=blocks.filter(b=>b.start<localEnd&&b.end>localStart).sort((a,b)=>a.start-b.start),gaps=[];let cursor=localStart;
 for(const b of reserved){if(b.start>cursor)gaps.push([cursor,Math.min(b.start,localEnd)]);cursor=Math.max(cursor,b.end);}if(cursor<localEnd)gaps.push([cursor,localEnd]);
 for(const [gapStart,gapEnd]of gaps){let now=gapStart,location=base.id;
 while(visits<maxVisits){
 const candidates=options.filter(a=>exclusive(a)&&!used.has(a.id)&&a.base===base.id&&!p.excluded.includes(a.id)&&!a.closedWeekdays.includes(weekday(day))&&a.months.includes(month(day))&&!a.blackoutDates.includes(isoDate(day))&&ages.every(age=>age>=a.minAge&&age<=a.maxAge)&&(!young||a.familySuitable)&&(!mainZone||a.zone===mainZone)&&!(a.intensity==='heavy'&&(heavy||(previousHeavy&&r.avoidConsecutiveHeavy))))
 .map(a=>{let travel;try{travel=connection(c,location,a.id);}catch{return null;}const prep=a.prepMinutes+(young?r.youngChildExtra:0),start=Math.max(now+travel.minutes+prep,day+clock(a.open),day+clock(a.preferredStart)),finish=start+a.visitMinutes+a.recoveryMinutes+(young?r.youngChildExtra:0);let back;try{back=connection(c,a.id,base.id);}catch{return null;}const score=(p.selected.includes(a.id)?r.selectedWeight:0)+a.tags.filter(t=>p.interests.includes(t)).length*r.interestWeight-travel.minutes*r.travelPenalty;
 return {a,travel,back,start,finish,prep,score};}).filter(x=>x&&x.start<=day+clock(x.a.lastStart)&&x.finish<=day+clock(x.a.close)&&x.finish+x.back.minutes+r.returnMargin<=gapEnd).sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id)).slice(0,r.attemptLimit);
 const pick=candidates[0];if(!pick)break;const {a,travel,start,finish}=pick;
 add('local-travel',`Travel to ${a.name}`,now,now+travel.minutes,{km:travel.km});
 if(start>now+travel.minutes)add('preparation',`${a.name} · preparation / opening wait`,now+travel.minutes,start);
 add('activity',a.name,start,start+a.visitMinutes,{activity:structuredClone(a),zone:c.zones.find(z=>z.id===a.zone)?.name,condition:a.condition});
 add('recovery',`${a.name} · recovery & pace buffer`,start+a.visitMinutes,finish);
 used.add(a.id);visits++;mainZone=a.zone;heavy ||=a.intensity==='heavy';now=finish;location=a.id;
 }
 if(location!==base.id){const back=connection(c,location,base.id);add('local-travel',`Return to ${base.name}`,now,now+back.minutes,{km:back.km});now+=back.minutes;}
 if(now<gapEnd)add('leisure',`Unscheduled time · ${base.name}`,now,gapEnd);
 }
 previousHeavy=heavy;
 }
 for(const id of p.selected){const a=options.find(a=>a.id===id);if(!a||used.has(id))continue;let reason='No compatible opening, travel and meal window fits this selection.';if(p.excluded.includes(id))reason='Explicitly deselected.';else if(ages.some(age=>age<a.minAge||age>a.maxAge))reason=`Whole-party age requirement: ${a.minAge}–${a.maxAge} years. Adult ages are not collected, so restricted adult age ranges cannot be confirmed automatically.`;else if(young&&!a.familySuitable)reason='Not suitable for this young-family group.';else if(!a.months.includes(month(timeline.arrive)))reason='Outside the configured operating months.';
 const alt=options.find(x=>x.id===a.fallback&&!p.excluded.includes(x.id));rejections.push({id,name:a.name,reason,fallback:alt?.name||'',fallbackScheduled:alt?used.has(alt.id):false,charged:false});}
 blocks.sort((a,b)=>a.start-b.start||a.title.localeCompare(b.title));
 for(let i=1;i<blocks.length;i++)if(blocks[i].start<blocks[i-1].end)throw Error('Final overlap validation failed.');
 if(blocks.some(b=>b.activity&&(b.start<timeline.arrive||b.end>gatewayLeave)))throw Error('Activity outside destination window.');
 const days=Array.from({length:timeline.totalCalendarDays},(_,index)=>{const start=timeline.start+index*DAY;const stayDay=(start-timeline.arrivalDay)/DAY+1;return {index,stayDay:stayDay>=1&&stayDay<=p.days?stayDay:null,label:stayDay<1?'Outbound travel':stayDay>p.days?'Homeward travel':`Stay day ${stayDay}`,date:isoDate(start),base:nights.find(n=>n.date===isoDate(start))?.base.name||'',blocks:blocks.filter(b=>b.end>start&&b.start<start+DAY).map(b=>({...b,start:Math.max(start,b.start),end:Math.min(start+DAY,b.end),continues:b.start<start||b.end>start+DAY}))};});
 const result={ok:true,preferenceVersion:3,dataRevision:c.revision,engineVersion:c.engineVersion,brand:structuredClone(c.brand),destination:structuredClone(d),preferences:structuredClone(p),timeline,nights,blocks,days,rejections,selectionSummary:{mealPlanName:c.meals.plans.find(m=>m.id===p.mealPlan)?.name||p.mealPlan,activityChoice:p.activityChoice,prioritised:p.selected.map(id=>options.find(a=>a.id===id)?.name||id),skipped:p.excluded.map(id=>options.find(a=>a.id===id)?.name||id),interests:p.interests.includes('any')?'Open to suggestions':p.interests.join(', '),gatewayChoice:p.transport==='private'?'Included in private transport':p.transferChoice==='choose'?p.transfers.join(' + '):'Self-arranged'},assumptions:[`All times in ${c.departure.timezone}. ${p.days} destination stay days means ${p.days-1} hotel nights. Arrival and checkout are included in stay days; overnight travel adds separate calendar dates (${timeline.totalCalendarDays} dates door to door).`,`Editable demonstration timings, fictional hotels and estimated INR rates; verify all operational details before travel.`,`Intercity fares ${j.includeFares?'included as configured demo fares':'excluded; arrange separately'}. Taxes excluded and not calculated.`,`Private day rates include driver, fuel, gateway transfers and relocations; independent travel uses an allowance, with relocation charged separately.`,`All travellers, including infants, occupy one vehicle seat and count toward room occupancy. Every room requires an adult.`,`Hotel nights follow actual overnight dates. No guaranteed early check-in. Luggage drop and waiting/rest are assumed available.`,`Meals while travelling or overlapping transfers are self-arranged and excluded. Hotel breakfast is deducted only where included.`,`Conditional adventures require weather, access and operator confirmation. No live availability check.`,`Unscheduled or fallback activities are not charged; fallback suggestions require regeneration with a revised choice.`,p.transport==='independent'?'Unselected gateway transfers are self-arranged and excluded from this estimate.':'Private vehicle overages use elapsed touring time and stored kilometres, including waiting during visits.']};
 result.cost=priceTrip(p,c,result);return result;
}
