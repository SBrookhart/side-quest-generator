import { getStore } from "@netlify/blobs";

const day1Ideas = [
  {
    title: "What If My Code Commits Were Fortune Cookies?",
    murmur: "Commit messages are boring. What if each one opened like a fortune cookie with a random vibe or life advice?",
    quest: "Build a CLI tool that wraps your git commits in fortune cookie format—add random wisdom, lucky numbers, and vibes to every commit.",
    worth: [
      "Makes commits actually fun",
      "Your terminal deserves whimsy",
      "Ships in a few hours"
    ],
    difficulty: "Easy",
    sources: [
      { type: "github", name: "Developer Tools", url: "https://github.com/search?q=git+commit+fun" },
      { type: "x", name: "Dev Twitter", url: "https://x.com/search?q=git%20commit%20message" }
    ]
  },
  {
    title: "Can I Turn Documentation Into a Choose-Your-Own-Adventure?",
    murmur: "Nobody reads docs because they're linear and boring. What if they were interactive stories instead?",
    quest: "Create a doc generator that turns technical guides into choose-your-own-adventure style journeys with branching paths and achievements.",
    worth: [
      "Makes learning actually engaging",
      "Docs people want to read",
      "Fun narrative design challenge"
    ],
    difficulty: "Medium",
    sources: [
      { type: "github", name: "Documentation", url: "https://github.com/search?q=documentation+boring" },
      { type: "x", name: "X", url: "https://x.com/search?q=documentation%20hard" }
    ]
  },
  {
    title: "What If My Calendar Was a Bento Box?",
    murmur: "Calendar apps are stressful grids of dread. What if your day was a cute bento box you arrange?",
    quest: "Build a calendar where events are bento items you arrange aesthetically—meetings are onigiri, deep work is sushi, breaks are pickles.",
    worth: [
      "Makes scheduling feel creative",
      "Actually cute productivity tool",
      "Great design portfolio piece"
    ],
    difficulty: "Easy",
    sources: [
      { type: "github", name: "Productivity", url: "https://github.com/search?q=calendar+alternative" },
      { type: "x", name: "X", url: "https://x.com/search?q=calendar%20stressful" }
    ]
  },
  {
    title: "Can My Tabs Become a Museum?",
    murmur: "Browser tabs pile up like digital hoarding. What if closed tabs became museum exhibits you could revisit?",
    quest: "Create a browser extension that archives closed tabs as a curated museum—add descriptions, tag by mood, search by vibe.",
    worth: [
      "Guilt-free tab closing",
      "Your research becomes art",
      "Nostalgic tab browsing"
    ],
    difficulty: "Medium",
    sources: [
      { type: "github", name: "Browser Tools", url: "https://github.com/search?q=browser+tab+management" },
      { type: "x", name: "X", url: "https://x.com/search?q=too%20many%20tabs" }
    ]
  },
  {
    title: "What If README Files Had Personality Tests?",
    murmur: "READMEs describe what code does, but not who it's for. What if they had personality tests to match you with projects?",
    quest: "Build a tool that adds personality quiz sections to READMEs—answer questions, get matched with repos that fit your vibe.",
    worth: [
      "Discovery through personality",
      "READMEs become interactive",
      "Silly but genuinely useful"
    ],
    difficulty: "Easy",
    sources: [
      { type: "github", name: "GitHub", url: "https://github.com/search?q=readme+creative" },
      { type: "x", name: "X", url: "https://x.com/search?q=finding%20open%20source" }
    ]
  }
];

const day2Ideas = [
  {
    title: "Can I Send My Bugs on Vacation?",
    murmur: "Bug trackers make fixing things feel like homework. What if bugs went on vacation until you're ready to deal with them?",
    quest: "Create a playful bug tracker where bugs go to a virtual beach resort—they send you postcards, come back tanned, you fix them when ready.",
    worth: [
      "Debugging without the dread",
      "Whimsical project management",
      "Would make a great demo"
    ],
    difficulty: "Medium",
    sources: [
      { type: "github", name: "Dev Tools", url: "https://github.com/search?q=bug+tracker+fun" },
      { type: "x", name: "X", url: "https://x.com/search?q=bug%20fixing%20stress" }
    ]
  },
  {
    title: "What If My Spotify Wrapped Was a Tarot Reading?",
    murmur: "Music taste reveals personality. What if your listening history became mystical tarot-style predictions?",
    quest: "Build a Spotify analyzer that reads your music like tarot cards—predict your year based on genre shifts, energy levels, lyric themes.",
    worth: [
      "Data viz meets mysticism",
      "Everyone loves music insights",
      "Viral shareable format"
    ],
    difficulty: "Easy",
    sources: [
      { type: "hackathon", name: "Hackathons", url: "https://devpost.com/hackathons" },
      { type: "x", name: "X", url: "https://x.com/search?q=spotify%20wrapped" }
    ]
  },
  {
    title: "Can I Grow a Forest from My Screen Time?",
    murmur: "Screen time reports feel like judgment. What if every hour became a tree in your personal forest instead?",
    quest: "Track screen time but visualize it as forest growth—productive apps grow trees, doom scrolling grows weeds, watch seasons change.",
    worth: [
      "Reframes screen time positively",
      "Beautiful data visualization",
      "Actually motivating to look at"
    ],
    difficulty: "Medium",
    sources: [
      { type: "github", name: "Productivity", url: "https://github.com/search?q=screen+time+tracker" },
      { type: "x", name: "X", url: "https://x.com/search?q=screen%20time%20guilt" }
    ]
  },
  {
    title: "What If Error Messages Gave Pep Talks?",
    murmur: "Error messages are mean. What if they were supportive life coaches who believe in you instead?",
    quest: "Create a dev tool that intercepts error messages and rewrites them as gentle encouragement—'TypeError? More like Try-pe-error! You got this!'",
    worth: [
      "Coding feels less lonely",
      "Mental health through dev tools",
      "Would genuinely help beginners"
    ],
    difficulty: "Easy",
    sources: [
      { type: "github", name: "Developer Experience", url: "https://github.com/search?q=error+messages" },
      { type: "x", name: "X", url: "https://x.com/search?q=error%20message%20frustration" }
    ]
  },
  {
    title: "Can My GitHub Activity Become a Constellation?",
    murmur: "Contribution graphs are boring green squares. What if your coding activity mapped onto actual constellations?",
    quest: "Turn GitHub contributions into an interactive night sky—clusters of stars for busy weeks, nebulas for big projects, comets for streaks.",
    worth: [
      "Portfolio that's actually beautiful",
      "Cosmic coding aesthetic",
      "Great creative coding project"
    ],
    difficulty: "Hard",
    sources: [
      { type: "github", name: "GitHub", url: "https://github.com/search?q=contribution+graph" },
      { type: "x", name: "X", url: "https://x.com/search?q=github%20contributions" }
    ]
  }
];

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
        ideas: day1Ideas
      },
      {
        date: "2026-01-24",
        mode: "editorial",
        ideas: day2Ideas
      }
    ];

    // Delete old data first
    await store.delete("daily-2026-01-23");
    await store.delete("daily-2026-01-24");
    await store.delete("daily-2026-01-25");

    // Set fresh data
    for (const day of days) {
      await store.set(`daily-${day.date}`, JSON.stringify(day));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        seeded: days.map(d => d.date),
        message: "Archive seeded with playful vibe-coder ideas"
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
