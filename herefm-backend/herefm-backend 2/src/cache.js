// Tiny in-memory TTL cache. Event listings change slowly — an hour of
// caching keeps us far under Ticketmaster's free-tier limits.

const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheKey(parts) {
  return parts.map((p) => String(p)).join("|");
}
