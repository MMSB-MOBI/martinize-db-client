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
