// Ticketmaster Discovery API v2 — event search by coordinates.
// Free tier: 5,000 calls/day, 5 req/sec. Docs:
// https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

const BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

function isoRange(days) {
  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    startDateTime: start.toISOString().split(".")[0] + "Z",
    endDateTime: end.toISOString().split(".")[0] + "Z",
  };
}

export async function fetchEvents({ lat, lon, radiusKm, days, apiKey }) {
  const { startDateTime, endDateTime } = isoRange(days);
  const params = new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lon}`,
    radius: String(radiusKm),
    unit: "km",
    classificationName: "music",
    startDateTime,
    endDateTime,
    sort: "date,asc",
    size: "100",
    includeTBA: "no",
    includeTBD: "no",
  });

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ticketmaster ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data._embedded?.events ?? [];
}

// Pull the artist names + any Spotify IDs Ticketmaster already knows.
// externalLinks.spotify[].url looks like
// https://open.spotify.com/artist/<id> — the ID is the reliable bit.
export function extractArtists(tmEvent) {
  const out = [];
  const seen = new Set();
  for (const a of tmEvent._embedded?.attractions ?? []) {
    const name = (a.name || "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    let spotifyId = null;
    for (const link of a.externalLinks?.spotify ?? []) {
      const m = /open\.spotify\.com\/artist\/([A-Za-z0-9]+)/.exec(link.url || "");
      if (m) {
        spotifyId = m[1];
        break;
      }
    }
    out.push({ name, spotifyId, tmAttractionId: a.id || null });
  }
  return out;
}

export function normalizeEvent(tmEvent) {
  const venue = tmEvent._embedded?.venues?.[0] ?? {};
  return {
    source: "ticketmaster",
    sourceId: tmEvent.id,
    name: tmEvent.name,
    dateTime: tmEvent.dates?.start?.dateTime || null,
    date: tmEvent.dates?.start?.localDate || null,
    time: tmEvent.dates?.start?.localTime || null,
    venue: {
      name: venue.name || null,
      city: venue.city?.name || null,
      lat: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      lon: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
    },
    artists: extractArtists(tmEvent),
    ticketUrl: tmEvent.url || null,
    priceMin: tmEvent.priceRanges?.[0]?.min ?? null,
    priceMax: tmEvent.priceRanges?.[0]?.max ?? null,
    currency: tmEvent.priceRanges?.[0]?.currency || null,
    status: tmEvent.dates?.status?.code || null,
    image: tmEvent.images?.find((i) => i.ratio === "16_9")?.url || tmEvent.images?.[0]?.url || null,
  };
}
