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

  let keys;
  try {
    keys = await store.list();
  } catch (err) {
    return Response.json(
      { error: "Failed to list blobs", detail: String(err) },
      { status: 500 }
    );
  }

  return Response.json({ keys });
};
