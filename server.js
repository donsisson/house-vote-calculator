// server.js (CommonJS) - fetches Clerk /Members totals and returns JSON
const express = require("express");
const cors = require("cors");

// node-fetch v3 is ESM-only; wrapper works in CommonJS:
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());

const CLERK_MEMBERS_PAGE = "https://clerk.house.gov/Members";

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCount(text, label) {
  // Matches: "Republicans 218" / "Democrats 214" / "Vacancies 3"
  const re = new RegExp(`\\b${label}\\b\\s*(\\d{1,3})\\b`, "i");
  const m = text.match(re);
  return m ? parseInt(m[1], 10) : null;
}

app.get("/api/house-roster", async (_req, res) => {
  try {
    const r = await fetch(CLERK_MEMBERS_PAGE, { headers: { "User-Agent": "house-vote-calculator" } });
    if (!r.ok) return res.status(502).json({ error: `Clerk fetch failed: ${r.status}` });

    const html = await r.text();
    const text = htmlToText(html);

    const rSeats = extractCount(text, "Republicans");
    const dSeats = extractCount(text, "Democrats");
    const vacancies = extractCount(text, "Vacancies");

    if (rSeats === null || dSeats === null || vacancies === null) {
      return res.status(500).json({
        error: "Could not parse totals from Clerk /Members page.",
        debugHint: "Open https://clerk.house.gov/Members and confirm it lists Republicans, Democrats, Vacancies with numbers."
      });
    }

    res.json({
      updatedAt: new Date().toISOString(),
      totalSeats: 435,
      vacancies,
      dSeats,
      rSeats
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(8787, () => console.log("Proxy running on http://localhost:8787"));
