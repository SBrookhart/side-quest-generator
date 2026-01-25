import { getStore } from "@netlify/blobs";

/**
 * Tech Murmurs – Daily Generator
 * --------------------------------
 * Role:
 * - Pull live signals from multiple sources
 * - Filter aggressively for non-trivial, non-mechanical content
 * - Shape into 5 vibe-coder-friendly side quests
 * - Persist a single immutable daily snapshot
 * - Explicitly mark live vs sample mode
 */

export async function handler() {
  const store = getStore({
    name: "tech-murmurs-archive",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const today = new Date().toISOString().slice(0, 10);

  // Never overwrite an existing day
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
    // --- Fetch raw signals ---
    const [githubSignals, twitterSignals] = await Promise.all([
      fetch(`${process.env.URL}/.netlify/functions/github`).then(r => r.json()),
      fetch(`${process.env.URL}/.netlify/functions/twitter`).then(r => r.json())
    ]);

    // --- Normalize + filter signals ---
    const allSignals = [...githubSignals, ...twitterSignals].filter(s =>
      s &&
      s.text &&
      s.text.length > 40 &&
      s.text.length < 400 &&
      !/typo|version bump|dependabot|eslint|lint|ci|chore/i.test(s.text)
    );

    if (allSignals.length < 5) {
      throw new Error("Insufficient high-quality live signals");
    }

    /**
     * Light thematic grouping.
     * This is intentionally heuristic, not ML-heavy.
     * We are optimizing for *clarity*, not exhaustiveness.
     */
    const buckets = {
      explanation: [],
      visibility: [],
      workflow: [],
      creativity: [],
      misc: []
    };

    allSignals.forEach(s => {
      const t = s.text.toLowerCase();
      if (t.match(/what does|explain|confusing|hard to understand/)) {
        buckets.explanation.push(s);
      } else if (t.match(/hard to find|buried|discover|see/)) {
        buckets.visibility.push(s);
      } else if (t.match(/workflow|process|too many steps|manual/)) {
        buckets.workflow.push(s);
      } else if (t.match(/wish there was|would be cool|should exist/)) {
        buckets.creativity.push(s);
      } else {
        buckets.misc.push(s);
      }
    });

    const pick = (arr, n = 1) => arr.slice(0, n);

    // --- Shape into 5 ideas ---
    ideas = [
      {
        title: "Explain This Like I’m New Here",
        murmur:
          "Builders frequently encounter tools and repositories that assume shared context, leaving newcomers unsure what they actually do.",
        quest:
          "Build a small web tool where someone drops a link (repo, product, API) and gets a plain-English explanation plus a concrete weekend use case.",
        worth: [
          "Focuses on translation, not technical depth",
          "Immediately useful even in rough form",
          "Great portfolio piece for vibe coders"
        ],
        signals: [
          ...pick(buckets.explanation, 2),
          ...pick(buckets.creativity, 1)
        ]
      },

      {
        title: "Surface What’s Hard to See",
        murmur:
          "People regularly complain that important information is buried across dashboards, docs, and tools.",
        quest:
          "Create a lightweight visual layer that surfaces the one thing people say is hardest to find in a given tool or workflow.",
        worth: [
          "Design does most of the heavy lifting",
          "Scope stays intentionally small",
          "Strong UX storytelling value"
        ],
        signals: [
          ...pick(buckets.visibility, 2),
          ...pick(buckets.explanation, 1)
        ]
      },

      {
        title: "Make the Invisible Step Obvious",
        murmur:
          "Many workflows fail not because they’re broken, but because one critical step is never made explicit.",
        quest:
          "Build a micro-guide or interactive checklist that reveals the missing step in a common developer workflow.",
        worth: [
          "Low technical complexity",
          "High clarity payoff",
          "Easy to test with real users"
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
          "Clear problem-solution loop",
          "Great for shipping fast",
          "Teaches product instinct"
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
          "Design a first-five-minutes experience that helps someone orient themselves without reading full documentation.",
        worth: [
          "Empathy-driven design",
          "Doesn’t require backend complexity",
          "Highly shareable"
        ],
        signals: [
          ...pick(buckets.explanation, 1),
          ...pick(buckets.visibility, 1),
          ...pick(buckets.creativity, 1)
        ]
      }
    ];

    // Final guardrail
    ideas = ideas.filter(i => i.signals.length >= 2);
    if (ideas.length < 5) {
      throw new Error("Signal diversity insufficient");
    }

  } catch (err) {
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
          { type: "sample", name: "Sample Signal", url: "#" }
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
