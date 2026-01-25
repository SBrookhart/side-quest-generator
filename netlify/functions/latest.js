import { getStore } from "@netlify/blobs";
import generateDaily from "./generateDaily.js";

export default async function handler(req) {
  const store = getStore({
    name: "tech-murmurs",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const existing = await store.get("latest");

  // ✅ If latest exists, return it
  if (existing) {
    return Response.json(JSON.parse(existing));
  }

  // 🔁 Otherwise, GENERATE IT
  const result = await generateDaily(req);
  return result;
}
