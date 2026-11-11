import { API_BASE } from './apiClient.js';
import useCogniStore from '../store/useCogniStore';
import { getStoredToken } from './authSession.js';

const INSTALLED_FLAG = '__cognicoreFetchIntercepted';

let baseNativeFetch = null;
const middlewares = [];

export function getAuthTokenFromStore() {
  const storeToken = useCogniStore.getState?.()?.token;
  if (storeToken) return storeToken;
  return getStoredToken();
}

function getHeaderCaseInsensitive(headers, name) {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  if (Array.isArray(headers)) {
    const pair = headers.find(([k]) => String(k).toLowerCase() === target);
    return pair ? pair[1] : undefined;
  }
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      return headers[key];
    }
  }
  return undefined;
}

function shouldAttachAuthHeader(url) {
  if (typeof url !== 'string') return false;
  if (url.includes('/api/')) return true;
  if (API_BASE && url.startsWith(API_BASE)) return true;
  return false;
}

export function withAuthHeaders(url, options = {}) {
  const nextOptions = options ? { ...options } : {};
  if (!shouldAttachAuthHeader(url)) {
    return nextOptions;
  }

  const token = getAuthTokenFromStore();
  if (!token) {
    return nextOptions;
  }

  if (typeof Headers !== 'undefined' && nextOptions.headers instanceof Headers) {
    const headers = new Headers(nextOptions.headers);
    if (!headers.get('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    nextOptions.headers = headers;
    return nextOptions;
  }

  const existingAuth = getHeaderCaseInsensitive(nextOptions.headers, 'Authorization');
  if (!existingAuth) {
    nextOptions.headers = {
      ...(nextOptions.headers || {}),
      Authorization: `Bearer ${token}`
    };
  }
  return nextOptions;
}

export function performNativeFetch(url, options) {
  const targetFetch = baseNativeFetch || (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);
  if (!targetFetch) {
    return Promise.reject(new Error('Fetch API is not available in this environment.'));
  }
  const enrichedOptions = withAuthHeaders(url, options);
  return targetFetch(url, enrichedOptions);
}

export function installFetchInterceptor() {
  if (typeof window === 'undefined') return;
  const currentFetch = window.fetch || globalThis.fetch;
  if (!currentFetch || currentFetch[INSTALLED_FLAG]) return;

  baseNativeFetch = currentFetch;

  const unifiedFetch = async function (resource, init) {
    if (typeof resource !== 'string') {
      return baseNativeFetch.call(this, resource, init);
    }

    let url = resource;
    let options = withAuthHeaders(url, init);

    const ordered = [...middlewares].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    for (const mw of ordered) {
      if (typeof mw.beforeRequest === 'function') {
        const result = await mw.beforeRequest({ url, options });
        if (result && result.options) {
          options = result.options;
        }
      }
    }

    let response = null;
    for (const mw of ordered) {
      if (typeof mw.handleRequest === 'function') {
        response = await mw.handleRequest({ url, options, nativeFetch: baseNativeFetch });
        if (response) break;
      }
    }

    if (!response) {
      response = await baseNativeFetch.call(this, url, options);
    }

    for (const mw of ordered) {
      if (typeof mw.afterResponse === 'function') {
        await mw.afterResponse({ url, options, response });
      }
    }

    return response;
  };

  unifiedFetch[INSTALLED_FLAG] = true;
  window.fetch = unifiedFetch;
}

export function registerFetchMiddleware(middleware) {
  installFetchInterceptor();
  if (!middleware) return () => {};

  if (middleware.id) {
    const existingIdx = middlewares.findIndex((m) => m.id === middleware.id);
    if (existingIdx !== -1) {
      middlewares.splice(existingIdx, 1);
    }
  }
  middlewares.push(middleware);

  return () => {
    const idx = middlewares.indexOf(middleware);
    if (idx !== -1) {
      middlewares.splice(idx, 1);
    }
  };
}
