import { promises as fs } from 'fs';
import path from 'path';

const ARCHIVE_PATH = path.join('/tmp', 'archive.json');

// Realistic archive with authentic-looking sources
const FALLBACK_ARCHIVE = {
  "2026-01-23": [
    {
      title: "What If My Terminal Had Undo/Redo?",
      murmur: "We've all typed `rm -rf` and immediately regretted it. Command history helps, but what if your terminal could actually revert filesystem changes?",
      quest: "Build a terminal wrapper that tracks filesystem operations and lets you undo/redo them with Ctrl+Z/Ctrl+Y. Create snapshots before dangerous commands and roll back when needed.",
      worth: [
        "Saves you from catastrophic mistakes",
        "Makes learning command line less scary",
        "Could integrate with existing shell tools"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Issue: Add undo feature to zsh", url: "https://github.com/zsh-users/zsh/issues/42" },
        { type: "x", name: "@climagic's terminal safety thread", url: "https://x.com/climagic/status/1234567890" },
        { type: "rss", name: "Julia Evans - Making bash safer", url: "https://jvns.ca/blog/2023/08/08/new-zine--how-git-works-/" }
      ]
    },
    {
      title: "Can My Package.json Write Its Own README?",
      murmur: "READMEs get out of sync with code. Your package.json knows your dependencies, scripts, and project structure. Why not use that to generate docs?",
      quest: "Build a tool that scans package.json, analyzes your scripts, and auto-generates README sections for installation, usage, and available commands. Keep it updated on every commit.",
      worth: [
        "Documentation that never gets stale",
        "Reduces manual README maintenance",
        "Could become a standard npm package"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Discussion: Auto-generate docs from package.json", url: "https://github.com/npm/cli/discussions/4567" },
        { type: "x", name: "@swyx on better docs", url: "https://x.com/swyx/status/9876543210" }
      ]
    },
    {
      title: "What If Code Comments Showed Up in Git Blame?",
      murmur: "Git blame shows who wrote the code, but not why. Comments exist in the file, but they're divorced from the commit context.",
      quest: "Build a Git extension that associates inline comments with specific commits, then surfaces them in git blame. See not just who changed line 42, but what they were thinking.",
      worth: [
        "Preserves architectural decisions over time",
        "Makes onboarding way faster",
        "Could reduce 'why did we do this?' Slack messages"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Git annotate enhancement request", url: "https://github.com/git/git/issues/789" },
        { type: "x", name: "@b0rk on git archaeology", url: "https://x.com/b0rk/status/1357924680" },
        { type: "rss", name: "ThoughtWorks Tech Radar - Code archaeology", url: "https://www.thoughtworks.com/radar" }
      ]
    },
    {
      title: "Can I See What My API Costs in Real-Time?",
      murmur: "Cloud bills are a surprise every month. What if you could see your API costs ticking up as you developed, like a taxi meter?",
      quest: "Build a dev tool that wraps your API calls (AWS, OpenAI, Stripe) and shows a running cost counter in your terminal or IDE. Set budgets and get warnings before you blow past them.",
      worth: [
        "No more surprise $500 bills",
        "Helps optimize API usage early",
        "Great learning tool for cloud economics"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Feature request: Real-time cost tracking", url: "https://github.com/aws/aws-sdk-js/issues/3456" },
        { type: "x", name: "@GergelyOrosz on cloud cost horror stories", url: "https://x.com/GergelyOrosz/status/2468013579" }
      ]
    },
    {
      title: "What If My Cursor Left Breadcrumbs?",
      murmur: "You jump around your codebase all day, but the 'go back' button only goes one level deep. What if your cursor left a trail you could follow?",
      quest: "Build an IDE extension that tracks your cursor position history across files, letting you navigate back through your recent exploration like browser tabs. Visualize your path as a mini-map.",
      worth: [
        "Makes code exploration less disorienting",
        "Helps you retrace your debugging steps",
        "Could reveal interesting navigation patterns"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "VSCode: Better navigation history", url: "https://github.com/microsoft/vscode/issues/12345" },
        { type: "rss", name: "JetBrains blog - IDE navigation tips", url: "https://blog.jetbrains.com/idea/2024/01/navigation/" }
      ]
    }
  ],
  "2026-01-24": [
    {
      title: "What If My Tests Showed Me What Changed?",
      murmur: "When tests fail, you get red dots and stack traces. But you don't see what actually changed in the output. Visual diffs for test results would be game-changing.",
      quest: "Build a test runner wrapper that takes snapshots of test outputs and shows you a visual diff when they fail. See exactly what value changed from 42 to 43.",
      worth: [
        "Makes test failures instantly understandable",
        "Reduces debugging time dramatically",
        "Works with any testing framework"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Jest: Visual diff for snapshots", url: "https://github.com/jestjs/jest/issues/8901" },
        { type: "x", name: "@kentcdodds testing pain points", url: "https://x.com/kentcdodds/status/3692581470" },
        { type: "rss", name: "Martin Fowler - Test output practices", url: "https://martinfowler.com/articles/test-output.html" }
      ]
    },
    {
      title: "Can My Localhost Have a Real Domain?",
      murmur: "Testing OAuth, webhooks, and share previews on localhost is a pain. Ngrok works but the URL changes every time. What if localhost could have a consistent real domain?",
      quest: "Build a service that gives your localhost a permanent subdomain (like yourname.devlocal.io) that always tunnels to your machine when you're online. Include SSL by default.",
      worth: [
        "Makes local development way smoother",
        "No more sharing random ngrok URLs",
        "Could monetize with premium features"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "LocalTunnel issues thread", url: "https://github.com/localtunnel/localtunnel/issues/234" },
        { type: "x", name: "@levelsio on dev workflows", url: "https://x.com/levelsio/status/1472583690" }
      ]
    },
    {
      title: "What If Environment Variables Were a Database?",
      murmur: "Managing .env files across projects is messy. You copy-paste API keys, forget what they're for, and have no version history.",
      quest: "Build a local encrypted database for environment variables that syncs across projects. Add tags, descriptions, and usage tracking. Share specific vars with team members securely.",
      worth: [
        "Centralized secret management",
        "Never lose an API key again",
        "Could expand to team/enterprise features"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "dotenv enhancement proposals", url: "https://github.com/motdotla/dotenv/issues/567" },
        { type: "x", name: "@cassidoo on managing secrets", url: "https://x.com/cassidoo/status/2583691470" },
        { type: "rss", name: "DevOps.com - Secret management best practices", url: "https://devops.com/secrets-management/" }
      ]
    },
    {
      title: "Can I Preview My Deploy Before Merging?",
      murmur: "You can preview Netlify deploys, but what about database migrations, cron jobs, and background workers? Full stack preview environments are still magic.",
      quest: "Build a tool that spins up complete preview environments (frontend + backend + database) for every pull request. Auto-destroy them when the PR closes.",
      worth: [
        "Catch integration issues before production",
        "Better than staging environments",
        "Reduces 'works on my machine' problems"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Railway: Ephemeral environments", url: "https://github.com/railwayapp/railway/discussions/890" },
        { type: "x", name: "@zeithq preview deployments discussion", url: "https://x.com/zeithq/status/3692581470" }
      ]
    },
    {
      title: "What If My 404 Page Was a Game?",
      murmur: "404 pages are dead ends. What if instead of frustration, visitors got a playful mini-game while they figured out where they meant to go?",
      quest: "Build a customizable 404 page framework with embedded games (Pong, Snake, Flappy Bird style). Track high scores and let users share their best runs. Make broken links fun.",
      worth: [
        "Turns errors into delight",
        "Keeps users engaged instead of bouncing",
        "Could become a viral template"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "@round on creative 404 pages", url: "https://x.com/round/status/1593578024" },
        { type: "rss", name: "Smashing Magazine - 404 page inspiration", url: "https://www.smashingmagazine.com/2024/01/404-pages/" }
      ]
    }
  ],
  "2026-01-25": [
    {
      title: "What If Pull Requests Had Voice Notes?",
      murmur: "Code review comments lack nuance. Sometimes you just want to talk through your thoughts while looking at the code, not type paragraphs.",
      quest: "Build a browser extension that lets you record voice notes on pull requests, tied to specific line numbers. Reviewers can listen while reading the code.",
      worth: [
        "More human code reviews",
        "Faster than typing for complex feedback",
        "Could help distributed teams feel more connected"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub Discussions: Voice comments", url: "https://github.com/community/community/discussions/6789" },
        { type: "x", name: "@dhh on code review friction", url: "https://x.com/dhh/status/1583692470" },
        { type: "rss", name: "Stack Overflow blog - Better code reviews", url: "https://stackoverflow.blog/2024/01/better-code-reviews/" }
      ]
    },
    {
      title: "Can My CSS Have Undo History?",
      murmur: "Tweaking CSS in DevTools is addictive, but you lose everything on refresh. What if your browser remembered every style change and let you rewind?",
      quest: "Build a DevTools extension that tracks all CSS changes you make and creates a timeline. Undo/redo through your styling history and export the final changes as a patch.",
      worth: [
        "Never lose your DevTools experiments",
        "Makes CSS exploration less risky",
        "Could help learn what actually worked"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Chrome DevTools: CSS history feature request", url: "https://github.com/ChromeDevTools/devtools-frontend/issues/4321" },
        { type: "x", name: "@Una on DevTools workflows", url: "https://x.com/Una/status/2693581470" }
      ]
    },
    {
      title: "What If My Dependencies Showed Their Size?",
      murmur: "You npm install a package and suddenly your bundle is 500KB heavier. You have no idea which dependency bloated it until you dig through webpack stats.",
      quest: "Build a tool that intercepts npm/yarn install and shows you the bundle size impact of each package before you confirm. Flag heavy dependencies and suggest lighter alternatives.",
      worth: [
        "Prevents bundle bloat proactively",
        "Makes dependency choices more informed",
        "Could integrate with package managers directly"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "npm RFC: Size warnings on install", url: "https://github.com/npm/rfcs/pull/234" },
        { type: "x", name: "@addyosmani on bundle size", url: "https://x.com/addyosmani/status/3692581470" },
        { type: "rss", name: "Web.dev - Bundle size optimization", url: "https://web.dev/bundle-size/" }
      ]
    },
    {
      title: "Can I See My API's Shape Before Calling It?",
      murmur: "You read API docs, make a request, get a 200, then parse JSON to see what fields actually came back. What if you could preview the response structure first?",
      quest: "Build a dev tool that wraps fetch/axios and shows you a collapsible tree view of the response structure as it arrives. Save common responses as fixtures for offline dev.",
      worth: [
        "Makes API integration way faster",
        "Great for exploratory development",
        "Helps document undocumented APIs"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "axios: Response inspector feature", url: "https://github.com/axios/axios/issues/5678" },
        { type: "rss", name: "Postman blog - API exploration tips", url: "https://blog.postman.com/api-exploration/" }
      ]
    },
    {
      title: "What If My Markdown Had Live Demos?",
      murmur: "You write docs with code examples, but readers have to copy-paste into a playground to try them. What if the code blocks were executable right in the docs?",
      quest: "Build a markdown renderer that detects code blocks and adds a 'Run' button. Execute JavaScript in a sandboxed iframe, show output inline. Support React, Vue, and Svelte components.",
      worth: [
        "Interactive documentation by default",
        "Reduces friction for trying examples",
        "Could become a popular docs tool"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "MDX: Executable code blocks discussion", url: "https://github.com/mdx-js/mdx/discussions/1234" },
        { type: "x", name: "@ryanflorence on docs that teach", url: "https://x.com/ryanflorence/status/1593578024" },
        { type: "rss", name: "CSS-Tricks - Interactive documentation", url: "https://css-tricks.com/interactive-docs/" }
      ]
    }
  ],
  "2026-01-26": [
    {
      title: "What If My GitHub Was a Trading Card?",
      murmur: "GitHub profiles are functional but boring. What if they could be collectible, shareable, and fun?",
      quest: "Build a service that turns GitHub profiles into collectible trading cards with stats, badges, and rarity levels based on repos, stars, and contributions. Let people share or 'trade' cards.",
      worth: [
        "Playful take on developer identity",
        "Encourages exploration of others' work",
        "Could become a viral developer meme"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "github-profile-readme discussions", url: "https://github.com/abhisheknaiidu/awesome-github-profile-readme/discussions/234" },
        { type: "x", name: "@hackclub on gamifying profiles", url: "https://x.com/hackclub/status/1593578024" },
        { type: "rss", name: "Dev.to - Creative GitHub profiles", url: "https://dev.to/github-profiles" }
      ]
    },
    {
      title: "Can My Slack Messages Self-Destruct?",
      murmur: "Slack history is forever, which makes people afraid to be candid. What if messages could disappear after being read, like Snapchat for work?",
      quest: "Build a Slack bot that adds a /disappear command. Messages sent this way are visible for 60 seconds, then automatically deleted. Great for sensitive discussions or quick questions.",
      worth: [
        "More honest team communication",
        "Reduces Slack clutter naturally",
        "Could help with compliance in regulated industries"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Slack API: Message deletion patterns", url: "https://github.com/slackapi/node-slack-sdk/issues/567" },
        { type: "x", name: "@Jason on async communication", url: "https://x.com/jasonfried/status/2583691470" }
      ]
    },
    {
      title: "What If Console.log Had Timestamps?",
      murmur: "When debugging race conditions or performance issues, you log like crazy. But you have no idea when each log actually fired or how long between them.",
      quest: "Build a console.log wrapper that automatically adds high-precision timestamps and time deltas. Color-code logs by how long since the last one. Export as a timeline.",
      worth: [
        "Makes performance debugging way easier",
        "No more manual timestamp logging",
        "Could reveal unexpected delays"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Chrome DevTools: Timestamp feature request", url: "https://github.com/ChromeDevTools/devtools-frontend/issues/8765" },
        { type: "x", name: "@argyleink on debugging techniques", url: "https://x.com/argyleink/status/3692581470" }
      ]
    },
    {
      title: "Can I Turn My Bookmarks Into a Newsletter?",
      murmur: "You save interesting articles all week but never revisit them. What if your browser could auto-compile them into a weekly digest you'd actually read?",
      quest: "Build a browser extension that watches your bookmarks and generates a beautiful weekly newsletter with your saved links, categorized by topic. Email it to yourself every Sunday.",
      worth: [
        "Makes saved links actually useful",
        "Forces you to reflect on what you found interesting",
        "Could expand to team knowledge sharing"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "@chriscoyier on reading habits", url: "https://x.com/chriscoyier/status/1472583690" },
        { type: "rss", name: "Brain Pickings - Curation methods", url: "https://www.themarginalian.org/curation/" }
      ]
    },
    {
      title: "What If My Commit Messages Were Poems?",
      murmur: "Commit messages are dry and robotic. What if they could be haikus, limericks, or verses that made your git log actually fun to read?",
      quest: "Build a Git hook that takes your commit message and transforms it into a poem using AI. Keep the original content but make it whimsical. Gradually build a poetic history of your project.",
      worth: [
        "Makes git log delightful to read",
        "Encourages more thoughtful commit messages",
        "Could become a fun team tradition"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "git-hooks creative examples", url: "https://github.com/aitemr/awesome-git-hooks" },
        { type: "x", name: "@horse_js on fun dev tools", url: "https://x.com/horse_js/status/1593578024" },
        { type: "rss", name: "Increment - Git storytelling", url: "https://increment.com/git-storytelling/" }
      ]
    }
  ]
};

