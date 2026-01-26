import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return new Response(JSON.stringify({ error: "Missing siteID or token" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  let listing;
  try {
    listing = await store.list();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to list archive blobs" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const blobs = listing.blobs || [];
  
  // Get today's date in YYYY-MM-DD format (UTC)
  const today = new Date().toISOString().slice(0, 10);

  // Only include daily snapshots, excluding today
  const dailyKeys = blobs
    .map(b => b.key)
    .filter(key => {
      if (!key.startsWith("daily-")) return false;
      // Extract date from key (format: daily-YYYY-MM-DD)
      const dateFromKey = key.replace("daily-", "");
      return dateFromKey !== today;
    });

  const archiveData = {};

  for (const key of dailyKeys) {
    try {
      const raw = await store.get(key);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (parsed?.ideas && parsed?.date) {
        archiveData[parsed.date] = parsed.ideas;
      }
    } catch {
      // skip corrupt entries
    }
  }

  // Add no-cache headers
  return new Response(JSON.stringify(archiveData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};
