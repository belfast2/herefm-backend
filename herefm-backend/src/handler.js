// GET /api/shows?lat=..&lon=..&radiusKm=..&days=..&city=..
// Returns the normalized payload the HereFM tuner consumes:
// { city, source, generatedAt, shows: [ { name, dateTime, venue, artists[], ... } ] }
// Each artist carries: name, spotifyId, spotifyUrl, match
//   match = ticketmaster | override | search-high/medium/low | unresolved[-reason]

import { config } from "./config.js";
import { get as cacheGet, set as cacheSet, cacheKey } from "./cache.js";
import { fetchEvents, normalizeEvent } from "./ticketmaster.js";
import { resolveArtist, enrichArtist } from "./spotify.js";
import { mockShows } from "./mock.js";

function badRequest(res, message) {
  res.status(400).json({ error: message });
}

export async function handleShows(req, res) {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radiusKm = parseFloat(req.query.radiusKm) || config.defaultRadiusKm;
  const days = Math.min(parseInt(req.query.days) || config.defaultDays, 60);
  const city = req.query.city || "your city";
  const enrich = req.query.enrich === "1";

  if (config.mock || !config.ticketmasterKey) {
    // Mock mode doubles as the no-keys-yet mode.
    return res.json(mockShows(city));
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return badRequest(res, "lat and lon query params are required");
  }

  const key = cacheKey(["shows", lat.toFixed(2), lon.toFixed(2), radiusKm, days, enrich]);
  const cached = cacheGet(key);
  if (cached) return res.json(cached);

  try {
    const raw = await fetchEvents({ lat, lon, radiusKm, days, apiKey: config.ticketmasterKey });
    const creds = { clientId: config.spotifyClientId, clientSecret: config.spotifyClientSecret };

    const shows = [];
    for (const e of raw.slice(0, config.maxEvents)) {
      const show = normalizeEvent(e);
      if (show.status === "cancelled" || show.status === "offsale") continue;
      const artists = [];
      for (const a of show.artists.slice(0, 4)) {
        const resolved = await resolveArtist(a, creds);
        if (enrich && resolved.spotifyId) {
          resolved.details = await enrichArtist(resolved.spotifyId, creds);
        }
        artists.push(resolved);
      }
      show.artists = artists;
      shows.push(show);
      if (shows.length >= 40) break;
    }

    const payload = {
      city,
      source: "ticketmaster",
      generatedAt: new Date().toISOString(),
      shows,
    };
    cacheSet(key, payload, config.cacheTtlMs);
    res.json(payload);
  } catch (err) {
    console.error("shows handler error:", err.message);
    res.status(502).json({ error: "upstream fetch failed", detail: err.message });
  }
}

// GET /api/health
export function handleHealth(_req, res) {
  res.json({
    ok: true,
    mock: config.mock,
    hasTicketmasterKey: Boolean(config.ticketmasterKey),
    hasSpotifyCreds: Boolean(config.spotifyClientId && config.spotifyClientSecret),
  });
}
