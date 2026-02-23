const FALLBACK_ARCHIVE = {
  "2026-01-23": [
    {
      title: "What If My To-Do List Was a Plant?",
      murmur: "To-do apps are stressful and guilt-inducing. What if instead of checking boxes, you were watering a plant that grows with each completed task?",
      quest: "Build a to-do app where each task is a seed. Complete it and the plant grows. Skip tasks and it wilts. Watch your productivity garden flourish over time.",
      worth: [
        "Makes productivity feel nurturing, not punishing",
        "Your task list becomes something beautiful",
        "Way more motivating than checkboxes"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Discussion on productivity tools", url: "https://x.com/search?q=productivity%20app%20ideas&f=live" },
        { type: "rss", name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" }
      ]
    },
    {
      title: "Can My Bookshelf Judge My Reading Taste?",
      murmur: "You've read dozens of books but never stepped back to see the patterns. Are you a secret sci-fi nerd? A self-help addict? Your bookshelf knows.",
      quest: "Build an app where you snap a photo of your bookshelf (or type in titles) and it roasts your reading taste, finds patterns, and suggests what's missing from your collection.",
      worth: [
        "Finally understand your reading personality",
        "The roasts are extremely shareable",
        "Great way to discover your next favorite book"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "Thread on reading habits", url: "https://x.com/search?q=reading%20habits&f=live" },
        { type: "rss", name: "Dev.to community discussions", url: "https://dev.to" }
      ]
    },
    {
      title: "What If My Morning Routine Had a Soundtrack?",
      murmur: "Your morning is a series of rituals — coffee, shower, commute — but it feels like autopilot. What if each step had its own perfectly timed music?",
      quest: "Build an app that lets you map your morning routine steps to songs. It auto-plays the right track when it's time to move to the next thing. Your morning becomes a movie montage.",
      worth: [
        "Turns boring mornings into something cinematic",
        "Actually helps you stay on schedule",
        "Everyone's playlist would be hilariously different"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Conversation on morning routines", url: "https://x.com/search?q=morning%20routine%20ideas&f=live" },
        { type: "rss", name: "Web.dev articles", url: "https://web.dev/articles" }
      ]
    },
    {
      title: "Can I Turn My Grocery List Into a Recipe?",
      murmur: "You buy random stuff at the store and then stare at the fridge wondering what to make. What if your grocery list could think for you?",
      quest: "Build an app where you type in what you bought (or scan a receipt) and it suggests recipes you can actually make right now. Bonus: it tells you what one extra ingredient would unlock.",
      worth: [
        "No more wasted groceries",
        "Cooking becomes an adventure, not a chore",
        "The 'one more ingredient' feature is addictive"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Recipe app discussions", url: "https://github.com/topics/recipe" },
        { type: "x", name: "Discussion on cooking hacks", url: "https://x.com/search?q=cooking%20hacks&f=live" }
      ]
    },
    {
      title: "What If My Mood Had a Color Palette?",
      murmur: "You feel things deeply but 'how are you?' gets a shrug. What if you could express your emotional state as colors instead of words?",
      quest: "Build a daily mood tracker where instead of picking 'happy' or 'sad', you pick colors that feel right. Over time it generates a beautiful mosaic of your emotional year.",
      worth: [
        "Way more expressive than emoji mood trackers",
        "The yearly mosaic is frame-worthy",
        "Helps you notice emotional patterns you'd otherwise miss"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Thread on mental health apps", url: "https://x.com/search?q=mood%20tracking%20app&f=live" },
        { type: "rss", name: "Smashing Magazine", url: "https://www.smashingmagazine.com" }
      ]
    }
  ],
  "2026-01-24": [
    {
      title: "Can My Walking Route Draw Art on a Map?",
      murmur: "You walk the same routes every day and never think about the shape you're tracing on the map. What if you could turn your walks into drawings?",
      quest: "Build an app that tracks your walking route and shows you the shape it makes on a map. Challenge yourself to walk routes that spell words or draw pictures. Share your GPS art.",
      worth: [
        "Turns a daily walk into a creative challenge",
        "The results are genuinely impressive to share",
        "Makes exercise feel like art"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "Discussion on fitness creativity", url: "https://x.com/search?q=GPS%20art%20running&f=live" },
        { type: "rss", name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" }
      ]
    },
    {
      title: "What If My Spotify Wrapped Was for My Cooking?",
      murmur: "Spotify Wrapped makes music feel like an achievement. But you cook every day too — where's your year-end cooking recap?",
      quest: "Build an app that tracks what you cook throughout the year and generates a beautiful year-end recap: most-made dish, adventurous month, comfort food ratio, cuisine passport.",
      worth: [
        "Makes everyday cooking feel celebrated",
        "The year-end reveal is extremely shareable",
        "You'll actually remember what you ate this year"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "Thread on Spotify Wrapped ideas", url: "https://x.com/search?q=spotify%20wrapped%20for&f=live" },
        { type: "rss", name: "Dev.to community", url: "https://dev.to" }
      ]
    },
    {
      title: "Can My Photos Tell Me Where I Was Happiest?",
      murmur: "Your camera roll is thousands of photos but you never zoom out to see the big picture. Where do you smile most? What places light you up?",
      quest: "Build an app that maps your photos by location and uses the expressions in your selfies to create a happiness heatmap. See which places, people, and activities make you glow.",
      worth: [
        "Discover your happy places with actual data",
        "Beautiful visualization of your life",
        "Might change where you spend your weekends"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Photo analysis projects", url: "https://github.com/topics/photo-analysis" },
        { type: "x", name: "Discussion on photo memories", url: "https://x.com/search?q=photo%20memories%20app&f=live" }
      ]
    },
    {
      title: "What If My Journal Talked Back?",
      murmur: "Journaling is powerful but lonely. You write your thoughts into a void and never get a response. What if your journal could reflect things back to you?",
      quest: "Build a journaling app that reads your entries and gently surfaces patterns: 'You mention your sister a lot when you're stressed' or 'Tuesdays seem to be your best days.' Not advice — just mirrors.",
      worth: [
        "Like having a therapist who just listens",
        "Surfaces patterns you'd never notice yourself",
        "Makes journaling feel like a conversation"
      ],
      difficulty: "Medium",
      sources: [
        { type: "x", name: "Conversation on journaling", url: "https://x.com/search?q=journaling%20app%20ideas&f=live" },
        { type: "rss", name: "Smashing Magazine", url: "https://www.smashingmagazine.com" }
      ]
    },
    {
      title: "Can My 404 Page Be a Game?",
      murmur: "404 pages are wasted opportunities. Users hit them, shrug, and leave. What if they stayed to play instead?",
      quest: "Build a simple, addictive browser game that lives on your website's error page. High scores save locally, and broken links become fun detours instead of dead ends.",
      worth: [
        "Turns frustration into delight",
        "People will break links on purpose to play",
        "Great conversation starter for your website"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Discussion on web experiences", url: "https://x.com/search?q=creative%20web%20design&f=live" },
        { type: "rss", name: "Smashing Magazine", url: "https://www.smashingmagazine.com" }
      ]
    }
  ]
};

