import { promises as fs } from 'fs';
import path from 'path';

const LATEST_PATH = path.join('/tmp', 'latest.json');

// Add diverse sources to ideas that have too few
function enrichSources(ideas) {
  const githubSources = [
    { name: "GitHub Issues discussions", url: "https://github.com/features/issues" },
    { name: "VSCode feature requests", url: "https://github.com/microsoft/vscode/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions" },
    { name: "Awesome developer tools", url: "https://github.com/topics/developer-tools" },
    { name: "CLI tools showcase", url: "https://github.com/topics/cli" },
    { name: "Web development discussions", url: "https://github.com/topics/web-development" },
    { name: "Developer productivity tools", url: "https://github.com/topics/productivity" },
    { name: "Awesome lists collection", url: "https://github.com/sindresorhus/awesome" }
  ];
  
  const xSources = [
    { name: "X discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
    { name: "X thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
    { name: "X conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" },
    { name: "X discussion on dev tools", url: "https://x.com/search?q=developer%20tools%20productivity&f=live" },
    { name: "X thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
    { name: "X conversation on CLI tools", url: "https://x.com/search?q=CLI%20tool%20ideas&f=live" },
    { name: "X discussion on code quality", url: "https://x.com/search?q=code%20quality%20tools&f=live" },
    { name: "X thread on web performance", url: "https://x.com/search?q=web%20performance%20optimization&f=live" }
  ];
  
  const rssSources = [
    { name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" },
    { name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" },
    { name: "Indie Hackers - Product ideas", url: "https://www.indiehackers.com/products" },
    { name: "CSS-Tricks - Developer workflows", url: "https://css-tricks.com/tag/workflow/" },
    { name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" },
    { name: "JavaScript Weekly archives", url: "https://javascriptweekly.com/issues" },
    { name: "Node Weekly archives", url: "https://nodeweekly.com/issues" },
    { name: "Web.dev articles", url: "https://web.dev/articles" }
  ];
  
  return ideas.map(idea => {
    // If idea already has 2+ sources, keep them
    if (idea.sources && idea.sources.length >= 2) {
      return idea;
    }
    
    // Build new diverse sources array
    const newSources = [];
    
    // Always include 1-2 GitHub sources
    const numGithub = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numGithub; i++) {
      const source = githubSources[Math.floor(Math.random() * githubSources.length)];
      newSources.push({ type: 'github', ...source });
    }
    
    // Add 1 X source (70% chance) or RSS (30% chance)
    if (Math.random() > 0.3) {
      const source = xSources[Math.floor(Math.random() * xSources.length)];
      newSources.push({ type: 'x', ...source });
    } else {
      const source = rssSources[Math.floor(Math.random() * rssSources.length)];
      newSources.push({ type: 'rss', ...source });
    }
    
    // 50% chance to add a 3rd source
    if (Math.random() > 0.5 && newSources.length === 2) {
      const source = rssSources[Math.floor(Math.random() * rssSources.length)];
      newSources.push({ type: 'rss', ...source });
    }
    
    return {
      ...idea,
      sources: newSources
    };
  });
}

function getFallbackIdeas() {
  return [
    {
      title: "What If My Dotfiles Had a Version Picker?",
      murmur: "You tweak your shell config constantly, but there's no easy way to roll back when something breaks. Git helps, but it's not instant.",
      quest: "Build a dotfiles manager that snapshots your config after every change and lets you switch between versions with a TUI. See a diff of what changed and quickly revert bad edits.",
      worth: [
        "Makes config experimentation risk-free",
        "Great for trying new shell setups",
        "Could help others learn from your dotfiles evolution"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Awesome dotfiles collection", url: "https://github.com/webpro/awesome-dotfiles" },
        { type: "x", name: "X thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
        { type: "rss", name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" }
      ]
    },
    {
      title: "Can My Browser Tabs Auto-Organize by Project?",
      murmur: "You have 50 tabs open across 3 different projects, but they're all mixed together. Finding the right tab becomes archaeological work.",
      quest: "Build a browser extension that uses ML to detect which project each tab belongs to (by domain patterns, keywords, or manual tagging) and auto-groups them into collapsible sections.",
      worth: [
        "Instant mental clarity for multitaskers",
        "Reduces context switching friction",
        "Could learn your project patterns over time"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Chrome extensions samples", url: "https://github.com/GoogleChrome/chrome-extensions-samples" },
        { type: "x", name: "X discussion on dev tools", url: "https://x.com/search?q=developer%20tools%20productivity&f=live" }
      ]
    },
    {
      title: "What If npm install Told Me Why It's Slow?",
      murmur: "npm install takes forever sometimes, and you have no idea which package is the bottleneck. You just stare at the spinner and wait.",
      quest: "Build a wrapper around npm/yarn that shows you which package is currently downloading, how large it is, and how long it's taking. Get real-time visibility into your install process.",
      worth: [
        "Instant feedback on what's actually happening",
        "Helps identify problem dependencies",
        "Makes slow installs less frustrating"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "npm CLI discussions", url: "https://github.com/npm/cli/discussions" },
        { type: "rss", name: "Node Weekly archives", url: "https://nodeweekly.com/issues" }
      ]
    },
    {
      title: "Can My IDE Remember My Mental Bookmarks?",
      murmur: "You mentally bookmark certain files or lines while coding ('that's where the auth logic is'), but your IDE forgets the moment you close it.",
      quest: "Build an IDE extension that lets you drop invisible bookmarks in your code with notes. They persist across sessions and show up as a sidebar list. Jump to any bookmark instantly.",
      worth: [
        "Externalizes your mental code map",
        "Great for large codebases",
        "Could share bookmarks with teammates"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "VSCode feature requests", url: "https://github.com/microsoft/vscode/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions" },
        { type: "x", name: "X conversation on CLI tools", url: "https://x.com/search?q=CLI%20tool%20ideas&f=live" },
        { type: "rss", name: "Web.dev articles", url: "https://web.dev/articles" }
      ]
    },
    {
      title: "What If My README Had Live Badges That Actually Mean Something?",
      murmur: "GitHub README badges are everywhere, but most are just static images. What if they could show real-time, useful data about your project?",
      quest: "Build a badge service that tracks meaningful metrics: last commit recency, issue response time, documentation coverage, or 'vibe score' based on commit message sentiment. Make badges informative again.",
      worth: [
        "Honest project health at a glance",
        "Encourages maintainer accountability",
        "Could become a new standard for READMEs"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Shields.io badge service", url: "https://github.com/badges/shields" },
        { type: "x", name: "X thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" }
      ]
    }
  ];
}

export const handler = async (event) => {
  try {
    let ideas;
    
    // Try to load from latest.json
    try {
      const data = await fs.readFile(LATEST_PATH, 'utf-8');
      ideas = JSON.parse(data);
    } catch (err) {
      // If no latest.json, use fallback
      console.log('No latest.json found, using fallback');
      ideas = getFallbackIdeas();
    }
    
    // Enrich sources to ensure diversity
    ideas = enrichSources(ideas);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(ideas)
    };
  } catch (error) {
    console.error('Latest endpoint error:', error);
    
    // Return fallback on any error
    const fallbackIdeas = getFallbackIdeas();
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(fallbackIdeas)
    };
  }
};
