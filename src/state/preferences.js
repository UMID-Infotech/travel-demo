import {defaults} from '../data/index.js';
import {nextDate} from '../engine/time.js';
// Structural empty state, never a set of customer answers.
export const emptyPreferences=()=>({inputVersion:3,durationMode:'destination-stay',destination:'',startDate:'',days:'',adults:'',childCount:'',childAges:[],group:'',category:'',rooms:'',interests:[],activityChoice:'',selected:[],excluded:[],transport:'',transferChoice:'',transfers:[],mealPlan:''});
// Admin-only fixtures. Never used to initialise the public customer planner.
export const demoPreferences=(c=defaults)=>({...emptyPreferences(),destination:c.destinations.find(d=>d.enabled&&!d.archived)?.id||'',startDate:nextDate(),days:4,adults:2,childCount:0,childAges:[],group:'couple',category:'comfort',rooms:1,interests:['nature','culture'],activityChoice:'auto',transport:'private',transferChoice:'own',mealPlan:'half'});
export function restoreCustomerPreferences(saved){if(!saved||typeof saved!=='object'||saved.inputVersion!==3)return emptyPreferences();const p={...emptyPreferences(),...saved};for(const key of ['childAges','interests','selected','excluded','transfers'])if(!Array.isArray(p[key]))p[key]=[];return p;}
