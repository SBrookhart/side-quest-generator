import { getStore } from "@netlify/blobs";

/* ---------------- CONFIG ---------------- */

const IDEA_COUNT = 5;

// phrases that signal unmet need (non-technical friendly)
const SIGNAL_PHRASES = [
  "wish there was",
  "missing",
  "no tool",
  "hard to",
  "confusing",
  "should exist",
  "someone should build",
  "i want a way to",
  "why is there no"
];

/* ---------------- HELPERS ---------------- */

function containsSignal(text) {
  const t = text.toLowerCase();
  return SIGNAL_PHRASES.some(p => t.includes(p));
}

function summarize(text, max = 280) {
  return text.replace(/\s+/g, " ").slice(0, max);
}

function difficultyFromScope(scope) {
  if (scope === "small") return "Easy";
  if (scope === "medium") return "Medium";
  return "Hard";
}

/* ---------------- INGESTION ---------------- */

// ---------- GitHub ----------
async function ingestGitHub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  const res = await fetch(
    "https://api.github.com/search/issues?q=is:issue+is:open+confusing+language:markdown&per_page=20",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  const data = await res.json();
  if (!data.items) return [];

  return data.items
    .filter(i => containsSignal(i.title + " " + (i.body || "")))
    .map(i => ({
      type: "github",
      title: i.title,
      text: summarize(i.body || i.title),
      url: i.html_url,
      name: "GitHub Issue"
    }));
}

// ---------- X / Twitter ----------
async function ingestX() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const query =
    "(\"someone should build\" OR \"wish there was\" OR \"no tool for\") lang:en -is:retweet";

  const res = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
      query
    )}&max_results=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  if (!data.data) return [];

  return data.data.map(t => ({
    type: "twitter",
    title: "Developer tweet",
    text: t.text,
    url: `https://x.com/i/web/status/${t.id}`,
    name: "X"
  }));
}

// ---------- Hackathons ----------
async function ingestHackathons() {
  const feeds = [
    "https://devpost.com/feed",
    "https://hackathons.hackclub.com/feed.xml"
  ];

  const results = [];

  for (const url of feeds) {
    try {
      const res = await fetch(url);
      const text = await res.text();

      SIGNAL_PHRASES.forEach(p => {
        if (text.toLowerCase().includes(p)) {
          results.push({
            type: "hackathon",
            title: "Hackathon prompt",
            text: "A recurring hackathon prompt suggests unmet demand.",
            url,
            name: "Hackathon"
          });
        }
      });
    } catch {
      continue;
    }
  }

  return results;
}

// ---------- Roadmaps ----------
async function ingestRoadmaps() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  const res = await fetch(
    "https://api.github.com/search/repositories?q=roadmap+in:readme&per_page=10",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map(r => ({
    type: "article",
    title: "Protocol roadmap",
    text: "Planned features indicate future tooling gaps.",
    url: r.html_url,
    name: "Roadmap"
  }));
}

/* ---------------- SYNTHESIS ---------------- */

function synthesizeIdeas(signals) {
  const ideas = [];

  for (const s of signals) {
    if (ideas.length >= IDEA_COUNT) break;

    ideas.push({
      title:
        s.type === "twitter"
          ? "Turn ambient dev frustration into a playful tool"
          : s.type === "hackathon"
          ? "Prototype a missing building block from hackathon chatter"
          : s.type === "article"
          ? "Explore what this roadmap doesn’t explicitly solve"
          : "Fix a confusing experience developers keep tripping over",

      murmur: summarize(s.text, 240),

      sideQuest:
        s.type === "twitter"
          ? "Build a small, expressive prototype that makes this frustration tangible."
          : s.type === "hackathon"
          ? "Build the smallest possible demo that addresses this recurring prompt."
          : s.type === "article"
          ? "Create a lightweight companion tool that fills a gap the roadmap implies."
          : "Design a clearer, friendlier interface or abstraction that resolves this pain.",

      worth: [
        "This solves a real, already-articulated frustration.",
        "The scope is intentionally small and explorable.",
        "It’s a good excuse to ship something imperfect but real."
      ],

      difficulty: difficultyFromScope(
        s.type === "twitter" ? "small" : s.type === "github" ? "medium" : "medium"
      ),

      signals: [
        {
          type: s.type,
          name: s.name,
          url: s.url
        }
      ]
    });
  }

  return ideas;
}

/* ---------------- MAIN HANDLER ---------------- */

export default async () => {
  const siteID =
    process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (!siteID || !token) {
    return Response.json({ error: "Missing siteID or token" }, { status: 500 });
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  // prevent regenerating same day unless forced
  const today = new Date().toISOString().slice(0, 10);
  const existing = await store.get("latest");
  if (existing && !process.env.FORCE_REGEN) {
    return Response.json({ status: "already-generated", date: today });
  }

  // ingest
  const signals = [
    ...(await ingestGitHub()),
    ...(await ingestX()),
    ...(await ingestHackathons()),
    ...(await ingestRoadmaps())
  ];

  let ideas = synthesizeIdeas(signals);

  let mode = "live";

  if (ideas.length < IDEA_COUNT) {
    mode = "sample";
    ideas = ideas.concat(
      synthesizeIdeas(signals).slice(0, IDEA_COUNT - ideas.length)
    );
  }

  const snapshot = {
    mode,
    date: today,
    ideas: ideas.slice(0, IDEA_COUNT)
  };

  await store.set("latest", JSON.stringify(snapshot));

  return Response.json({ status: "generated", mode, date: today });
};
