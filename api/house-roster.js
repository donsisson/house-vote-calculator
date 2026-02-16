export default async function handler(req, res) {
  try {
    const url = "https://clerk.house.gov/xml/lists/MemberData.xml";
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Clerk HTTP " + r.status);

    const xml = await r.text();

    // Grab each <member>...</member> block
    const members = xml.match(/<member\b[^>]*>[\s\S]*?<\/member>/gi) || [];

    // Territories / non-voting delegations to EXCLUDE from the 435
    const EXCLUDE = new Set(["DC", "PR", "GU", "VI", "AS", "MP"]);

    let dSeats = 0;
    let rSeats = 0;
    let iSeats = 0;

    for (const m of members) {
      const state = (m.match(/<state>\s*([^<]+)\s*<\/state>/i)?.[1] || "").trim().toUpperCase();
      if (!state || EXCLUDE.has(state)) continue;

      const party = (m.match(/<party>\s*([^<]+)\s*<\/party>/i)?.[1] || "").trim().toUpperCase();

      if (party === "D") dSeats++;
      else if (party === "R") rSeats++;
      else if (party === "I") iSeats++;
    }

    const totalSeats = 435;
    const filled = dSeats + rSeats + iSeats;
    const vacancies = Math.max(totalSeats - filled, 0);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalSeats,
      vacancies,
      dSeats,
      rSeats,
      iSeats,
      filled
    });
  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      updatedAt: new Date().toISOString(),
      error: String(e?.message || e),
      totalSeats: 435,
      vacancies: 0,
      dSeats: 0,
      rSeats: 0,
      iSeats: 0,
      filled: 0
    });
  }
}
