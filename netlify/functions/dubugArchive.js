import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing credentials" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const keys = [];

  for await (const key of store.list()) {
    keys.push(key);
  }

  return Response.json({ keys });
};
