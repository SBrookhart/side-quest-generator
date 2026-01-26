// netlify/functions/hackathons.js

export async function fetchHackathonSignals() {
  try {
    const res = await fetch("https://devpost.com/api/hackathons");

    if (!res.ok) {
      console.error("Hackathons fetch failed:", res.status);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data.hackathons)) return [];

    return data.hackathons.slice(0, 10).map(h => ({
      type: "rss",
      text: `Hackathon prompt: ${h.title}. ${h.tagline || ""}`.slice(0, 280),
      url: h.url,
      date: h.opened_at
        ? h.opened_at.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    }));
  } catch (err) {
    console.error("Hackathons error:", err);
    return [];
  }
}
