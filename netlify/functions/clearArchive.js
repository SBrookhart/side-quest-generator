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

  try {
    // Delete both Jan 23 and Jan 24
    await store.delete("daily-2026-01-23");
    await store.delete("daily-2026-01-24");

    return Response.json({ 
      success: true,
      message: "Archive cleared - now run seedArchive"
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
};
