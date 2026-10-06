// Local dev server. For production, deploy src/handler.js as a serverless
// function (Vercel / Cloudflare Workers / etc.) — it has no Express dependency.

import express from "express";
import { config } from "./src/config.js";
import { handleShows, handleHealth } from "./src/handler.js";

const app = express();

app.get("/api/health", handleHealth);
app.get("/api/shows", handleShows);

app.listen(config.port, () => {
  console.log(`HereFM backend on http://localhost:${config.port} (mock=${config.mock})`);
});
