import { getStore } from "@netlify/blobs";

export default async () => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

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

  const latest = await store.get("latest");

  if (!latest) {
    return Response.json(
      { error: "No ideas published yet." },
      { status: 404 }
    );
  }

  return new Response(latest, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};
