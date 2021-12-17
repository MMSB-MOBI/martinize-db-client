import ApiHelper, { APIError } from "./ApiHelper";
import { CategoryTree } from "./types/settings";
import React from 'react';
import { toast } from "./components/Toaster";
import { Icon } from "@material-ui/core";
import { MartinizeFiles } from './components/Builder/Builder'
import { ReadedJobDoc } from './types/entities'

export function errorToText(error: [any, APIError] | APIError | number | undefined) {
  if (!error) {
    return "Server error.";
  }

  let code: number;
  if (Array.isArray(error)) {
    code = error[1].code;
  }
  else if (typeof error === 'number') {
    code = error;
  }
  else {
    code = error.code;
  }

  switch (code) {
    case 1:
      return "Server error.";
    case 101:
      return "Page not found.";
    case 102:
      return "User not found.";
    case 103:
      return "Element not found;";
    case 201:
    case 204:
      return "You don't have the right to do that.";
    case 202:
      return "Your credentials are invalid or expired.";
    case 203:
      return "Invalid password.";
    case 205:
      return "Your account hasn't been approved yet.";
    case 301:
      return "Request is badly formatted.";
    case 302:
      return "Missing parameters to request.";
    case 303:
      return "This username already exists.";
    case 304:
      return "This e-mail already exists.";
    case 305:
      return "Invalid HTTP method (this message should not appear, maybe the API version is different from the client).";
    case 306:
      return "You try to upload too many files. Please respect the allowed number of files.";
    case 307:
      return "One file is too large. Please take care of file size limit.";
    case 308:
      return "Molecule files are invalid. PDB/GRO does not match the provided system, or your files are incorrectly formatted.";
    case 309:
      return "Some needed files are missing. A single PDB plus at least one ITP is required.";
    case 310:
      return "The molecule parent is unknown. Maybe it has been deleted.";
    case 311:
      return "Molecule name contains forbidden characters.";
    case 312:
      return "Molecule alias contains forbidden characters.";
    case 313:
      return "Molecule version contains forbidden characters.";
    case 314:
      return "Molecule category does not exists.";
    case 315:
      return "This molecule name is already taken.";
    case 316:
      return "This molecule alias is already taken.";
    case 317:
      return "This version already already exists. Please use an alternate version number.";
    case 318:
      return "Martinize version does not exists.";
    case 319:
      return "Force field does not exists.";
    case 320:
      return "You can't edit a molecule that does not exists.";
    case 321:
      return "This username contains invalid characters, or its length is less than 2 characters.";
    case 322:
      return "Email address is invalid.";
    case 401:
      return "Martinize program failed with an exit code.";
    default: {
      if (Array.isArray(error)) {
        return error[1].message + ".";
      }
      else if (typeof error !== 'number') {
        return error.message + ".";
      }
      return `Unknown error (code ${code})`;
    }
  }
}

export function loginErrorToText(code: number) {
  switch (code) {
    case 102:
      return "User not found";
    case 203:
      return "Invalid password";
    case 205:
      return "Your account hasn't been approved yet";
    default: 
      return "Unknown error";
  }
}

export function errorToType(error :  [any, APIError]){
  if (Array.isArray(error)) {
    return error[1].type
  }
  return undefined
}

export function setPageTitle(title?: string, absolute = false, set_app_bar_name = false) {
  if (!absolute)
    document.title = "MAD" + (title ? ` - ${title}` : '');
  else
    document.title = title!;

  if (set_app_bar_name) {
    // @ts-ignore
    window.dispatchEvent(new CustomEvent('app-bar.title-change', { detail: title }));
  }
}

export function rejectCodeOrUndefined(e: any) {
  if (Array.isArray(e) && ApiHelper.isApiError(e[1])) {
    return Promise.reject(e[1].code);
  }
  return Promise.reject();
}

export function throwCodeOrUndefined(e: any) {
  if (Array.isArray(e) && ApiHelper.isApiError(e[1])) {
    throw e[1].code;
  }
  // eslint-disable-next-line
  throw undefined;
}

