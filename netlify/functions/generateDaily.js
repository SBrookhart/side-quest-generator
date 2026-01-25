import { getStore } from "@netlify/blobs";

export default async (request) => {
  /* ------------------------------------------------------------------
     Environment
  ------------------------------------------------------------------ */

  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json(
      {
        error: "Missing siteID or token",
        debug: {
          hasSiteID: Boolean(siteID),
          hasToken: Boolean(token)
        }
      },
      { status: 500 }
    );
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  /* ------------------------------------------------------------------
     Date + override handling
  ------------------------------------------------------------------ */

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily/${today}`;

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  const existing = await store.get(key);

  if (existing && !force) {
    return Response.json({
      status: "already-generated",
      date: today,
      hint: "Add ?force=true to regenerate"
    });
  }

  /* ------------------------------------------------------------------
     Snapshot (sample, premium, vibe-coder friendly)
  ------------------------------------------------------------------ */

  const snapshot = {
    date: today,
    mode: "sample",
    ideas: [
      {
        title: "Developer Narrative Layer",

        murmur:
          "Across documentation, error messages, and setup flows, developers repeatedly encounter tools that surface information without explaining intent, cause, or next steps.",

        quest:
          "Build a lightweight narrative layer that translates raw error messages or dense documentation into clear, human explanations that describe what happened, why it happened, and what to try next.",

        worth: [
          "High-empathy DX improvement with immediate value",
          "Great playground for language-first UX and AI summarization",
          "Easy to scope as a browser extension, CLI wrapper, or docs overlay"
        ],

        signals: [
          {
            type: "github",
            url: "https://github.com/rust-lang/rust-analyzer/issues/21234"
          },
          {
            type: "github",
            url: "https://github.com/coinbase/mesh-cli/issues/429"
          }
        ]
      }
    ]
  };

  /* ------------------------------------------------------------------
     Persistence (ALWAYS JSON)
  ------------------------------------------------------------------ */

  await store.set(key, JSON.stringify(snapshot));
  await store.set("latest", JSON.stringify(snapshot));

  /* ------------------------------------------------------------------
     Response
  ------------------------------------------------------------------ */

  return Response.json({
    status: force ? "regenerated" : "generated",
    date: today
  });
};
