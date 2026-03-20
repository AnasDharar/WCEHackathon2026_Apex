const STORAGE_KEY = "manah_arogya_user_session_v1";

function firstNameFromName(name, email) {
  const normalizedName = String(name || "").trim();
  if (normalizedName) {
    return normalizedName.split(/\s+/)[0];
  }

  const localPart = String(email || "").split("@", 1)[0].trim();
  if (!localPart) {
    return "User";
  }

  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) {
    return "User";
  }
  const first = cleaned.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function normalizeUserSession(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = String(raw.id || raw.uid || "").trim();
  const email = String(raw.email || "").trim().toLowerCase();
  const name = String(raw.name || raw.displayName || "").trim();

  if (!id && !email && !name) {
    return null;
  }

  return {
    id: id || `user-${email || "guest"}`,
    email,
    name: name || firstNameFromName("", email),
    first_name: String(raw.first_name || raw.firstName || "").trim() || firstNameFromName(name, email),
    role: String(raw.role || "user").trim(),
  };
}

export function saveUserSession(user) {
  if (typeof window === "undefined") {
    return null;
  }

  const normalized = normalizeUserSession(user);
  if (!normalized) {
    return null;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getUserSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeUserSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearUserSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export { firstNameFromName };
