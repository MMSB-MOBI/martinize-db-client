import ApiHelper, { APIError } from "./ApiHelper";
import { CategoryTree } from "./types/settings";
import React from 'react';
import { toast } from "./components/Toaster";

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
      return "Server error";
    case 101:
      return "Page not found";
    case 102:
      return "User not found";
    case 203:
      return "Invalid password";
    case 302:
      return "Missing parameters to request";
    default:
      return "Unknown error";
  }
}

export function loginErrorToText(code: number) {
  switch (code) {
    case 102:
      return "User not found";
    case 203:
      return "Invalid password";
    default: 
      return "Unknown error";
  }
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