export function flattenCategoryTree(cat: CategoryTree) {
  const categories: { id: string, name: string }[] = [];

  for (const node in cat) {
    const id = node;
    const name = cat[node].name;

    categories.push({ id, name });

    if (cat[node].children) {
      categories.push(...flattenCategoryTree(cat[node].children));
    }
  }

  return categories;
}

export function findInCategoryTree(cat: CategoryTree, id: string) : string {
  for (const node in cat) {
    if (node === id) {
      return cat[node].name;
    }
    if (cat[node].children) {
      const occurence = findInCategoryTree(cat[node].children, id);
      if (occurence !== id) {
        return occurence;
      }
    }
  }

  return id;
}

export function Marger(props: { size: number | string }) {
  return <div style={{ width: '100%', height: props.size }} />;
}

export function notifyError(error: APIError | [any, APIError | undefined] | undefined) : void {
  if (Array.isArray(error)) {
    return notifyError(error[1]);
  }

  console.error(error);
  toast(errorToText(error), "error");
}

/**
 * Formate un objet Date en chaîne de caractères potable.
 * Pour comprendre les significations des lettres du schéma, se référer à : http://php.net/manual/fr/function.date.php
 * @param schema string Schéma de la chaîne. Supporte Y, m, d, g, H, i, s, n, N, v, z, w
 * @param date Date Date depuis laquelle effectuer le formatage
 * @returns string La chaîne formatée
 */
export function dateFormatter(schema: string, date = new Date()) : string {
  function getDayOfTheYear(now: Date): number {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);

    return day - 1; // Retourne de 0 à 364/365
  }

  const Y = date.getFullYear();
  const N = date.getDay() === 0 ? 7 : date.getDay();
  const n = date.getMonth() + 1;
  const m = (n < 10 ? "0" : "") + String(n);
  const d = ((date.getDate()) < 10 ? "0" : "") + String(date.getDate());
  const L = Y % 4 === 0 ? 1 : 0;

  const i = ((date.getMinutes()) < 10 ? "0" : "") + String(date.getMinutes());
  const H = ((date.getHours()) < 10 ? "0" : "") + String(date.getHours());
  const g = date.getHours();
  const s = ((date.getSeconds()) < 10 ? "0" : "") + String(date.getSeconds());

  const replacements: any = {
    Y, m, d, i, H, g, s, n, N, L, v: date.getMilliseconds(), z: getDayOfTheYear, w: date.getDay()
  };

  let str = "";

  // Construit la chaîne de caractères
  for (const char of schema) {
    if (char in replacements) {
      if (typeof replacements[char] === 'string') {
        str += replacements[char];
      }
      else if (typeof replacements[char] === 'number') {
        str += String(replacements[char]);
      }
      else {
        str += String(replacements[char](date));
      }
    }
    else {
      str += char;
    }
  }

  return str;
}


export function FaIcon(props: any) {
  let icon: string = "";
  let injected: any = {};

  for (const k in props) {
    if (props[k] === true) {
      icon = k;
    }
    else {
      injected[k] = props[k];
    }
  }

  return (
    <Icon className={"fas fa-" + icon} {...injected} />
  );
}

export function downloadBlob(file: Blob, filename: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.download = filename;
  link.href = url;

  document.body.appendChild(link);

  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 1500);

}


export async function loadMartinizeFiles(job: ReadedJobDoc) : Promise<MartinizeFiles> {
  const files = job.files
  const itps = files.itp_files.map((mol_itp, mol_idx) => mol_itp.map(itp => ({name : itp.name, type : itp.type, content : new File([itp.content], itp.name), mol_idx})) ).flat()

  return {
    radius : job.radius,
    pdb : {name : files.coarse_grained.name, type : files.coarse_grained.type, content : new File([files.coarse_grained.content], files.coarse_grained.name)},
    itps, 
    top : {name : files.top_file.name, type : files.top_file.type, content : new File([files.top_file.content], files.top_file.name)},

  }
}

export function getErrorMsgFromValidationError(errors : any[]) : string{
  const errorMsgMap = errors.map(e => { 
    if(e.property && e.property === "originalname" && e.constraints) { //it's multer error about file name
      return `Your file name is invalid : ${Object.values(e.constraints)[0]}`
    } 
    if(e.constraints) return Object.values(e.constraints[0])
    else return ''
  })

  return errorMsgMap.join("\n")

}
