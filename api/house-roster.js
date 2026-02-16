export default async function handler(req, res) {
  try {
    const url = "https://clerk.house.gov/xml/lists/MemberData.xml";

    const r = await fetch(url, {
      headers: {
        "User-Agent": "house-vote-calculator",
        "Accept": "application/xml,text/xml,*/*",
      },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("Clerk HTTP " + r.status);

    const xml = await r.text();

    // Non-voting Delegates / Resident Commissioner jurisdictions
    const NON_VOTING = new Set(["DC", "PR", "VI", "GU", "AS", "MP"]);

    // MemberData.xml is typically a set of <member> ... </member> records.
    const memberBlocks = [...xml.matchAll(/<member\b[^>]*>[\s\S]*?<\/member>/gi)].map(m => m[0]);

    let dSeats = 0;
    let rSeats = 0;

    for (const block of memberBlocks) {
      const state = (block.match(/<state>\s*([^<]+?)\s*<\/state>/i)?.[1] || "").trim().toUpperCase();
      if (NON_VOTING.has(state)) continue;

      const partyRaw = (block.match(/<party>\s*([^<]+?)\s*<\/party>/i)?.[1] || "").trim().toUpperCase();

      // Handle D/R, and also Democratic/Republican just in case
      if (partyRaw === "D" || partyRaw.startsWith("DEM")) dSeats++;
      else if (partyRaw === "R" || partyRaw.startsWith("REP")) rSeats++;
    }

    const totalSeats = 435;
    const vacancies = Math.max(totalSeats - (dSeats + rSeats), 0);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalSeats,
      vacancies,
      dSeats,
      rSeats,
    });
  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({
      updatedAt: new Date().toISOString(),
      error: String(e?.message || e),
      totalSeats: 435,
      vacancies: 0,
      dSeats: 0,
      rSeats: 0,
    });
  }
}
