// netlify/functions/latest.js

import { getStore } from "@netlify/blobs";

export const handler = async () => {
  try {
    const store = getStore({
      name: "tech-murmurs",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    const latest = await store.get("latest");

    // If nothing has been generated yet, fail gracefully
    if (!latest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          mode: "sample",
          ideas: []
        })
      };
    }

    return {
      statusCode: 200,
      body: latest
    };
  } catch (err) {
    console.error("Latest fetch failed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to load latest ideas",
        details: err.message
      })
    };
  }
};
