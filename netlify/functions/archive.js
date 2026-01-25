import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json(
      { error: "Missing siteID or token" },
      { status: 500 }
    );
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
    return Response.json(
      { error: "Failed to list archive blobs" },
      { status: 500 }
    );
  }

  const blobs = listing.blobs || [];

  // Only include daily snapshots written as `daily-YYYY-MM-DD`
  const dailyKeys = blobs
    .map(b => b.key)
    .filter(key => key.startsWith("daily-"));

  const entries = [];

  for (const key of dailyKeys) {
    try {
      const raw = await store.get(key);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (parsed?.ideas && parsed?.date) {
        entries.push(parsed);
      }
    } catch {
      // skip corrupt entries
    }
  }

  // Sort newest → oldest
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({ days: entries }, { status: 200 });
};
