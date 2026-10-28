import React,{useState} from 'react';
import {Context,defaultPreferences} from './context.js';
import {restoreCustomerPreferences} from './preferences.js';
import {defaults} from '../data/index.js';import {nextDate} from '../engine/time.js';import {initialConfig,write,read,PREF_KEY,RESULT_KEY,CONFIG_KEY,CHAT_KEY,clone,applyConfiguration,browserStorage,validSnapshot,migratePreferences} from './storage.js';
const storage=browserStorage();
export function Provider({children}){
 const [config,setConfig]=useState(()=>initialConfig(storage)),[preferences,setPreferences]=useState(()=>restoreCustomerPreferences(read(storage,PREF_KEY,null))),[result,setResult]=useState(()=>{const s=read(storage,RESULT_KEY,null);return validSnapshot(s)?s:null;}),[chatStep,setChatStep]=useState(()=>Math.max(0,Math.min(9,Number(read(storage,CHAT_KEY,0))||0))),[notice,setNotice]=useState('');
 const persist=(key,x)=>{const s=write(storage,key,x);if(!s.ok)setNotice(s.error);return s.ok;};
 const update=p=>{setPreferences(p);persist(PREF_KEY,p);};
 const saveResult=x=>{setResult(x);persist(RESULT_KEY,x);};
 const draft=d=>{const next={...config,draft:clone(d)};if(persist(CONFIG_KEY,next))setConfig(next);};
 const apply=d=>{const out=applyConfiguration(storage,config,d);if(out.ok){setConfig(out.state);setNotice('Configuration applied to this browser. Review saved preferences and regenerate older itineraries when ready.');}else setNotice(out.errors.join(' '));return out;};
 const restore=()=>{if(config.previous)apply(config.previous);};
 const step=n=>{setChatStep(n);persist(CHAT_KEY,n);};
 return <Context.Provider value={{config,c:config.active,preferences,update,result,saveResult,chatStep,step,draft,apply,restore,notice,setNotice,reset:()=>apply(defaults)}}>{children}</Context.Provider>;
}

