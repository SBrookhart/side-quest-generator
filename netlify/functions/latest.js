
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
