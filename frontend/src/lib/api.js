import { getUserSession } from "@/lib/userSession";

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api/v1" : "/api/v1");

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

function toUrl(path, params) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // In production API_BASE_URL is "/api/v1". new URL("/api/v1/...", ...) needs a base if it's relative
  // If API_BASE_URL is absolute (starts with http), this will work normally.
  // If it's relative, we use the current window origin in the browser, or a dummy base if on server side.
  const isServer = typeof window === "undefined";
  const baseUrlForConstructor = API_BASE_URL.startsWith("http")
    ? API_BASE_URL
    : (isServer ? "http://localhost:3000" : window.location.origin);

  let url;
  try {
    url = new URL(`${API_BASE_URL}${normalizedPath}`, baseUrlForConstructor);
  } catch (e) {
    // Fallback if URL construction still fails
    url = new URL(`${API_BASE_URL}${normalizedPath}`, "http://localhost");
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function parseError(res, payload) {
  if (payload && typeof payload === "object") {
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (typeof payload.message === "string") {
      return payload.message;
    }
    if (typeof payload.error === "string") {
      return payload.error;
    }
  }

  return `Request failed with status ${res.status}`;
}

function getIdentityHeaders() {
  const user = getUserSession();
  if (!user) {
    return {};
  }

  const headers = {};
  if (user.id) {
    headers["X-User-Id"] = user.id;
  }
  if (user.name) {
    headers["X-User-Name"] = user.name;
  }
  if (user.first_name) {
    headers["X-User-First-Name"] = user.first_name;
  }
  if (user.email) {
    headers["X-User-Email"] = user.email;
  }
  return headers;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    headers = {},
    token,
    cache = "no-store",
  } = options;

  const finalHeaders = { ...getIdentityHeaders(), ...headers };
  const init = {
    method,
    headers: finalHeaders,
    cache,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(toUrl(path, params), init);
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(parseError(res, payload));
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  baseUrl: API_BASE_URL,
  request,
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body }),
  patch: (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options = {}) =>
    request(path, { ...options, method: "PUT", body }),
  remove: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
};
