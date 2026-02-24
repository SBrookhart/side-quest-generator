import { getGitHubSignals } from './github.js';
import { getArticleSignals } from './articles.js';
import { normalizeIdeas } from './normalize.js';
import { buildSystemPrompt } from './questPrompt.js';

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

// Fetch recent quest titles from both tables to avoid generating duplicates.
async function getRecentTitles(supabaseUrl, supabaseKey, days = 7) {
  if (!supabaseUrl || !supabaseKey) return [];
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toISOString().split('T')[0];

    const [dailyRes, archiveRes] = await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/daily_quests?quest_date=gte.${cutoffDate}&select=title`, { headers: supabaseHeaders(supabaseKey) }),
      fetch(`${supabaseUrl}/rest/v1/quest_archive?quest_date=gte.${cutoffDate}&select=title`, { headers: supabaseHeaders(supabaseKey) }),
    ]);

    const titles = [];
    for (const result of [dailyRes, archiveRes]) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const rows = await result.value.json();
        titles.push(...rows.map(r => r.title));
      }
    }
    return titles;
  } catch {
    return [];
  }
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

  // Fetch live signals and recent titles in parallel
  console.log('Fetching live signals and recent quest titles...');
  const [githubResult, articleResult, recentTitles] = await Promise.all([
    getGitHubSignals().catch(() => []),
    getArticleSignals().catch(() => []),
    getRecentTitles(supabaseUrl, supabaseKey),
  ]);
  const githubSignals = githubResult || [];
  const articleSignals = articleResult || [];
  console.log(`Signals collected — GitHub: ${githubSignals.length}, Articles: ${articleSignals.length}, Recent titles to avoid: ${recentTitles.length}`);

  // Generate fresh ideas using live signals as context
  let ideas = await generateIdeas(anthropicKey, githubSignals, articleSignals, recentTitles);

  // Rewrite any remaining jargon + enforce difficulty cap
  ideas = normalizeIdeas(ideas);

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

async function generateIdeas(apiKey, githubSignals = [], articleSignals = [], recentTitles = []) {
  const systemPrompt = buildSystemPrompt({ recentTitles });

  // Build signal context from live data
  let signalContext = '';
  if (githubSignals.length > 0 || articleSignals.length > 0) {
    signalContext = '\n\nHere are real signals from the developer community today. Use them as creative inspiration — riff on the underlying pain points, don\'t copy directly:\n';

    if (githubSignals.length > 0) {
      signalContext += '\nGitHub developer pain points (real open issues):\n';
      githubSignals.slice(0, 5).forEach(s => {
        signalContext += `- "${s.text}"\n`;
      });
    }

    if (articleSignals.length > 0) {
      signalContext += '\nWhat developers are reading today:\n';
      articleSignals.slice(0, 6).forEach(s => {
        signalContext += `- "${s.name}" (${s.source})\n`;
      });
    }
  }

  const userPrompt = `Generate 5 diverse side quest ideas for indie builders right now. Make them feel fresh, playful, and immediately buildable.${signalContext}`;

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
