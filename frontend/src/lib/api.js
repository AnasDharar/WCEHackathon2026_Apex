import axios from "axios";

import { getUserSession } from "@/lib/userSession";

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1"
    : "https://manaharogya.studymateai.tech/api/v1");

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

function getIdentityHeaders() {
  const user = getUserSession();
  if (!user) return {};

  const headers = {};
  if (user.id) headers["X-User-Id"] = user.id;
  if (user.name) headers["X-User-Name"] = user.name;
  if (user.first_name) headers["X-User-First-Name"] = user.first_name;
  if (user.email) headers["X-User-Email"] = user.email;
  return headers;
}

async function getFirebaseToken() {
  if (typeof window === "undefined") return null;
  try {
    const firebaseModule = await import("../../firebaseConfig");
    const auth = firebaseModule?.auth;
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

function parseSseEventBlock(block) {
  const lines = block.split("\n").filter(Boolean);
  let event = "message";
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim());
  }
  const dataRaw = dataLines.join("\n");
  let data = dataRaw;
  try {
    data = dataRaw ? JSON.parse(dataRaw) : null;
  } catch {
    data = dataRaw;
  }
  return { event, data };
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

async function request(method, path, options = {}) {
  const { params, body, headers = {}, signal } = options;
  const token = options.token || (await getFirebaseToken());

  const finalHeaders = {
    ...getIdentityHeaders(),
    ...headers,
  };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await client.request({
      method,
      url: path,
      params,
      data: body,
      headers: finalHeaders,
      signal,
    });
    return res.data;
  } catch (err) {
    const detail =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Request failed";
    const wrapped = new Error(detail);
    wrapped.status = err?.response?.status;
    wrapped.payload = err?.response?.data;
    throw wrapped;
  }
}

export const api = {
  baseUrl: API_BASE_URL,
  request: (path, options = {}) => request(options.method || "GET", path, options),
  get: (path, options = {}) => request("GET", path, options),
  post: (path, body, options = {}) => request("POST", path, { ...options, body }),
  patch: (path, body, options = {}) => request("PATCH", path, { ...options, body }),
  put: (path, body, options = {}) => request("PUT", path, { ...options, body }),
  remove: (path, options = {}) => request("DELETE", path, options),
  stream: async (path, options = {}) => {
    const { body, headers = {}, signal, onEvent } = options;
    const token = options.token || (await getFirebaseToken());

    const finalHeaders = {
      ...getIdentityHeaders(),
      ...headers,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    };
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "POST",
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Stream failed (${res.status})`);
    }
    if (!res.body) {
      throw new Error("Streaming not supported by browser/runtime.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const evt = parseSseEventBlock(part);
        if (typeof onEvent === "function") onEvent(evt);
      }
    }
  },
};
