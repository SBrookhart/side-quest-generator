import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json([], { status: 200 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const latest = await store.get("latest");
  if (!latest) {
    return Response.json([]);
  }

  return Response.json([latest]);
};
