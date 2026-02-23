import { findDuplicateQuestIndexes, normalizeQuestsForDate, normalizeTitleKey } from './lib/questTone.js';

// One-time backfill helper: generates quests for a single date and stores in daily_quests.
// Called once per date — use the terminal loop in the README to process all missing dates.
// Usage: GET /.netlify/functions/backfill?date=2026-01-30


function supabaseHeaders(key) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };
}

async function getExistingQuestTitles(supabaseUrl, supabaseKey) {
  const headers = supabaseHeaders(supabaseKey);
  const [dailyRes, archiveRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/daily_quests?select=title`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/quest_archive?select=title`, { headers })
  ]);

  const dailyRows = dailyRes.ok ? await dailyRes.json() : [];
  const archiveRows = archiveRes.ok ? await archiveRes.json() : [];

  return [...dailyRows, ...archiveRows]
    .map((row) => row.title)
    .filter(Boolean);
}

async function regenerateDuplicateIdeas({ apiKey, ideas, existingTitles, date }) {
  const updated = [...ideas];
  const existingKeys = new Set(existingTitles.map(normalizeTitleKey).filter(Boolean));

  while (true) {
    const duplicateIndexes = findDuplicateQuestIndexes(updated, [...existingKeys]);
    if (!duplicateIndexes.length) return updated;

    for (const index of duplicateIndexes) {
      let replacement = null;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const blockedTitleKeys = [
          ...existingKeys,
          ...updated.map((item) => normalizeTitleKey(item.title)).filter(Boolean)
        ];

        const generated = await generateIdeas(apiKey, 1, blockedTitleKeys);
        const candidate = normalizeQuestsForDate(generated, date)[0];
        const candidateKey = normalizeTitleKey(candidate?.title);

        if (candidate && candidateKey && !existingKeys.has(candidateKey)) {
          replacement = candidate;
          existingKeys.add(candidateKey);
          break;
        }
      }

      if (!replacement) {
        throw new Error('Failed to regenerate a non-duplicate quest after multiple attempts');
      }

      updated[index] = replacement;
    }
  }
}

