// Configuration — read from environment, never committed.
// Required for live data:
//   TICKETMASTER_API_KEY   Consumer Key from developer.ticketmaster.com
// Optional (enables Spotify search fallback for artists TM doesn't link):
//   SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET  from developer.spotify.com/dashboard
// Mock mode (no keys needed):
//   MOCK=1  -> serves sample data shaped exactly like live output

export const config = {
  ticketmasterKey: process.env.TICKETMASTER_API_KEY || "",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
  mock: process.env.MOCK === "1",
  port: parseInt(process.env.PORT || "8787", 10),
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || String(60 * 60 * 1000), 10), // 1h
  defaultRadiusKm: 40,
  defaultDays: 14,
  maxEvents: 60,
};
