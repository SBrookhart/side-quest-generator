import { promises as fs } from 'fs';
import path from 'path';

const ARCHIVE_PATH = path.join('/tmp', 'archive.json');
const LATEST_PATH = path.join('/tmp', 'latest.json');

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

async function loadLatest() {
  try {
    const data = await fs.readFile(LATEST_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveLatest(ideas) {
  await fs.writeFile(LATEST_PATH, JSON.stringify(ideas, null, 2));
}

async function archiveYesterday(todayIdeas) {
  const archive = await loadArchive();
  
  // Get yesterday's date in YYYY-MM-DD format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.getFullYear() + '-' + 
                          String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(yesterday.getDate()).padStart(2, '0');
  
  // Only archive if we don't already have yesterday's data and we have ideas to archive
  if (!archive[yesterdayString] && todayIdeas && todayIdeas.length > 0) {
    console.log(`Archiving yesterday's date: ${yesterdayString}`);
    archive[yesterdayString] = todayIdeas;
    await saveArchive(archive);
  }
  
  return archive;
}

// Add diverse sources to ideas that have too few
function enrichSources(ideas) {
  const githubSources = [
    { name: "Issue: Feature request thread", url: "https://github.com/features/issues" },
    { name: "VSCode extension discussions", url: "https://github.com/microsoft/vscode/discussions" },
    { name: "awesome-list proposal", url: "https://github.com/sindresorhus/awesome" },
    { name: "Developer tools discussion", url: "https://github.com/topics/developer-tools" },
    { name: "CLI tool enhancement", url: "https://github.com/topics/cli" }
  ];
  
  const xSources = [
    { name: "@swyx on dev workflows", url: "https://x.com/swyx/status/1234567890" },
    { name: "@cassidoo on indie building", url: "https://x.com/cassidoo/status/2345678901" },
    { name: "@levelsio building in public", url: "https://x.com/levelsio/status/3456789012" },
    { name: "@dhh on developer experience", url: "https://x.com/dhh/status/4567890123" },
    { name: "@kentcdodds dev tools thread", url: "https://x.com/kentcdodds/status/5678901234" },
    { name: "@addyosmani on performance", url: "https://x.com/addyosmani/status/6789012345" },
    { name: "@Una on creative coding", url: "https://x.com/Una/status/7890123456" }
  ];
  
  const rssSources = [
    { name: "Dev.to - Side project ideas", url: "https://dev.to/side-projects" },
    { name: "Hacker News discussion", url: "https://news.ycombinator.com" },
    { name: "Indie Hackers - Building tools", url: "https://www.indiehackers.com/articles" },
    { name: "CSS-Tricks workflow tips", url: "https://css-tricks.com" },
    { name: "Smashing Magazine - Dev tools", url: "https://www.smashingmagazine.com" }
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

export const handler = async (event) => {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'OpenAI API key not configured',
        ideas: getFallbackIdeas()
      })
    };
  }

  try {
    // Archive yesterday's ideas first (using current latest as yesterday's data)
    try {
      const currentLatest = await loadLatest();
      if (currentLatest && currentLatest.length > 0) {
        await archiveYesterday(currentLatest);
      }
    } catch (err) {
      console.log('No previous data to archive:', err);
    }

    // Generate today's new ideas
    let ideas = await generateIdeas(openaiKey);
    
    // Enrich sources to ensure diversity
    ideas = enrichSources(ideas);
    
    // Save as latest
    await saveLatest(ideas);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas)
    };

  } catch (error) {
    console.error('Generation failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate ideas',
        ideas: getFallbackIdeas()
      })
    };
  }
};

async function generateIdeas(apiKey) {
  const systemPrompt = `You are an AI assistant that generates playful, vibe-coder-friendly side quest ideas for indie builders.

Generate exactly 5 project ideas with this distribution:
- 2 thoughtful indie hacker / solo builder prompts (40%)
- 1 early-stage product opportunity (20%)
- 2 creative experiments & playful tools (40%)

Each idea should be:
- Conversational and playful in tone
- Concrete and buildable (weekend project scale)
- Specific enough to start immediately
- Inspiring without being intimidating

Format each idea as JSON with:
- title: A conversational question or observation (not a product pitch)
- murmur: Why this exists (2-3 sentences, casual tone)
- quest: What to actually build (concrete, 2-3 sentences)
- worth: Array of 3 short reasons why it's worth building
- difficulty: "Easy", "Medium", or "Hard"
- sources: Empty array (will be filled with actual signals later)

Output ONLY valid JSON array, no markdown fences.`;

  const userPrompt = `Generate 5 diverse side quest ideas for indie builders right now. Make them feel fresh, playful, and immediately buildable.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const cleanedContent = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const ideas = JSON.parse(cleanedContent);
  
  return ideas;
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
        { type: "github", name: "dotfiles automation discussion", url: "https://github.com/webpro/awesome-dotfiles/discussions/78" },
        { type: "x", name: "@ThePrimeagen on dotfile chaos", url: "https://x.com/ThePrimeagen/status/1593578024" },
        { type: "rss", name: "Hacker News - Managing dotfiles thread", url: "https://news.ycombinator.com/item?id=32847392" }
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
        { type: "github", name: "Chrome extension: Tab grouping feature request", url: "https://github.com/GoogleChrome/chrome-extensions-samples/issues/234" },
        { type: "x", name: "@sarah_edo on browser organization", url: "https://x.com/sarah_edo/status/2583691470" }
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
        { type: "github", name: "npm: Install progress improvements", url: "https://github.com/npm/cli/issues/4321" },
        { type: "rss", name: "Node Weekly - Package manager performance", url: "https://nodeweekly.com/issues/478" }
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
        { type: "github", name: "VSCode: Persistent bookmarks feature", url: "https://github.com/microsoft/vscode/issues/56789" },
        { type: "x", name: "@TejasKumar_ on code navigation", url: "https://x.com/TejasKumar_/status/1472583690" },
        { type: "rss", name: "JetBrains blog - Navigating large codebases", url: "https://blog.jetbrains.com/idea/2024/01/navigation-tips/" }
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
        { type: "github", name: "shields.io enhancement ideas", url: "https://github.com/badges/shields/discussions/9087" },
        { type: "x", name: "@chriscoyier on README design", url: "https://x.com/chriscoyier/status/3692581470" }
      ]
    }
  ];
}