function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function mapRow(r) {
  return {
    title: r.title,
    murmur: r.murmur,
    quest: r.quest,
    worth: r.worth,
    difficulty: r.difficulty,
    sources: r.sources
  };
}

async function getFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const today = getTodayET();
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  // Read from both tables: quest_archive (legacy Jan 23-29) and daily_quests (Jan 30+)
  const [archiveRes, dailyRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/quest_archive?order=quest_date.desc,display_order.asc`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/daily_quests?quest_date=neq.${today}&order=quest_date.desc,display_order.asc`, { headers })
  ]);

  const archiveRows = archiveRes.ok ? await archiveRes.json() : [];
  const dailyRows = dailyRes.ok ? await dailyRes.json() : [];

  if (!archiveRows.length && !dailyRows.length) return null;

  // Group quest_archive rows first
  const grouped = {};
  for (const r of archiveRows) {
    const date = r.quest_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(mapRow(r));
  }

  // Group daily_quests rows — daily_quests takes precedence for any overlapping date
  const dailyGrouped = {};
  for (const r of dailyRows) {
    const date = r.quest_date;
    if (!dailyGrouped[date]) dailyGrouped[date] = [];
    dailyGrouped[date].push(mapRow(r));
  }

  const merged = { ...grouped, ...dailyGrouped };
  return Object.keys(merged).length ? merged : null;
}

export const handler = async (event) => {
  try {
    // Try Supabase first
    const supabaseArchive = await getFromSupabase();
    if (supabaseArchive) {
      console.log('Serving archive from Supabase');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(supabaseArchive)
      };
    }

    // Fallback to hardcoded archive
    console.log('Serving archive from fallback');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(FALLBACK_ARCHIVE)
    };
  } catch (error) {
    console.error('Archive error:', error);
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
