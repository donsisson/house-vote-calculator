export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://clerk.house.gov/evs/2026/roll001.xml"
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch Clerk data" });
    }

    const xml = await response.text();

    // Very simple extraction (seat counts are in summary area)
    const dMatch = xml.match(/Democratic\s+(\d+)/i);
    const rMatch = xml.match(/Republican\s+(\d+)/i);
    const vacMatch = xml.match(/Vacancies\s+(\d+)/i);

    const dSeats = dMatch ? parseInt(dMatch[1]) : 0;
    const rSeats = rMatch ? parseInt(rMatch[1]) : 0;
    const vacancies = vacMatch ? parseInt(vacMatch[1]) : 0;

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      totalSeats: 435,
      vacancies,
      dSeats,
      rSeats
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
