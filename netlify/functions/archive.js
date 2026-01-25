import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json([]);
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const raw = await store.get("latest");

  if (!raw) {
    return Response.json([]);
  }

  let snapshot;
  try {
    snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return Response.json([]);
  }

  return Response.json([snapshot]);
};
