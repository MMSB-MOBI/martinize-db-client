import ApiHelper, { APIError } from "./ApiHelper";

export function errorToText(error: [any, APIError] | APIError | number) {
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
    default:
      return "Unknown error";
  }
}

export function setPageTitle(title?: string, absolute = false) {
  if (!absolute)
    document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
  else
    document.title = title!;
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
