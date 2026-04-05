export const CLIENT_ID_STORAGE_KEY = "sp:clientId";

let cachedClientId: string | null = null;

function tryGetLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Access to localStorage can throw in some environments (e.g., disabled or restricted)
  }
  return null;
}

function readFromLocalStorage(key: string): string | null {
  const ls = tryGetLocalStorage();
  if (!ls) return null;
  try {
    return ls.getItem(key);
  } catch {
    return null;
  }
}

function writeToLocalStorage(key: string, value: string): boolean {
  const ls = tryGetLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [k, v] = cookie.split("=");
    if (k === name) return v ? decodeURIComponent(v) : null;
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 365): boolean {
  if (typeof document === "undefined") return false;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax; max-age=${maxAgeSeconds}`;
    return true;
  } catch {
    return false;
  }
}

function generateRandomId(): string {
  const globalCrypto = (typeof crypto !== "undefined" ? crypto : undefined) as
    | {
        randomUUID?: () => string;
        getRandomValues?: (arr: Uint8Array) => Uint8Array;
      }
    | undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  // Fallback: RFC4122-ish v4 UUID polyfill
  const bytes = new Uint8Array(16);
  if (globalCrypto?.getRandomValues) {
    globalCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Set version and variant bits (defensively handle unchecked indexed access)
  const b6 = (bytes[6] ?? 0) & 0xff;
  const b8 = (bytes[8] ?? 0) & 0xff;
  bytes[6] = (b6 & 0x0f) | 0x40; // version 4
  bytes[8] = (b8 & 0x3f) | 0x80; // variant 10
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const bth = Array.from(bytes, toHex);
  return `${bth[0]}${bth[1]}${bth[2]}${bth[3]}-${bth[4]}${bth[5]}-${bth[6]}${bth[7]}-${bth[8]}${bth[9]}-${bth[10]}${bth[11]}${bth[12]}${bth[13]}${bth[14]}${bth[15]}`;
}

export function getOrCreateClientId(customStorageKey?: string): string {
  if (cachedClientId) return cachedClientId;

  const key = customStorageKey ?? CLIENT_ID_STORAGE_KEY;

  // Try localStorage first
  let id = readFromLocalStorage(key);
  if (!id) {
    // Try cookie fallback
    id = readCookie(key);
  }
  if (!id) {
    id = generateRandomId();
    // Best-effort persistence
    const persisted = writeToLocalStorage(key, id) || writeCookie(key, id);
    if (!persisted) {
      // Still cache in-memory so a single-page session shares the same id
    }
  }

  cachedClientId = id;
  return id;
}
