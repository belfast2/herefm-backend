// GET /api/artist-top?spotifyId=<id>
// Returns the artist's public Spotify details: image, genres, top tracks.
// Used by the HereFM frontend to fill a card's flip view on demand.

import { enrichArtist } from "../src/spotify.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const spotifyId = req.query.spotifyId || req.query.id;
  if (!spotifyId) return res.status(400).json({ error: "spotifyId required" });

  const creds = {
    clientId: process.env.SPOTIFY_CLIENT_ID || "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
  };
  if (!creds.clientId || !creds.clientSecret) {
    return res.status(503).json({ error: "spotify not configured" });
  }

  try {
    const details = await enrichArtist(spotifyId, creds);
    if (!details) return res.status(404).json({ error: "artist not found" });
    return res.json(details);
  } catch (err) {
    console.error("artist-top error:", err.message);
    return res.status(502).json({ error: "spotify request failed" });
  }
}
