import { getGitHubSignals } from './github.js';
import { getArticleSignals } from './articles.js';

// Curated fallback sources used only when live signals are unavailable
const FALLBACK_GITHUB = [
  { type: 'github', name: "GitHub Issues discussions", url: "https://github.com/features/issues" },
  { type: 'github', name: "VSCode feature requests", url: "https://github.com/microsoft/vscode/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions" },
  { type: 'github', name: "Awesome developer tools", url: "https://github.com/topics/developer-tools" },
  { type: 'github', name: "CLI tools showcase", url: "https://github.com/topics/cli" },
  { type: 'github', name: "Developer productivity tools", url: "https://github.com/topics/productivity" }
];

const FALLBACK_ARTICLE = [
  { type: 'rss', name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" },
  { type: 'rss', name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" },
  { type: 'rss', name: "JavaScript Weekly archives", url: "https://javascriptweekly.com/issues" },
  { type: 'rss', name: "Web.dev articles", url: "https://web.dev/articles" }
];

const FALLBACK_X = [
  { type: 'x', name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
  { type: 'x', name: "Thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
  { type: 'x', name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" }
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function enrichSources(ideas, githubSignals, articleSignals) {
  const githubPool = githubSignals.length > 0
    ? githubSignals.map(s => ({ type: 'github', name: (s.text || s.name || 'GitHub issue').slice(0, 80), url: s.url }))
    : FALLBACK_GITHUB;

  const articlePool = articleSignals.length > 0
    ? articleSignals.map(s => ({ type: 'rss', name: s.name.slice(0, 80), url: s.url }))
    : FALLBACK_ARTICLE;

  return ideas.map(idea => {
    if (idea.sources && idea.sources.length >= 2) return idea;

    const sources = [];

    // 1-2 GitHub sources
    const numGithub = Math.random() > 0.5 ? 2 : 1;
    const usedGithub = new Set();
    for (let i = 0; i < numGithub && i < githubPool.length; i++) {
      let candidate;
      let tries = 0;
      do { candidate = pick(githubPool); tries++; } while (usedGithub.has(candidate.url) && tries < 10);
      usedGithub.add(candidate.url);
      sources.push(candidate);
    }

    // 1 X or article source
    if (Math.random() > 0.3) {
      sources.push(pick(FALLBACK_X));
    } else {
      sources.push(pick(articlePool));
    }

    // Optional second article source
    if (Math.random() > 0.5 && sources.length === 2) {
      sources.push(pick(articlePool));
    }

    return { ...idea, sources };
  });
}

function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
}

function supabaseHeaders(key) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };
}

// Generates ideas and stores them in Supabase. Idempotent: skips if today's quests exist.
export async function generateAndStore() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const today = getTodayET();

  // Check if we already generated today
  if (supabaseUrl && supabaseKey) {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${today}&select=id&limit=1`,
      { headers: supabaseHeaders(supabaseKey) }
    );
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.length > 0) {
        console.log('Quests already exist for today, skipping generation');
        const existingRes = await fetch(
          `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${today}&order=display_order.asc`,
          { headers: supabaseHeaders(supabaseKey) }
        );
        const rows = await existingRes.json();
        return rows.map(r => ({
          title: r.title,
          murmur: r.murmur,
          quest: r.quest,
          worth: r.worth,
          difficulty: r.difficulty,
          sources: r.sources
        }));
      }
    }
  }

  // Fetch live signals in parallel — failures are isolated and non-blocking
  console.log('Fetching live signals from GitHub and article feeds...');
  const [githubResult, articleResult] = await Promise.allSettled([
    getGitHubSignals(),
    getArticleSignals()
  ]);
  const githubSignals = githubResult.status === 'fulfilled' ? githubResult.value : [];
  const articleSignals = articleResult.status === 'fulfilled' ? articleResult.value : [];
  console.log(`Signals collected — GitHub: ${githubSignals.length}, Articles: ${articleSignals.length}`);

  // Generate fresh ideas using live signals as context
  let ideas = await generateIdeas(anthropicKey, githubSignals, articleSignals);
  ideas = enrichSources(ideas, githubSignals, articleSignals);

  // Store in Supabase
  if (supabaseUrl && supabaseKey) {
    const rows = ideas.map((idea, i) => ({
      title: idea.title,
      murmur: idea.murmur,
      quest: idea.quest,
      worth: idea.worth,
      difficulty: idea.difficulty,
      sources: idea.sources,
      quest_date: today,
      display_order: i
    }));

    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/daily_quests`,
      {
        method: 'POST',
        headers: { ...supabaseHeaders(supabaseKey), 'Prefer': 'return=minimal' },
        body: JSON.stringify(rows)
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error('Supabase insert failed:', err);
    } else {
      console.log(`Stored ${ideas.length} quests for ${today}`);
    }
  }

  return ideas;
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Anthropic API key not configured' })
    };
  }

  try {
    console.log('Generating and storing daily quests...');
    const ideas = await generateAndStore();
    const today = getTodayET();
    console.log('Successfully generated quests for:', today);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'New ideas generated successfully',
        date: today,
        ideas
      })
    };
  } catch (error) {
    console.error('Generation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate ideas', details: error.message })
    };
  }
};

