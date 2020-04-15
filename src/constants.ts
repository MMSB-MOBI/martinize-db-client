
export const DEBUG_MODE: boolean = process.env.NODE_ENV !== 'production';
export const SERVER_ROOT = DEBUG_MODE ? "http://localhost:4123/" : "/";
export const API_URL = SERVER_ROOT + "api/";
export const STEPS = {
  STEP_MARTINIZE_INIT: 'init',
  STEP_MARTINIZE_RUNNING: 'internal',
  STEP_MARTINIZE_ENDED_FINE: 'martinize-end',
  STEP_MARTINIZE_GET_CONTACTS: 'contacts',
  STEP_MARTINIZE_GO_SITES: 'go-sites',
  STEP_MARTINIZE_GROMACS: 'gromacs',
};
export type MartinizeStep = 'init' | 'internal' | 'martinize-end' | 'contacts' | 'go-sites' | 'gromacs';

window.DEBUG = {};

declare global {
  interface Window {
    DEBUG: any;
  }
}
