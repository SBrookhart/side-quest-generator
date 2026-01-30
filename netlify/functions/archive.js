import { promises as fs } from 'fs';
import path from 'path';

const ARCHIVE_PATH = path.join('/tmp', 'archive.json');

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
  ],
  "2026-01-25": [
    {
      title: "What If PRs Had Voice Notes?",
      murmur: "Code review comments are text-only and sometimes you just need to explain something with your voice. Writing paragraphs feels exhausting.",
      quest: "Build a browser extension for GitHub that lets you leave voice note comments on PRs. Record 30-second explanations, attach them to lines of code, and reviewers can listen instead of read.",
      worth: [
        "Explains complex logic faster than typing",
        "Adds warmth to remote collaboration",
        "Great for async teams across timezones"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub Discussions", url: "https://github.com/community/community/discussions" },
        { type: "x", name: "Conversation on code review", url: "https://x.com/search?q=code%20review%20tools&f=live" },
        { type: "rss", name: "Dev.to community posts", url: "https://dev.to" }
      ]
    },
    {
      title: "Can My CSS Have an Undo Button?",
      murmur: "You're tweaking styles in DevTools and accidentally break something. Finding the exact change you made is impossible without refreshing and losing everything.",
      quest: "Build a browser extension that adds undo/redo to DevTools CSS changes. Track every edit, let you step backward through changes, and export your final tweaks as a patch file.",
      worth: [
        "Makes CSS experimentation fearless",
        "Never lose perfect styles to one bad edit",
        "Helps you learn by reviewing what worked"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Chrome DevTools discussions", url: "https://github.com/ChromeDevTools" },
        { type: "x", name: "Thread on frontend tools", url: "https://x.com/search?q=frontend%20dev%20tools&f=live" }
      ]
    },
    {
      title: "What If npm Warned Me About Bundle Size?",
      murmur: "You npm install a package and suddenly your bundle grows by 200KB. You only find out later when your build is slow and users complain.",
      quest: "Build a CLI tool that intercepts npm install and shows you the bundle size impact before installing. Display alternatives if the package is huge, and let you cancel if it's too big.",
      worth: [
        "Prevents bundle bloat at install time",
        "Makes you more conscious of dependencies",
        "Helps keep apps fast by default"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "npm feature requests", url: "https://github.com/npm/cli/discussions" },
        { type: "x", name: "Discussion on web performance", url: "https://x.com/search?q=web%20performance%20bundle&f=live" },
        { type: "rss", name: "Web.dev articles", url: "https://web.dev/articles" }
      ]
    },
    {
      title: "Can API Responses Show Me Their Shape?",
      murmur: "You call an API and get back JSON, but you have to dig through the response to understand its structure. TypeScript helps but isn't always available.",
      quest: "Build a browser extension or CLI that intercepts API responses and generates a visual tree diagram of the JSON structure. Collapsible, searchable, and copyable as TypeScript interfaces.",
      worth: [
        "Understand APIs instantly without docs",
        "Great for exploring new services",
        "Turns raw JSON into useful types"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "axios discussions", url: "https://github.com/axios/axios/discussions" },
        { type: "rss", name: "Postman blog", url: "https://blog.postman.com" }
      ]
    },
    {
      title: "What If READMEs Were Interactive?",
      murmur: "READMEs are static markdown files. What if you could run code examples directly in the browser without cloning the repo?",
      quest: "Build a markdown processor that turns code blocks into runnable sandboxes. Users can edit examples, see output instantly, and experiment with your library without setup.",
      worth: [
        "Lowers the barrier to trying your project",
        "Makes documentation way more engaging",
        "Instant feedback for learners"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "MDX discussions", url: "https://github.com/mdx-js/mdx/discussions" },
        { type: "x", name: "Thread on documentation", url: "https://x.com/search?q=interactive%20documentation&f=live" },
        { type: "rss", name: "CSS-Tricks", url: "https://css-tricks.com" }
      ]
    }
  ],
  "2026-01-26": [
    {
      title: "What If My GitHub Profile Was a Trading Card?",
      murmur: "Your GitHub profile is a wall of green squares. What if it was a collectible card with stats, rarity, and personality?",
      quest: "Build a tool that generates trading card-style images from GitHub profiles. Show contribution streaks as power levels, languages as types, and repos as special abilities. Make them shareable as PNGs.",
      worth: [
        "Turns your GitHub into something fun to share",
        "Great icebreaker for developer communities",
        "Weekend build that's immediately viral"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "awesome-github-profile-readme", url: "https://github.com/abhisheknaiidu/awesome-github-profile-readme" },
        { type: "x", name: "Discussion on developer portfolios", url: "https://x.com/search?q=github%20profile%20design&f=live" },
        { type: "rss", name: "Dev.to community", url: "https://dev.to" }
      ]
    },
    {
      title: "Can Slack Messages Self-Destruct?",
      murmur: "You share sensitive info in Slack that should only be visible temporarily. Edit/delete works but isn't automatic and you forget.",
      quest: "Build a Slack bot that lets you send self-destructing messages. Use /burn to set a timer, and the message disappears after 5 minutes, 1 hour, or whatever you choose.",
      worth: [
        "Keeps sensitive info from living forever",
        "Reduces Slack clutter naturally",
        "Adds a spy-movie vibe to work chat"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Slack API patterns", url: "https://github.com/slackapi" },
        { type: "x", name: "Thread on workplace tools", url: "https://x.com/search?q=slack%20automation&f=live" }
      ]
    },
    {
      title: "What If console.log Had Timestamps?",
      murmur: "You're debugging async code and logs appear out of order. You have no idea when each log actually fired relative to others.",
      quest: "Build a tiny console.log wrapper that automatically prefixes every log with a high-precision timestamp and time delta from the previous log. See exactly how long operations take.",
      worth: [
        "Makes async debugging crystal clear",
        "No more adding timestamps manually",
        "Helps optimize slow operations instantly"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Chrome DevTools feature requests", url: "https://github.com/ChromeDevTools" },
        { type: "x", name: "Conversation on debugging", url: "https://x.com/search?q=debugging%20javascript&f=live" }
      ]
    },
    {
      title: "Can My Bookmarks Become a Newsletter?",
      murmur: "You save dozens of interesting articles every week but never revisit them. What if your bookmarks auto-organized into a weekly digest?",
      quest: "Build a browser extension that groups your saved bookmarks by week and generates a beautiful newsletter-style HTML page. Share it privately or publish as a blog post.",
      worth: [
        "Makes saved content actually useful",
        "Great way to share curated finds",
        "Your weekly reads become a product"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "Discussion on content curation", url: "https://x.com/search?q=content%20curation%20tools&f=live" },
        { type: "rss", name: "Brain Pickings style curation", url: "https://www.themarginalian.org" }
      ]
    },
    {
      title: "What If Git Commits Were Poems?",
      murmur: "Commit messages are boring status updates. What if they were haikus or limericks instead? Make version control poetic.",
      quest: "Build a git hook that validates commit messages are valid haikus (5-7-5 syllables). Reject commits that don't rhyme. Make your git history an art project.",
      worth: [
        "Makes commits way more memorable",
        "Forces you to think about changes poetically",
        "Your git log becomes literature"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "awesome-git-hooks", url: "https://github.com/aitemr/awesome-git-hooks" },
        { type: "x", name: "Thread on creative coding", url: "https://x.com/search?q=creative%20programming&f=live" },
        { type: "rss", name: "Increment magazine", url: "https://increment.com" }
      ]
    }
  ],
  "2026-01-27": [
    {
      title: "What If My Code Commits Were a Tamagotchi?",
      murmur: "You commit code every day, but it's just numbers and graphs. What if your commit streak was a little creature you had to keep alive?",
      quest: "Build a GitHub widget that turns your commit history into a virtual pet. The more you commit, the happier it gets. Skip a day and it gets sad. Let it evolve based on your coding patterns.",
      worth: [
        "Makes daily commits actually adorable",
        "Guilt trips you in the cutest way",
        "Perfect conversation starter for your README"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub API discussions", url: "https://github.com/topics/github-api" },
        { type: "x", name: "Thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
        { type: "rss", name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" }
      ]
    },
    {
      title: "Can My Spotify Wrapped Be for My Code?",
      murmur: "Spotify makes listening to music feel like an achievement. Why doesn't coding? You deserve a year-end recap of your most-used functions, weirdest variable names, and coding music.",
      quest: "Build a tool that analyzes your GitHub repos and generates a beautiful Spotify Wrapped-style video: most productive hour, favorite programming language, most refactored file, and a playlist recommendation based on your commit messages.",
      worth: [
        "Makes you feel accomplished about your year",
        "Extremely shareable on social media",
        "Everyone will want one"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub API discussions", url: "https://github.com/topics/github-api" },
        { type: "x", name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" }
      ]
    },
    {
      title: "What If My To-Do List Was a Plant?",
      murmur: "To-do apps are stressful and guilt-inducing. What if instead of checking boxes, you were watering a plant that grows with each completed task?",
      quest: "Build a to-do app where each task is a seed. Complete it and the plant grows. Skip tasks and it wilts. Watch your productivity garden flourish over time. Export your garden as a printable poster.",
      worth: [
        "Makes productivity feel nurturing, not punishing",
        "Your task list becomes something beautiful",
        "Way more motivating than checkboxes"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
        { type: "rss", name: "Indie Hackers - Product ideas", url: "https://www.indiehackers.com/products" }
      ]
    },
    {
      title: "Can My Browser History Tell a Story?",
      murmur: "Your browser history is a treasure trove of who you are—late-night rabbit holes, research spirals, inspiration hunts. What if it could narrate your intellectual journey?",
      quest: "Build a browser extension that turns your browsing history into a generated narrative. 'On Tuesday, you fell down a rabbit hole about mushroom foraging, then pivoted to sourdough bread at 2am.' Share your weekly story or keep it private.",
      worth: [
        "Makes your internet wandering feel meaningful",
        "Great for reflection and self-awareness",
        "Weirdly intimate and shareable"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Chrome extensions samples", url: "https://github.com/GoogleChrome/chrome-extensions-samples" },
        { type: "x", name: "Thread on web performance", url: "https://x.com/search?q=web%20performance%20optimization&f=live" },
        { type: "rss", name: "CSS-Tricks - Developer workflows", url: "https://css-tricks.com/tag/workflow/" }
      ]
    },
    {
      title: "What If Error Messages Were Compliments?",
      murmur: "Debugging is already hard. Error messages don't need to be cold and technical. What if they hyped you up instead?",
      quest: "Build a dev tool that intercepts error messages and rewrites them with encouragement. 'Syntax error on line 12' becomes 'Hey, almost there! Just a tiny typo on line 12—you got this!' Customize the vibe: supportive, sarcastic, or chaotic.",
      worth: [
        "Makes debugging way less demoralizing",
        "Actually helps beginners stay motivated",
        "Could become the most wholesome dev tool ever"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Developer productivity tools", url: "https://github.com/topics/productivity" },
        { type: "rss", name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" }
      ]
    }
  ],
  "2026-01-28": [
    {
      title: "What If My Zoom Calls Had Subtitles... But Funnier?",
      murmur: "Zoom auto-captions are helpful but robotic. What if they added personality—roasting tangents, celebrating good points, or just making meetings less boring?",
      quest: "Build a tool that intercepts Zoom captions, runs them through a sentiment AI, and adds snarky commentary or emoji reactions in real-time. 'This meeting could have been an email 😴'",
      worth: [
        "Makes long meetings actually entertaining",
        "Great for keeping attention in all-hands",
        "Instant viral tool for remote work"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Zoom SDK discussions", url: "https://github.com/zoom" },
        { type: "x", name: "Discussion on remote work tools", url: "https://x.com/search?q=remote%20work%20tools&f=live" },
        { type: "rss", name: "JavaScript Weekly", url: "https://javascriptweekly.com/issues" }
      ]
    },
    {
      title: "Can My GitHub Contributions Be a Pixelated Garden?",
      murmur: "The green contribution graph is boring. What if each commit was a flower, tree, or mushroom that grew over time in a tiny pixel art garden?",
      quest: "Build a tool that turns your GitHub contribution graph into a procedurally generated pixel art garden. More commits = more plants. Let it export as wallpaper or animated GIF.",
      worth: [
        "Makes your profile actually beautiful",
        "Gamifies contributions in a chill way",
        "Perfect portfolio piece energy"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub API projects", url: "https://github.com/topics/github-api" },
        { type: "x", name: "Thread on creative coding", url: "https://x.com/search?q=creative%20coding%20projects&f=live" }
      ]
    },
    {
      title: "What If Podcasts Had Chapter Markers... Automatically?",
      murmur: "Long podcasts are hard to navigate. You remember a great insight but can't find it. What if AI generated chapter markers from the transcript?",
      quest: "Build a tool that takes a podcast MP3, transcribes it, uses AI to detect topic changes, and generates chapter markers. Export as enhanced MP3 with embedded chapters.",
      worth: [
        "Makes podcasts way more usable",
        "Helps creators without editing skills",
        "Could process your entire backlog overnight"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Audio processing libraries", url: "https://github.com/topics/audio-processing" },
        { type: "x", name: "Conversation on podcast tools", url: "https://x.com/search?q=podcast%20editing%20tools&f=live" },
        { type: "rss", name: "Indie Hackers - Media tools", url: "https://www.indiehackers.com/products" }
      ]
    },
    {
      title: "Can My Calendar Show My 'Deep Work' Blocks?",
      murmur: "Your calendar is full of meetings, but you don't know when you actually have focus time. What if it highlighted your uninterrupted blocks automatically?",
      quest: "Build a calendar overlay that detects gaps between meetings, labels them as deep work time, and suggests optimal times to schedule new meetings that preserve focus blocks.",
      worth: [
        "Makes protecting deep work effortless",
        "Helps you say no to bad meeting times",
        "Visual reminder of your actual productive hours"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Calendar API projects", url: "https://github.com/topics/calendar" },
        { type: "rss", name: "Smashing Magazine - Productivity", url: "https://www.smashingmagazine.com/category/tools" }
      ]
    },
    {
      title: "What If My Keyboard Typed in Comic Sans When I'm Stressed?",
      murmur: "You're frustrated coding and your typing gets aggressive. What if your editor detected stress and switched fonts to de-escalate the situation?",
      quest: "Build an editor extension that monitors typing speed and force. When you're stress-typing, it temporarily switches to Comic Sans (or another calming font) until you chill out.",
      worth: [
        "Surprisingly effective mood regulator",
        "Makes debugging less rage-inducing",
        "Extremely funny conversation starter"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "VSCode extension ideas", url: "https://github.com/microsoft/vscode" },
        { type: "x", name: "Thread on developer wellness", url: "https://x.com/search?q=developer%20mental%20health&f=live" }
      ]
    }
  ],
  "2026-01-29": [
    {
      title: "What If My Music Taste Was a Data Visualization?",
      murmur: "Your Spotify history is just lists. What if it was an evolving, interactive artwork that showed your musical journey over time?",
      quest: "Build a tool that visualizes your music listening history as an animated graph—genres as colors, time as a flowing river, moods as weather patterns. Export as video or live dashboard.",
      worth: [
        "Your taste becomes actual art",
        "Great way to discover forgotten favorites",
        "Makes Spotify data actually meaningful"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Spotify API projects", url: "https://github.com/topics/spotify-api" },
        { type: "x", name: "Discussion on data visualization", url: "https://x.com/search?q=data%20visualization%20creative&f=live" },
        { type: "rss", name: "Web.dev articles", url: "https://web.dev/articles" }
      ]
    },
    {
      title: "Can Pull Requests Be Summarized... in Haiku?",
      murmur: "PR descriptions are walls of text. What if AI condensed them into beautiful haikus that captured the essence of the change?",
      quest: "Build a GitHub Action that analyzes PR diffs, generates a haiku summary, and posts it as the first comment. Bonus: rate PRs by how poetic their changes are.",
      worth: [
        "Makes code review instantly more fun",
        "Forces clarity in change descriptions",
        "Your git history becomes poetry"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub Actions marketplace", url: "https://github.com/marketplace?type=actions" },
        { type: "x", name: "Thread on creative coding", url: "https://x.com/search?q=creative%20programming%20fun&f=live" }
      ]
    },
    {
      title: "What If Emails Had Mood Indicators?",
      murmur: "You can't tell tone in emails. Is this person annoyed or just brief? What if every message had an AI-generated mood emoji?",
      quest: "Build a browser extension that analyzes incoming emails for sentiment and adds a mood indicator (😊 🤔 😤) next to the sender's name. Never misread tone again.",
      worth: [
        "Prevents email misunderstandings",
        "Helps you prioritize responses by urgency",
        "Makes inbox management less stressful"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Email parsing libraries", url: "https://github.com/topics/email" },
        { type: "x", name: "Conversation on communication tools", url: "https://x.com/search?q=email%20productivity%20tools&f=live" },
        { type: "rss", name: "CSS-Tricks", url: "https://css-tricks.com" }
      ]
    },
    {
      title: "Can My Desktop Wallpaper Change Based on My Mood?",
      murmur: "Your wallpaper is static and boring. What if it adapted to how you're feeling based on your activity patterns?",
      quest: "Build a background app that monitors your typing speed, music choice, and calendar to guess your mood. Switch wallpapers automatically: calm blues when focused, energizing colors when stressed.",
      worth: [
        "Ambient environment that adapts to you",
        "Makes your workspace feel alive",
        "Surprisingly effective mood booster"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Desktop automation tools", url: "https://github.com/topics/automation" },
        { type: "rss", name: "Hacker News - Show HN", url: "https://news.ycombinator.com/show" }
      ]
    },
    {
      title: "What If Wikipedia Had a 'Random Walk' Game?",
      murmur: "Wikipedia rabbit holes are amazing but aimless. What if there was a game that challenged you to get from one topic to another in the fewest clicks?",
      quest: "Build a browser extension for Wikipedia that sets start/end articles and tracks your path. Compete for shortest routes, discover weird connections, share your journey.",
      worth: [
        "Makes learning accidentally competitive",
        "Reveals surprising topic connections",
        "Perfect procrastination tool"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Wikipedia API projects", url: "https://github.com/topics/wikipedia" },
        { type: "x", name: "Discussion on educational games", url: "https://x.com/search?q=educational%20games%20web&f=live" },
        { type: "rss", name: "Smashing Magazine", url: "https://www.smashingmagazine.com" }
      ]
    }
  ]
};

async function loadArchive() {
  try {
    const data = await fs.readFile(ARCHIVE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

async function saveArchive(archive) {
  await fs.writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
}

export const handler = async (event) => {
  try {
    let archive = await loadArchive();
    
    // Merge with fallback archive (fallback takes precedence for dates not in storage)
    archive = { ...FALLBACK_ARCHIVE, ...archive };
    
    // Try to get latest ideas and archive them if they're from yesterday
    try {
      const latestPath = path.join('/tmp', 'latest.json');
      const latestData = await fs.readFile(latestPath, 'utf-8');
      const latestIdeas = JSON.parse(latestData);
      
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.getFullYear() + '-' + 
                              String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(yesterday.getDate()).padStart(2, '0');
      
      // If we don't have yesterday's data and latest exists, add it
      if (!archive[yesterdayString] && latestIdeas && latestIdeas.length > 0) {
        archive[yesterdayString] = latestIdeas;
        await saveArchive(archive);
      }
    } catch (err) {
      // Latest doesn't exist, which is fine
      console.log('No latest ideas to auto-archive');
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
    
    // On any error, return the fallback archive
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
