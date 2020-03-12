
export const DEBUG_MODE: boolean = process.env.NODE_ENV !== 'production';
export const SERVER_ROOT = DEBUG_MODE ? "http://localhost:4123/" : "/";
export const API_URL = SERVER_ROOT + "api/";

window.DEBUG = {};

declare global {
  interface Window {
    DEBUG: any;
  }
}
