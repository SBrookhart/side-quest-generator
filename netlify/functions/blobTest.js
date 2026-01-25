import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-test", {
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  await store.set("hello", { ok: true });

  const value = await store.get("hello", { type: "json" });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      value
    })
  };
}
