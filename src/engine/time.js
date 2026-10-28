// Civil minutes in configured local time, represented on a UTC axis. Never browser-local Date getters.
export const DAY=1440;
export const clock=s=>{const [h,m]=String(s).split(':').map(Number);return h*60+m;};
export const dateMinute=s=>Date.parse(s+'T00:00:00Z')/60000;
export const isoDate=n=>new Date(n*60000).toISOString().slice(0,10);
export const timeText=n=>new Date(n*60000).toISOString().slice(11,16);
export const stamp=n=>`${isoDate(n)} ${timeText(n)} IST`;
export const weekday=n=>new Date(n*60000).getUTCDay();
export const month=n=>new Date(n*60000).getUTCMonth()+1;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const nextDate=(offset=7)=>isoDate(dateMinute(today())+offset*DAY);
export function journeyTimeline(p,c){
 const j=c.journeys.find(x=>x.destination===p.destination),start=dateMinute(p.startDate),depart=start+clock(c.departure.time);
 const out=j.outboundMinutes+(j.breaksIncluded?0:j.extraBreakMinutes),back=j.returnMinutes+(j.breaksIncluded?0:j.extraBreakMinutes);
 const arrive=depart+out,arrivalDay=Math.floor(arrive/DAY)*DAY,returnDay=arrivalDay+(p.days-1)*DAY;
 const returnDepart=returnDay+clock(j.returnTime),home=returnDepart+back,finalDate=Math.floor(home/DAY)*DAY;
 return {start,depart,arrive,arrivalDay,returnDepart,home,returnDay,finalDate,stayDays:p.days,totalCalendarDays:(finalDate-start)/DAY+1,journey:structuredClone(j)};
}