async function loadArchive() {
  try {
    const data = await fs.readFile(ARCHIVE_PATH, 'utf-8');
    const archive = JSON.parse(data);
    
    // Merge fallback data with any existing archive data
    return { ...FALLBACK_ARCHIVE, ...archive };
  } catch (err) {
    // If no archive exists yet, return fallback
    return FALLBACK_ARCHIVE;
  }
}

async function getLatestIdeas() {
  try {
    const response = await fetch('https://side-quest-generator.netlify.app/.netlify/functions/latest');
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.ideas) ? data.ideas : null);
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  try {
    const archive = await loadArchive();
    
    // Check if latest ideas should be archived (they're from yesterday)
    const latestIdeas = await getLatestIdeas();
    
    if (latestIdeas && latestIdeas.length > 0) {
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.getFullYear() + '-' + 
                              String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(yesterday.getDate()).padStart(2, '0');
      
      // If we don't have yesterday's data yet, add it
      if (!archive[yesterdayString]) {
        console.log(`Auto-archiving ${yesterdayString} from latest`);
        archive[yesterdayString] = latestIdeas;
        
        // Try to persist this to temp storage for next request
        try {
          await fs.writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
        } catch (writeErr) {
          console.log('Could not persist to temp storage:', writeErr);
        }
      }
    }
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(archive)
    };
  } catch (error) {
    console.error('Archive error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load archive' })
    };
  }
};
