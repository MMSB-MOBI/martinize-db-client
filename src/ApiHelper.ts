import Settings from "./Settings";
import { API_URL, DEBUG_MODE } from "./constants";

const LATENCY_ON_EVERY_REQUEST = 500;

export interface RequestPromise<T> extends Promise<T> {
  request: XMLHttpRequest;
}

export const ApiHelper = new class APIHelper {
  /**
   * Send a request to API.
   * If successful, Promise contains response content, parsed if JSON.
   * 
   * If request fails (JSON parse error, API error), return a **tuple** with 2 elements of type
   * `[Response, any]`: First element is a Response object, second one is the error.
   * If error is an object with a .code attribute and a .error attribute, 
   * this is a APIError, not a JSON parse error.
   * 
   * You can check this with a `ApiHelper.isApiError(error): error is APIError`.
   * 
   * You can force the return of the response, even if the request is successful, 
   * by including `{ full: true }` in the `settings` object.
   */
  async request(
    url: string,
    settings: {
      parameters?: { [key: string]: any },
      method?: "GET" | "POST" | "PUT" | "DELETE",
      mode?: 'json' | 'text',
      headers?: { [key: string]: string } | Headers,
      body_mode?: 'form-encoded' | 'multipart' | 'json',
      auth?: boolean | string,
      full?: boolean,
      latency?: number,
    } = {}
  ): Promise<any> {
    settings = Object.assign({}, { 
      method: 'GET',
      parameters: {}, 
      mode: 'json',
      body_mode: 'json',
      auth: true,
      headers: {},
      latency: LATENCY_ON_EVERY_REQUEST,
    }, settings);
    
    let fullurl = API_URL + url;

    if (!settings.parameters) {
      settings.parameters = {};
    }
    if (!settings.method) {
      settings.method = "GET";
    }

    // Build parameters
    let fd: FormData | string | undefined = undefined;

    if (Object.keys(settings.parameters).length) {
      // Encodage dans la query
      if (settings.method === "GET" || settings.method === "DELETE") {
        const queries = [] as string[];
        for (const [key, value] of Object.entries(settings.parameters)) {
          queries.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        }
        fullurl += "?" + queries.join('&');
      }
      // Encodage POST (dans le body)
      else {
        // Si multipart (formdata)
        if (settings.body_mode && settings.body_mode === "multipart") {
          fd = new FormData();
  
          for (const [key, value] of Object.entries(settings.parameters)) {
            if (Array.isArray(value)) {
              for (const v of value) {
                fd.append(key, v);
              }
            }
            else {
              fd.append(key, value);
            }
          }
        }
        // Si www-form-encoded (ou par défault)
        else if (settings.body_mode === "form-encoded") {
          const buffer: string[] = [];

          for (const [key, value] of Object.entries(settings.parameters)) {
            buffer.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
          }

          fd = buffer.join('&');

          if (settings.headers instanceof Headers)
            settings.headers.append('Content-Type', 'application/x-www-form-urlencoded');
          else
            settings.headers!['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        // Sinon (json)
        else {
          fd = JSON.stringify(settings.parameters);
          if (settings.headers instanceof Headers)
            settings.headers.append('Content-Type', 'application/json');
          else
            settings.headers!['Content-Type'] = 'application/json';
        }
      }
    }

    if (settings.auth === "auto") {
      settings.auth = !!Settings.token;
    }

    if (settings.auth !== false) {
      if (!Settings.token && typeof settings.auth !== 'string') {
        console.warn("Could not authentificate request without token. Skipping auth header...");
      }
      else {
        const used_token = typeof settings.auth === 'string' ? settings.auth : Settings.token;

        if (settings.headers instanceof Headers) 
          settings.headers.set('Authorization', "Bearer " + used_token);
        else
          settings.headers!['Authorization'] = "Bearer " + used_token;
      }
    }

    if (settings.latency && DEBUG_MODE) {
      await new Promise(resolve => setTimeout(resolve, settings.latency));
    }

    return fetch(fullurl, {
      method: settings.method,
      body: fd,
      headers: settings.headers
    })
      .then(rspe => {
        if (settings.mode === "json") {
          if (rspe.headers.get('Content-Length') === "0") {
            return {};
          }

          var api_result: Promise<any>;
          if (rspe.ok) {
            api_result = rspe.json();
          }
          else {
            api_result = rspe.json()
              .catch(e => [rspe, e])
              .then(content => {
                if (Array.isArray(content)) {
                  // on a catché une erreur avec le JSON (content est un tableau)
                  // L'API ne renvoie jamais de tableau si ça a échoué
                  // On extrait l'erreur
                  [, content] = content;
                }
                // Sinon, erreur mais contenu API lisible, on renvoie le JSON parsé (dans content)
                
                // Renvoie quoiqu'il arrive une promise rejetée avec contenu et requête
                return Promise.reject([rspe, content]);
              })
          }

          // Inclut la requête avec le contenu
          if (settings.full) {
            return api_result.then(e => [rspe, e]);
          }
          
          return api_result;
        }
        else {
          return rspe.ok ? rspe.text().then(e => settings.full ? [rspe, e] : e) : rspe.text().then(d => Promise.reject([rspe, d]));
        }
      });
  }

  /**
   * Make a request without any parameter helper.
   * 
   * Can used with a timeout, and are abortable (uses XMLHttpRequest).
   * 
   * `XMLHttpRequest` is in `.request` property of the returned `Promise`.
   * 
   * @param url 
   * @param options 
   */
  rawRequest(url: string, options: {
    onprogress?: (percentage: number) => void,
    method?: string,
    body?: string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array> | null,
    type?: "arraybuffer" | "blob" | "document" | "json" | "text",
    timeout?: number,
    latency?: number,
    auth?: boolean | string,
    headers?: { [name: string]: string },
  } = {}) : RequestPromise<any> {
    options = Object.assign({}, {
      method: 'GET',
      type: 'blob',
      latency: LATENCY_ON_EVERY_REQUEST,
      auth: true,
      headers: {},
    }, options);

    const req = new XMLHttpRequest();

    // Create the request
    req.open(options.method!, API_URL + url, true);

    // Attach the progress event
    req.onprogress = event => {
      if (event.lengthComputable) {
        const percentage = (event.loaded / event.total) * 100;
        if (options.onprogress) {
          options.onprogress(percentage);
        }
      }
    };

    // Set the right response type
    req.responseType = options.type ?? "text";

    // Define timeout if any
    if (options.timeout) {
      req.timeout = options.timeout;
    }

    // Create the auth header if necessary
    if (options.auth !== false) {
      if (!Settings.token && typeof options.auth !== 'string') {
        console.warn("Could not authentificate request without token. Skipping auth header...");
      }
      else {
        const used_token = typeof options.auth === 'string' ? options.auth : Settings.token;

        options.headers!['Authorization'] = "Bearer " + used_token;
      }
    }

    // Set the user headers
    for (const [header, value] of Object.entries(options.headers!)) {
      req.setRequestHeader(header, value);
    }

    // START THE REQUEST
    // ----------------

    const res = new Promise((resolve, reject) => {
      req.onreadystatechange = () => {
        if (req.readyState === 4) {
          resolve(req.response);
        }
      };
      req.onerror = e => {
        reject(e);
      };
    }) as RequestPromise<any>;

    // Set the request inside the promise 
    // (as non-enumerable/configurable/writable)
    Object.defineProperty(res, 'request', {
      value: req,
    });

    if (options.latency && DEBUG_MODE) {
      setTimeout(() => {
        req.send(options.body);
      }, options.latency);
    }
    else {
      req.send(options.body);
    }

    return res;
  }

  isApiError(data: any) : data is APIError {
    return !!(data && typeof data.code === 'number' && typeof data.message === 'string');
  }

  isFullApiError(data: any) : data is [Response, APIError] {
    return Array.isArray(data) && this.isApiError(data[1]);
  }
}();

export interface APIError {
  message: string;
  code: number;
  detail?: any;
}

export default ApiHelper;
