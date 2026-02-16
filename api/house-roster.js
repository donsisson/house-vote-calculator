export default async function handler(req, res) {
  try {
    const url = "https://clerk.house.gov/xml/lists/MemberData.xml";
    const r = await fetch(url, {
      headers: {
        "User-Agent": "house-vote-calculator",
        "Accept": "application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!r.ok) throw new Error("Clerk HTTP " + r.status);

    const xml = await r.text();

    // Grab each <member>...</member> block
    const memberBlocks = xml.match(/<member\b[\s\S]*?<\/member>/gi) || [];

    let dSeats = 0, rSeats = 0, iSeats = 0, otherSeats = 0;

    for (const block of memberBlocks) {
      // Exclude non-voting members (Delegates + Resident Commissioner)
      const dm = block.match(/<district>\s*([^<]+?)\s*<\/district>/i);
      const district = (dm?.[1] || "").trim();

      if (district === "Delegate" || district === "Resident Commissioner") {
        continue;
      }

      const pm = block.match(/<party>\s*([^<]+?)\s*<\/party>/i);
      const party = (pm?.[1] || "").trim().toUpperCase();

      if (party === "D") dSeats++;
      else if (party === "R") rSeats++;
      else if (party === "I" || party === "IND") iSeats++;
      else if (party) otherSeats++;
    }

    const totalSeats = 435;
    const filled = dSeats + rSeats + iSeats + otherSeats;
    const vacancies = Math.max(totalSeats - filled, 0);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalSeats,
      vacancies,
      dSeats,
      rSeats,
      iSeats,
      otherSeats,
      filled,
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
      otherSeats: 0,
      filled: 0,
    });
  }
}
