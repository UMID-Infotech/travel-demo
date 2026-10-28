// All operational values are editable fictional demonstration assumptions.
export function destinationData(id,name,tagline,description,mode,outbound,returnMinutes,bases,zones,visits){
 const dest={id,name,tagline,description,image:`/images/${id}.svg`,enabled:true,archived:false,order:0,minStayDays:id==='kerala'?4:2,maxStayDays:30,interests:['nature','culture','adventure','relaxation'],categories:['comfort','premium'],minStayMinutes:id==='kerala'?3600:900};
 const journey={id:id+'-journey',destination:id,mode,gateway:id+'-gateway',outboundMinutes:outbound,returnMinutes,breaksIncluded:true,extraBreakMinutes:0,arrivalBuffer:60,returnTime:'12:00',returnBuffer:60,includeFares:false,outboundFare:0,returnFare:0};
 const baseRecords=bases.map((b,i)=>({id:id+'-base-'+b[0],destination:id,name:b[1],zone:id+'-zone-'+b[2],order:i,minNights:b[3]||1,checkIn:'14:00',checkOut:'11:00',luggageDrop:true}));
 const zoneRecords=zones.map(z=>({id:id+'-zone-'+z[0],destination:id,name:z[1]}));
 const activities=visits.map((v,i)=>({id:id+'-'+v[0],destination:id,name:v[1],zone:id+'-zone-'+v[2],base:baseRecords[v[3]||0].id,tags:[v[4]||'nature'],visitMinutes:v[5]||90,prepMinutes:v[6]||10,recoveryMinutes:v[7]||10,preferredStart:'09:00',open:'09:00',close:'17:30',lastStart:'15:30',closedWeekdays:[],months:[1,2,3,4,5,6,7,8,9,10,11,12],blackoutDates:[],intensity:v[8]||'light',minAge:v[9]||0,maxAge:90,familySuitable:!v[9],optional:true,required:false,priceUnit:'person',adultPrice:v[10]||200,childPrice:100,freeUnder:4,childUnder:12,condition:v[11]||'',fallback:'',enabled:true,archived:false,order:i}));
 const hotels=baseRecords.flatMap(b=>['comfort','premium'].map(c=>({id:b.id+'-'+c,destination:id,base:b.id,name:`Rovea ${b.name} ${c==='premium'?'Retreat':'House'} (fictional)`,category:c,nightlyRate:c==='premium'?6500:3200,maxOccupancy:3,minAdultsPerRoom:1,includedBreakfast:true,dateRates:[],enabled:true,archived:false})));
 const vehicles=[{id:id+'-sedan',destination:id,name:'Private touring sedan',capacity:4,dailyRate:3200,hoursIncluded:8,kmIncluded:140,extraHour:350,extraKm:18,fuelDriverIncluded:true,gatewayIncluded:true,relocationsIncluded:true,enabled:true,archived:false},{id:id+'-van',destination:id,name:'Private touring van',capacity:10,dailyRate:6200,hoursIncluded:10,kmIncluded:200,extraHour:500,extraKm:23,fuelDriverIncluded:true,gatewayIncluded:true,relocationsIncluded:true,enabled:true,archived:false}];
 const transfers=['arrival','departure'].map(leg=>({id:id+'-'+leg,destination:id,leg,name:`${leg==='arrival'?'Arrival':'Departure'} gateway transfer`,capacity:4,price:1200,enabled:true,archived:false}));
 // Explicit symmetric base/activity/gateway graph, generated once as seed records.
 const nodes=[{id:journey.gateway,zone:id+'-gateway'},...baseRecords,...activities];
 const connections=[];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
 const a=nodes[i],b=nodes[j];let minutes=a.zone===b.zone?20:55;
 if(a.id===journey.gateway||b.id===journey.gateway)minutes=id==='kerala'?(b.id.includes('munnar')||a.id.includes('munnar')?240:120):id==='goa'?70:40;
 if(id==='kerala'&&a.zone!==b.zone&&a.id!==journey.gateway&&b.id!==journey.gateway)minutes=240;
 if(id==='manali'&&(a.zone.endsWith('solang')||b.zone.endsWith('solang')))minutes=a.zone===b.zone?25:90;
 if(id==='manali'&&(a.zone.endsWith('kullu')||b.zone.endsWith('kullu')))minutes=a.zone===b.zone?30:120;
 connections.push({id:`${id}-link-${i}-${j}`,destination:id,from:a.id,to:b.id,mode:'road',minutes,km:Math.round(minutes*.55),breaksIncluded:true,extraBreakMinutes:0,symmetric:true,enabled:true});
 }
 return {destinations:[dest],journeys:[journey],bases:baseRecords,zones:zoneRecords,activities,hotels,vehicles,transfers,connections};
}