async function generateIdeas(apiKey, githubSignals = [], articleSignals = []) {
  const systemPrompt = `You are an AI assistant that generates playful, vibe-coder-friendly side quest ideas for indie builders.

CRITICAL AUDIENCE NOTE — your audience is non-technical "vibe coders" who build with AI tools (Cursor, Claude Code, Replit, v0). They are creative, curious, and idea-driven — NOT experienced engineers. They can prompt their way to a working app but don't know what a proxy server or CI pipeline is. Think of them as artists with AI superpowers, not developers.

Generate exactly 5 project ideas with this distribution:
- 2 thoughtful indie hacker / solo builder prompts (40%)
- 1 early-stage product opportunity (20%)
- 2 creative experiments & playful tools (40%)

Each idea MUST be:
- Accessible to someone with zero coding background who builds by vibing with AI
- About making everyday HUMAN experiences more fun, visual, or delightful — NOT about developer workflows
- Conversational and playful in tone (think "What if my to-do list was a plant?" not "Build a CI/CD pipeline")
- Rooted in universal human experiences: habits, relationships, creativity, nostalgia, self-expression, daily routines, hobbies, emotions
- Concrete and buildable (weekend project scale)
- Specific enough to start immediately
- Inspiring without being intimidating
- Described WITHOUT any technical jargon — use plain language a non-coder would understand

HARD AVOID — these are TOO TECHNICAL for this audience (even if the signals mention them):
- Developer tools (linters, debuggers, CLI tools, git extensions, terminal utilities, code editors)
- Infrastructure (APIs, proxies, pipelines, cron jobs, deployment tools, servers)
- Anything that assumes knowledge of databases, servers, DevOps, or backend systems
- Jargon-heavy concepts (webhooks, middleware, containerization, environment variables, etc.)
- Tools primarily for programmers (package managers, testing frameworks, CI/CD, Docker)
- Anything where the primary user is a developer solving a developer problem

INSTEAD, focus on ideas in these spaces:
- Personal life (journaling, habits, self-care, mood tracking, memory keeping)
- Creative expression (art, music, writing, photography, design)
- Social & relationships (gifts, messaging, shared experiences, family)
- Fun & games (quizzes, challenges, collections, achievements)
- Everyday tools reimagined (cooking, fitness, reading, travel, budgeting)
- Whimsy & delight (playful interactions, surprise, humor, aesthetic experiences)

GOOD examples of the right vibe:
- "What If My To-Do List Was a Plant?" (fun metaphor, visual, anyone can relate)
- "Can My Bookshelf Judge My Reading Taste?" (personal, playful, universal)
- "What If My Morning Routine Had a Soundtrack?" (everyday experience + creativity)
- "Can I Turn My Grocery List Into a Recipe?" (practical + delightful)
- "What If My Mood Had a Color Palette?" (emotional, visual, personal)
- "Can My Walking Route Draw Art on a Map?" (physical world + digital creativity)

BAD examples (too technical — do NOT generate ideas like these):
- "What If My Terminal Had Undo?" (terminal = developer tool)
- "Can My .env File Be a Database?" (jargon, developer infrastructure)
- "What If Every PR Had a Live Preview?" (PRs are a developer concept)
- "Can I Track My API Spend in Real-Time?" (APIs, developer concern)

Format each idea as JSON with:
- title: A conversational question or observation (not a product pitch)
- murmur: Why this exists (2-3 sentences, casual tone, absolutely no jargon)
- quest: What to actually build (concrete, 2-3 sentences, described in plain language anyone can understand)
- worth: Array of 3 short reasons why it's worth building
- difficulty: "Easy", "Medium", or "Hard"
- sources: Empty array (will be filled with actual signals later)

Output ONLY valid JSON array, no markdown fences.`;

  // Build signal context from live data — reframe technical signals as human inspiration
  let signalContext = '';
  if (githubSignals.length > 0 || articleSignals.length > 0) {
    signalContext = '\n\nBelow are signals from the tech community today. IMPORTANT: Do NOT build developer tools based on these. Instead, extract the HUMAN frustration or desire underneath each signal and imagine a fun, non-technical project that addresses that same human need for a general audience:\n';

    if (githubSignals.length > 0) {
      signalContext += '\nPain points people are expressing (look for the human emotion, not the technical problem):\n';
      githubSignals.slice(0, 5).forEach(s => {
        signalContext += `- "${s.text}"\n`;
      });
    }

    if (articleSignals.length > 0) {
      signalContext += '\nTopics people are curious about today:\n';
      articleSignals.slice(0, 6).forEach(s => {
        signalContext += `- "${s.name}" (${s.source})\n`;
      });
    }

    signalContext += '\nRemember: translate these into everyday, non-technical project ideas that anyone could relate to. A signal about "missing database feature" should inspire something like "What if my recipe collection organized itself?" — NOT a database tool.\n';
  }

  const userPrompt = `Generate 5 diverse side quest ideas for creative builders right now. Make them feel fresh, playful, and immediately buildable. Focus on everyday human experiences — NOT developer tools.${signalContext}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: systemPrompt + "\n\n" + userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  const cleanedContent = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return JSON.parse(cleanedContent);
}
