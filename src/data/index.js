import {shared} from './shared.js';import goa from './goa.js';import manali from './manali.js';import kerala from './kerala.js';import jaipur from './jaipur.js';
export const defaults=structuredClone(shared);
for(const k of Object.keys(goa)) defaults[k]=[goa,manali,kerala,jaipur].flatMap(d=>d[k]);
defaults.destinations.forEach((d,i)=>d.order=i);
