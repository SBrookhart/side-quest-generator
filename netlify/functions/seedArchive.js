// netlify/functions/seedArchive.js

import { getStore } from "@netlify/blobs";

export const handler = async () => {
  try {
    const store = getStore({
      name: "tech-murmurs",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    const days = [
      {
        date: "2026-01-23",
        mode: "editorial",
        ideas: [
          {
            title: "The Market Has Feelings",
            murmur:
              "Crypto discourse oscillates between euphoria and despair, but no one tracks it coherently.",
            quest:
              "Build a real-time emotional dashboard of crypto discourse without price data.",
            value:
              "Turns narrative chaos into intuition rather than speculation.",
            difficulty: "Easy",
            sources: [
              { type: "github", name: "GitHub", url: "https://github.com" }
            ]
          }
        ]
      },
      {
        date: "2026-01-24",
        mode: "editorial",
        ideas: [
          {
            title: "Narrative Gravity Map",
            murmur:
              "Some ideas pull attention disproportionally, but the reasons are unclear.",
            quest:
              "Map narrative gravity across crypto and builder discourse.",
            value:
              "Shows why certain ideas stick while others fade.",
            difficulty: "Medium",
            sources: [
              { type: "x", name: "X", url: "https://x.com" }
            ]
          }
        ]
      }
    ];

    for (const day of days) {
      await store.set(`daily-${day.date}`, JSON.stringify(day));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        seeded: days.map(d => d.date)
      })
    };
  } catch (err) {
    console.error("Seed archive failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Seed archive failed",
        details: err.message
      })
    };
  }
};