function enrichSources(ideas) {
  const githubSources = [
    { name: "GitHub Issues discussions", url: "https://github.com/features/issues" },
    { name: "VSCode feature requests", url: "https://github.com/microsoft/vscode/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions" },
    { name: "Awesome developer tools", url: "https://github.com/topics/developer-tools" },
    { name: "CLI tools showcase", url: "https://github.com/topics/cli" },
    { name: "Developer productivity tools", url: "https://github.com/topics/productivity" },
    { name: "Awesome lists collection", url: "https://github.com/sindresorhus/awesome" }
  ];
  const xSources = [
    { name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
    { name: "Thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
    { name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" },
    { name: "Thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
    { name: "Conversation on CLI tools", url: "https://x.com/search?q=CLI%20tool%20ideas&f=live" }
  ];
  const rssSources = [
    { name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" },
    { name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" },
    { name: "Indie Hackers - Product ideas", url: "https://www.indiehackers.com/products" },
    { name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" },
    { name: "Web.dev articles", url: "https://web.dev/articles" }
  ];

  return ideas.map(idea => {
    if (idea.sources && idea.sources.length >= 2) return idea;
    const newSources = [];
    const numGithub = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numGithub; i++) {
      newSources.push({ type: 'github', ...githubSources[Math.floor(Math.random() * githubSources.length)] });
    }
    if (Math.random() > 0.3) {
      newSources.push({ type: 'x', ...xSources[Math.floor(Math.random() * xSources.length)] });
    } else {
      newSources.push({ type: 'rss', ...rssSources[Math.floor(Math.random() * rssSources.length)] });
    }
    if (Math.random() > 0.5 && newSources.length === 2) {
      newSources.push({ type: 'rss', ...rssSources[Math.floor(Math.random() * rssSources.length)] });
    }
    return { ...idea, sources: newSources };
  });
}

async function generateIdeas(apiKey, ideaCount = 5, blockedTitleKeys = []) {
  const prompt = `You are an AI assistant that generates playful, vibe-coder-friendly side quest ideas for indie builders.

IMPORTANT — your audience is non-technical "vibe coders" who build with AI tools (Cursor, Claude Code, Replit, v0). They are creative, curious, and idea-driven — NOT experienced engineers. They can prompt their way to a working app but don't know what a proxy server or CI pipeline is.

Generate exactly ${ideaCount} project ideas with this distribution (approximate if count < 5):
- 2 thoughtful indie hacker / solo builder prompts (40%)
- 1 early-stage product opportunity (20%)
- 2 creative experiments & playful tools (40%)

Each idea MUST be:
- Accessible to someone with zero coding background who builds by vibing with AI
- Practical first: solves a real, everyday friction people actually face
- Slightly technical is okay, but keep it understandable for non-technical builders
- About making everyday experiences more fun, visual, or human — NOT developer infrastructure
- Conversational and playful in tone
- Concrete and buildable (weekend project scale)
- Specific enough to start immediately
- Inspiring without being intimidating

AVOID these — they are too technical for this audience:
- Developer tools (linters, debuggers, CLI tools, git extensions, terminal utilities)
- Infrastructure (APIs, proxies, pipelines, cron jobs, deployment tools)
- Anything that assumes knowledge of databases, servers, or DevOps
- Jargon-heavy concepts (webhooks, middleware, containerization, etc.)

GOOD examples of the right vibe:
- "What If My To-Do List Was a Plant?" (fun metaphor, visual, anyone can relate)
- "Can My 404 Page Be a Game?" (creative, playful, delightful)
- "What If My Code Commits Were a Tamagotchi?" (whimsical, uses everyday metaphor)
- "Can My Spotify Wrapped Be for My Code?" (riffs on something everyone knows)

Format each idea as JSON with:
- title: A conversational question or observation (not a product pitch)
- murmur: Why this exists (2-3 sentences, casual tone, no jargon)
- quest: What to actually build (concrete, 2-3 sentences, described simply)
- worth: Array of 3 short reasons why it's worth building
- difficulty: "Easy", "Medium", or "Hard"
- sources: Empty array

Output ONLY valid JSON array, no markdown fences.

Generate ${ideaCount} diverse side quest idea${ideaCount === 1 ? '' : 's'} for indie builders. Make them feel fresh, playful, and immediately buildable.

Do NOT reuse or closely paraphrase any of these existing title keys:
${blockedTitleKeys.length ? blockedTitleKeys.slice(0, 200).map((title) => `- ${title}`).join('\n') : '- (none provided)'}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

export const handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const adminSecret = process.env.ADMIN_SECRET;

  const secret = event.queryStringParameters?.secret;
  if (adminSecret && secret !== adminSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const date = event.queryStringParameters?.date;
  const force = event.queryStringParameters?.force === 'true';
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid ?date=YYYY-MM-DD param' }) };
  }

  // Check if already exists
  const checkRes = await fetch(
    `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${date}&select=id&limit=1`,
    { headers: supabaseHeaders(supabaseKey) }
  );
  const existing = await checkRes.json();
  if (existing.length > 0 && !force) {
    return { statusCode: 200, body: JSON.stringify({ status: 'skipped', date, reason: 'already exists (use ?force=true to overwrite)' }) };
  }

  // Delete existing quests for this date if forcing regeneration
  if (existing.length > 0 && force) {
    const deleteRes = await fetch(
      `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${date}`,
      {
        method: 'DELETE',
        headers: supabaseHeaders(supabaseKey)
      }
    );
    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: `Failed to delete existing quests: ${err}`, date }) };
    }
    console.log(`Deleted existing quests for ${date} (force regeneration)`);
  }

  // Generate quests
  let ideas;
  try {
    ideas = await generateIdeas(anthropicKey);
    ideas = normalizeQuestsForDate(ideas, date);
    const existingTitles = await getExistingQuestTitles(supabaseUrl, supabaseKey);
    ideas = await regenerateDuplicateIdeas({ apiKey: anthropicKey, ideas, existingTitles, date });
    ideas = enrichSources(ideas);
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message, date }) };
  }

  const rows = ideas.map((idea, i) => ({
    title: idea.title,
    murmur: idea.murmur,
    quest: idea.quest,
    worth: idea.worth,
    difficulty: idea.difficulty,
    sources: idea.sources,
    quest_date: date,
    display_order: i
  }));

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/daily_quests`, {
    method: 'POST',
    headers: { ...supabaseHeaders(supabaseKey), 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows)
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    return { statusCode: 500, body: JSON.stringify({ error: err, date }) };
  }

  return { statusCode: 200, body: JSON.stringify({ status: 'done', date, quests: ideas.length }) };
};
