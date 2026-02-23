
function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

async function getFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const today = getTodayET();
  const res = await fetch(
    `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${today}&order=display_order.asc`,
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

  return rows.map(r => ({
    title: r.title,
    murmur: r.murmur,
    quest: r.quest,
    worth: r.worth,
    difficulty: r.difficulty,
    sources: r.sources
  }));
}

export const handler = async (event) => {
  try {
    // Always try Supabase first — this is the only source of generated quests
    const supabaseIdeas = await getFromSupabase();
    if (supabaseIdeas) {
      console.log('Serving from Supabase');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        },
        body: JSON.stringify(supabaseIdeas)
      };
    }

    // Supabase unavailable or no quests yet today — serve stable static fallback.
    // Generation only happens via the scheduled function; never on demand here,
    // because on-demand generation at temperature 0.8 produces different ideas
    // on every request, making quests unstable across hard refreshes.
    console.log('Using fallback ideas');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(getFallbackIdeas())
    };

  } catch (error) {
    console.error('Latest endpoint error:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(getFallbackIdeas())
    };
  }
};

async function generateIdeas(apiKey) {
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

  const userPrompt = `Generate 5 diverse side quest ideas for indie builders right now. Make them feel fresh, playful, and immediately buildable.`;

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

function getFallbackIdeas() {
  return [
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
      sources: []
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
      sources: []
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
      sources: []
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
      sources: []
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
      sources: []
    }
  ];
}
