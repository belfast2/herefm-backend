// Vercel serverless function — thin wrapper around src/handler.js.
// Env vars (set in the Vercel dashboard, never committed):
//   TICKETMASTER_API_KEY, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

import { handleShows, handleHealth } from "../src/handler.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.query.health === "1") return handleHealth(req, res);
  return handleShows(req, res);
}
