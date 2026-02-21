const FALLBACK_ARCHIVE = {
  "2026-01-23": [
    {
      title: "What If My Terminal Had Undo?",
      murmur: "You accidentally rm -rf something important and your heart drops. What if your terminal just... remembered?",
      quest: "Build a terminal wrapper that snapshots your file system state before destructive commands. Hit Ctrl+Z to undo that accidental deletion or failed script.",
      worth: [
        "Never lose work to a typo again",
        "Builds confidence in terminal experimentation",
        "Could save someone's thesis one day"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "zsh plugin discussions", url: "https://github.com/topics/zsh" },
        { type: "x", name: "Discussion on terminal workflows", url: "https://x.com/search?q=terminal%20workflow%20tips&f=live" },
        { type: "rss", name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" }
      ]
    },
    {
      title: "Can package.json Write Its Own README?",
      murmur: "Your package.json knows everything about your project—dependencies, scripts, description. Why are you manually syncing this to your README?",
      quest: "Build a tool that auto-generates README sections from package.json. Dependencies become a table, scripts become usage examples, and it updates on every npm install.",
      worth: [
        "READMEs that never go stale",
        "One source of truth for project info",
        "Saves so much documentation tedium"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "npm CLI discussions", url: "https://github.com/npm/cli/discussions" },
        { type: "x", name: "Conversation on documentation", url: "https://x.com/search?q=documentation%20automation&f=live" }
      ]
    },
    {
      title: "What If Git Blame Had Vibes?",
      murmur: "Git blame shows who wrote the code, but not why they were feeling when they wrote it. Was it 3am panic code or thoughtful refactoring?",
      quest: "Build a git blame overlay that analyzes commit messages for sentiment and shows emotional context. Color-code lines by energy: calm green, stressed red, excited purple.",
      worth: [
        "Understand code archaeology better",
        "Adds empathy to code review",
        "Weirdly therapeutic to see patterns"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Git enhancement requests", url: "https://github.com/topics/git" },
        { type: "x", name: "Thread on developer experience", url: "https://x.com/search?q=developer%20experience&f=live" },
        { type: "rss", name: "Web.dev articles", url: "https://web.dev/articles" }
      ]
    },
    {
      title: "Can I Track My API Spend in Real-Time?",
      murmur: "You call OpenAI, Stripe, AWS APIs and have no idea what you're spending until the bill arrives. Real-time cost visibility shouldn't be this hard.",
      quest: "Build a lightweight proxy that sits between your app and external APIs, calculates costs per request, and shows a live dashboard of spend by endpoint.",
      worth: [
        "Never get surprised by API bills",
        "Helps optimize expensive calls",
        "Great for prototyping budget-conscious apps"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "AWS SDK discussions", url: "https://github.com/aws/aws-sdk-js/discussions" },
        { type: "x", name: "Discussion on API costs", url: "https://x.com/search?q=API%20cost%20tracking&f=live" }
      ]
    },
    {
      title: "What If My Cursor Left Breadcrumbs?",
      murmur: "You jump between files in your editor constantly, but lose your train of thought. What if your cursor left a trail you could retrace?",
      quest: "Build a VSCode extension that records your cursor's path through files and lets you replay it like a time-travel debug session. See where you've been, jump back instantly.",
      worth: [
        "Never lose your place in large codebases",
        "Great for onboarding or explaining code",
        "Feels like magic when it works"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "VSCode extension ideas", url: "https://github.com/microsoft/vscode" },
        { type: "rss", name: "CSS-Tricks - Developer workflows", url: "https://css-tricks.com/tag/workflow/" }
      ]
    }
  ],
  "2026-01-24": [
    {
      title: "Can Tests Show Me What Changed Visually?",
      murmur: "Your tests pass but the UI looks totally broken. Unit tests don't catch visual regressions and manual QA is exhausting.",
      quest: "Build a visual diff tool that screenshots your app before/after changes and highlights pixel differences. Integrate it into your CI pipeline so PRs show visual diffs automatically.",
      worth: [
        "Catches UI bugs tests miss",
        "Makes code review way more visual",
        "Saves hours of manual testing"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Jest enhancement ideas", url: "https://github.com/jestjs/jest/discussions" },
        { type: "x", name: "Discussion on testing workflows", url: "https://x.com/search?q=visual%20testing&f=live" },
        { type: "rss", name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" }
      ]
    },
    {
      title: "What If Localhost Had a Real Domain?",
      murmur: "You're testing webhooks or OAuth but localhost URLs don't work. ngrok helps but expires and changes URLs constantly.",
      quest: "Build a service that gives you a permanent *.yourdomain.dev that always tunnels to your localhost. One URL forever, no expiration, just works.",
      worth: [
        "No more ngrok URL juggling",
        "Makes webhook testing painless",
        "Share local work with permanent links"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "LocalTunnel discussions", url: "https://github.com/localtunnel/localtunnel" },
        { type: "x", name: "Thread on local development", url: "https://x.com/search?q=local%20development%20tools&f=live" }
      ]
    },
    {
      title: "Can My .env File Be a Database?",
      murmur: "Environment variables are scattered across .env files, hosting dashboards, and CI configs. Finding the right value is archaeological work.",
      quest: "Build a centralized env var manager with a CLI. Store variables with descriptions, sync them to any platform (Vercel, Railway, GitHub), and version control changes.",
      worth: [
        "One source of truth for all secrets",
        "Makes onboarding new devs instant",
        "No more 'where did I put that API key?'"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "dotenv proposals", url: "https://github.com/motdotla/dotenv" },
        { type: "x", name: "Conversation on DevOps tools", url: "https://x.com/search?q=DevOps%20automation&f=live" },
        { type: "rss", name: "DevOps.com articles", url: "https://devops.com" }
      ]
    },
    {
      title: "What If Every PR Had a Live Preview?",
      murmur: "Reviewing code is hard when you can't see it running. You have to check out the branch, install deps, and run it locally every time.",
      quest: "Build a GitHub Action that automatically deploys every PR to a temporary preview URL. Full stack, database included, expires after merge.",
      worth: [
        "Code review becomes visual and interactive",
        "QA can test without technical setup",
        "Catches issues before they hit production"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "GitHub Actions discussions", url: "https://github.com/features/actions" },
        { type: "x", name: "Thread on CI/CD workflows", url: "https://x.com/search?q=CI%20CD%20preview&f=live" }
      ]
    },
    {
      title: "Can My 404 Page Be a Game?",
      murmur: "404 pages are wasted opportunities. Users hit them, shrug, and leave. What if they stayed to play instead?",
      quest: "Build a simple, addictive browser game that lives on your 404 page. High scores save locally, leaderboard is optional, and broken links become fun detours.",
      worth: [
        "Turns frustration into delight",
        "Increases time on site (weirdly)",
        "Great conversation starter for your portfolio"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Discussion on web experiences", url: "https://x.com/search?q=creative%20web%20design&f=live" },
        { type: "rss", name: "Smashing Magazine", url: "https://www.smashingmagazine.com" }
      ]
    }
  ]
};

async function getFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/quest_archive?order=quest_date.desc,display_order.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  if (!rows.length) return null;

  // Group by date
  const grouped = {};
  for (const r of rows) {
    const date = r.quest_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({
      title: r.title,
      murmur: r.murmur,
      quest: r.quest,
      worth: r.worth,
      difficulty: r.difficulty,
      sources: r.sources
    });
  }
  return grouped;
}

export const handler = async (event) => {
  try {
    // Try Supabase first
    const supabaseArchive = await getFromSupabase();
    if (supabaseArchive) {
      console.log('Serving archive from Supabase');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(supabaseArchive)
      };
    }

    // Fallback to hardcoded archive
    console.log('Serving archive from fallback');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(FALLBACK_ARCHIVE)
    };
  } catch (error) {
    console.error('Archive error:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(FALLBACK_ARCHIVE)
    };
  }
};
