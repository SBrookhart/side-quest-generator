import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore({
    name: "tech-murmurs-archive",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const entries = [];

  for await (const key of store.list()) {
    const day = await store.get(key);
    entries.push(day);
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  };
}
