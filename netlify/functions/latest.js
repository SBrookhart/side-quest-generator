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

  let raw;
  try {
    raw = await store.get("latest");
  } catch (err) {
    return Response.json(
      { error: "Failed to read latest snapshot" },
      { status: 500 }
    );
  }

  if (!raw) {
    return Response.json(
      { error: "No ideas published yet." },
      { status: 404 }
    );
  }

  let latest;
  try {
    // Handle stringified JSON or objects
    latest = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    return Response.json(
      { error: "Corrupt snapshot data" },
      { status: 500 }
    );
  }

  // Basic shape validation
  if (
    !latest ||
    !Array.isArray(latest.ideas) ||
    !latest.mode
  ) {
    return Response.json(
      { error: "Invalid snapshot format" },
      { status: 500 }
    );
  }

  return Response.json(latest, { status: 200 });
};
