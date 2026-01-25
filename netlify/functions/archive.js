import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-archive");
  const indexKey = "archive:index";

  const index = await store.get(indexKey, { type: "json" });

  if (!index || !index.length) {
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
