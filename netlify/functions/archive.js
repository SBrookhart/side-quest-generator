import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-archive", {
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const index = await store.get("archive:index", { type: "json" });

  if (!Array.isArray(index) || !index.length) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }

  const days = [];
  for (const date of index) {
    const day = await store.get(`day:${date}`, { type: "json" });
    if (day) days.push(day);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(days)
  };
}
