export const config = {
  schedule: "@daily"
};

import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore({
    name: "tech-murmurs-archive",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const today = new Date().toISOString().slice(0, 10);

  // Lock: never overwrite a day
  const existing = await store.get(today);
  if (existing) {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "already-generated", date: today })
    };
  }

  let mode = "live";
  let ideas = [];

  try {
    const [github, twitter] = await Promise.all([
      fetch(`${process.env.URL}/.netlify/functions/github`).then(r => r.json()),
      fetch(`${process.env.URL}/.netlify/functions/twitter`).then(r => r.json())
    ]);

    const allSignals = [...github, ...twitter].filter(s =>
      s &&
      s.text &&
      s.text.length > 40 &&
      s.text.length < 400 &&
      !/dependabot|bump|typo|eslint|lint|ci|chore|version/i.test(s.text)
    );

    if (allSignals.length < 6) {
      throw new Error("Not enough high-quality live signals");
    }

    const buckets = {
      explanation: [],
      visibility: [],
      workflow: [],
      creativity: [],
      misc: []
    };

    allSignals.forEach(s => {
      const t = s.text.toLowerCase();
      if (/what does|explain|confusing|hard to understand/.test(t)) {
        buckets.explanation.push(s);
      } else if (/hard to find|buried|discover|see/.test(t)) {
        buckets.visibility.push(s);
      } else if (/workflow|manual|steps|process/.test(t)) {
        buckets.workflow.push(s);
      } else if (/wish there was|should exist|would be cool/.test(t)) {
        buckets.creativity.push(s);
      } else {
        buckets.misc.push(s);
      }
    });

    const pick = (arr, n) => arr.slice(0, n);

    ideas = [
      {
        title: "Explain This Like I’m New Here",
        murmur:
          "Builders regularly encounter tools and repos that assume shared context, leaving newcomers unsure what they actually do.",
        quest:
          "Build a small web tool where someone drops a link and gets a plain-English explanation plus a realistic weekend use case.",
        worth: [
          "Translation over technical depth",
          "Useful even if imperfect",
          "Strong vibe-coder portfolio piece"
        ],
        signals: [
          ...pick(buckets.explanation, 2),
          ...pick(buckets.creativity, 1)
        ]
      },
      {
        title: "Surface What’s Hard to See",
        murmur:
          "Important information is often buried across dashboards, docs, and tools.",
        quest:
          "Create a lightweight visual layer that surfaces the one thing people say is hardest to find.",
        worth: [
          "Design-led build",
          "Clear scope",
          "Immediate usability"
        ],
        signals: [
          ...pick(buckets.visibility, 2),
          ...pick(buckets.explanation, 1)
        ]
      },
      {
        title: "Make the Missing Step Obvious",
        murmur:
          "Many workflows fail because one critical step is never made explicit.",
        quest:
          "Build a micro-guide or checklist that reveals the invisible step in a common workflow.",
        worth: [
          "Low complexity",
          "High clarity payoff",
          "Easy to validate"
        ],
        signals: [
          ...pick(buckets.workflow, 2),
          ...pick(buckets.misc, 1)
        ]
      },
      {
        title: "Turn Frustration Into a One-Click Helper",
        murmur:
          "Short expressions of frustration often point to small but valuable missing helpers.",
        quest:
          "Identify a repeated complaint and build a tiny helper that does exactly one thing to reduce that friction.",
        worth: [
          "Fast to ship",
          "Teaches product instinct",
          "Highly focused"
        ],
        signals: [
          ...pick(buckets.creativity, 2),
          ...pick(buckets.workflow, 1)
        ]
      },
      {
        title: "Make the First Five Minutes Better",
        murmur:
          "First-time experiences with tools are frequently overwhelming or under-guided.",
        quest:
          "Design a first-five-minutes experience that orients users without forcing them to read docs.",
        worth: [
          "Empathy-driven",
          "No backend required",
          "Very shareable"
        ],
        signals: [
          ...pick(buckets.explanation, 1),
          ...pick(buckets.visibility, 1),
          ...pick(buckets.creativity, 1)
        ]
      }
    ];

    if (ideas.some(i => i.signals.length < 2)) {
      throw new Error("Signal diversity too low");
    }

  } catch {
    mode = "sample";
    ideas = [
      {
        title: "Explain This Like I’m New Here",
        murmur:
          "People share tools assuming context others don’t have.",
        quest:
          "Build a simple explainer that translates technical artifacts into plain language.",
        worth: [
          "Translation over complexity",
          "Fast to prototype",
          "High empathy payoff"
        ],
        signals: [
          { type: "sample", name: "Sample Data", url: "#" }
        ]
      }
    ];
  }

  await store.set(today, {
    date: today,
    mode,
    ideas
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "generated",
      date: today,
      mode,
      ideaCount: ideas.length
    })
  };
}
