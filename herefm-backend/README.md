# HereFM backend

Serves live local concert data to the HereFM tuner. One endpoint:

```
GET /api/shows?lat=49.28&lon=-123.12&city=Vancouver&radiusKm=40&days=14&enrich=1
```

Response:

```json
{
  "city": "Vancouver",
  "source": "ticketmaster",
  "generatedAt": "...",
  "shows": [
    {
      "name": "Daniel Caesar",
      "dateTime": "2026-10-08T03:00:00Z",
      "venue": { "name": "Rogers Arena", "city": "Vancouver", "lat": 49.27, "lon": -123.1 },
      "artists": [
        {
          "name": "Daniel Caesar",
          "spotifyId": "20wkVLutqVOYrc0LB1qMVM",
          "spotifyUrl": "https://open.spotify.com/artist/20wkVLutqVOYrc0LB1qMVM",
          "match": "ticketmaster"
        }
      ],
      "ticketUrl": "https://...",
      "priceMin": 65, "priceMax": 180, "currency": "CAD"
    }
  ]
}
```

## Spotify matching (`match` field)

- `ticketmaster` — Ticketmaster's own data linked the Spotify artist ID. Trusted.
- `override` — hand-verified in `src/spotify.js` `OVERRIDES`. Add entries for artists the search gets wrong.
- `search-high` / `search-medium` / `search-low` — Spotify search fallback: exact-ish name match, highest popularity wins, tribute/cover acts excluded. `low` = worth a human glance.
- `unresolved` — no confident match; `unresolved-no-spotify-creds` means Spotify keys aren't set yet.

## Setup

```bash
npm install
```

Copy your keys into the environment (never commit them):

```bash
export TICKETMASTER_API_KEY=your_consumer_key        # developer.ticketmaster.com -> My Apps
export SPOTIFY_CLIENT_ID=...                          # developer.spotify.com/dashboard
export SPOTIFY_CLIENT_SECRET=...
```

Run:

```bash
npm start            # live mode (needs TICKETMASTER_API_KEY)
npm run dev          # MOCK=1 — sample data, no keys needed
```

Without `TICKETMASTER_API_KEY` the server automatically serves mock data, so the frontend works before keys exist.

## Notes

- Results are cached in memory for 1 hour (`CACHE_TTL_MS`) — well under Ticketmaster's free tier (5,000 calls/day).
- Spotify artist IDs are cached for 7 days; enrichments (image, top tracks) for 24h.
- `enrich=1` adds each artist's image, genres, and top 5 tracks (needs Spotify creds).
- `src/handler.js` has zero framework dependencies — deploy it as a serverless function (Vercel, Cloudflare Workers) for production; `server.js` is just the local Express wrapper.
