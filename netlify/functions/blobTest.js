import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore({
    name: "test-store",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  await store.set("hello", { message: "Blobs are working" });
  const value = await store.get("hello");

  return {
    statusCode: 200,
    body: JSON.stringify(value)
  };
}
