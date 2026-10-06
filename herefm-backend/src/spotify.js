// Spotify artist resolution.
// Tier 1: Ticketmaster already gave us the Spotify ID — trust it.
// Tier 2: Spotify Search API (client-credentials flow) with disambiguation:
//   exact-ish name match, highest popularity wins, tribute/cover acts filtered.
// Tier 3: manual override table for known misses (grows over time).
// Docs: https://developer.spotify.com/documentation/web-api

import { get as cacheGet, set as cacheSet } from "./cache.js";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

// name (lowercased) -> spotifyId, for artists we've hand-verified.
const OVERRIDES = {
  // "some tricky act": "spotifyArtistId",
};

const TRIBUTE_RE = /\b(tribute|cover|tribute band|tribute act|tribute to)\b/i;

let tokenCache = null;

async function getToken(clientId, clientSecret) {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token ${res.status}`);
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.token;
}

function normalizeName(s) {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchArtist(name, token) {
  const params = new URLSearchParams({ q: name, type: "artist", limit: "10" });
  const res = await fetch(`${API}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists?.items ?? [];
}

// Pick the right artist: exact normalized name match preferred,
// highest popularity among matches, tribute/cover acts excluded.
// Returns { id, name, confidence } — confidence is high/medium/low.
export function pickArtist(candidates, name) {
  const want = normalizeName(name);
  const scored = [];
  for (const c of candidates) {
    if (TRIBUTE_RE.test(c.name)) continue;
    const got = normalizeName(c.name);
    const exact = got === want;
    const starts = got.startsWith(want) || want.startsWith(got);
    if (!exact && !starts) continue;
    scored.push({ c, exact, popularity: c.popularity ?? 0 });
  }
  scored.sort((a, b) => (b.exact - a.exact) || (b.popularity - a.popularity));
  const best = scored[0];
  if (!best) return null;
  return {
    id: best.c.id,
    name: best.c.name,
    confidence: best.exact && best.popularity >= 20 ? "high" : best.exact ? "medium" : "low",
  };
}

// Resolve one artist to a Spotify artist page.
// Input: { name, spotifyId } from Ticketmaster extraction.
export async function resolveArtist(artist, { clientId, clientSecret }) {
  const override = OVERRIDES[artist.name.toLowerCase()];
  if (override) {
    return { ...artist, spotifyId: override, spotifyUrl: artistUrl(override), match: "override" };
  }
  if (artist.spotifyId) {
    return { ...artist, spotifyUrl: artistUrl(artist.spotifyId), match: "ticketmaster" };
  }
  if (!clientId || !clientSecret) {
    return { ...artist, spotifyUrl: null, match: "unresolved-no-spotify-creds" };
  }
  const cacheKey = `spotify-artist:${normalizeName(artist.name)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...artist, ...cached };

  const token = await getToken(clientId, clientSecret);
  const candidates = await searchArtist(artist.name, token);
  const pick = pickArtist(candidates, artist.name);
  const result = pick
    ? { spotifyId: pick.id, spotifyUrl: artistUrl(pick.id), match: `search-${pick.confidence}` }
    : { spotifyId: null, spotifyUrl: null, match: "unresolved" };
  cacheSet(cacheKey, result, 7 * 24 * 60 * 60 * 1000); // artist IDs rarely change
  return { ...artist, ...result };
}

// Fetch public artist details (image, genres, top tracks) for the card UI.
export async function enrichArtist(spotifyId, { clientId, clientSecret }) {
  if (!spotifyId || !clientId || !clientSecret) return null;
  const cacheKey = `spotify-enrich:${spotifyId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const token = await getToken(clientId, clientSecret);
  const headers = { Authorization: `Bearer ${token}` };
  const [artistRes, tracksRes] = await Promise.all([
    fetch(`${API}/artists/${spotifyId}`, { headers }),
    fetch(`${API}/artists/${spotifyId}/top-tracks?market=CA`, { headers }),
  ]);
  if (!artistRes.ok) return null;
  const a = await artistRes.json();
  const tracks = tracksRes.ok ? (await tracksRes.json()).tracks ?? [] : [];
  const out = {
    image: a.images?.[0]?.url || null,
    genres: a.genres ?? [],
    followers: a.followers?.total ?? null,
    popularity: a.popularity ?? null,
    topTracks: tracks.slice(0, 5).map((t) => ({
      name: t.name,
      previewUrl: t.preview_url,
      spotifyUrl: t.external_urls?.spotify || null,
    })),
  };
  cacheSet(cacheKey, out, 24 * 60 * 60 * 1000);
  return out;
}

export function artistUrl(id) {
  return `https://open.spotify.com/artist/${id}`;
}
