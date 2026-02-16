export default async function handler(req, res) {
  try {
    // Pull the House roster XML from the Clerk (public endpoint)
    const url = "https://clerk.house.gov/xml/lists/MemberData.xml";
    const r = await fetch(url, {
      headers: { "User-Agent": "house-vote-calculator" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("Clerk HTTP " + r.status);

    const xml = await r.text();

    // Count party membership from XML
    // In MemberData.xml, party is typically in a <party> tag with values like "D" / "R"
    const dSeats = (xml.match(/<party>\s*D\s*<\/party>/g) || []).length;
    const rSeats = (xml.match(/<party>\s*R\s*<\/party>/g) || []).length;

    // Total seats in the House is fixed at 435
    const totalSeats = 435;

    // Vacancies = seats not filled (simplest: 435 - (D+R))
    const vacancies = Math.max(totalSeats - (dSeats + rSeats), 0);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalSeats,
      vacancies,
      dSeats,
      rSeats,
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
    });
  }
}
