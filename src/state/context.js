import {createContext,useContext} from 'react';
export {emptyPreferences as defaultPreferences,demoPreferences} from './preferences.js';
export const Context=createContext();
export const useStore=()=>useContext(Context);
