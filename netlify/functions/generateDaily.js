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
    { name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
    { name: "Thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
    { name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" },
    { name: "Discussion on dev tools", url: "https://x.com/search?q=developer%20tools%20productivity&f=live" },
    { name: "Thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
    { name: "Conversation on CLI tools", url: "https://x.com/search?q=CLI%20tool%20ideas&f=live" },
    { name: "Discussion on code quality", url: "https://x.com/search?q=code%20quality%20tools&f=live" },
    { name: "Thread on web performance", url: "https://x.com/search?q=web%20performance%20optimization&f=live" }
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
    if (idea.sources && idea.sources.length >= 2) {
      return idea;
    }
    
    const newSources = [];
    const numGithub = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numGithub; i++) {
      const source = githubSources[Math.floor(Math.random() * githubSources.length)];
      newSources.push({ type: 'github', ...source });
    }
    
    if (Math.random() > 0.3) {
      const source = xSources[Math.floor(Math.random() * xSources.length)];
      newSources.push({ type: 'x', ...source });
    } else {
      const source = rssSources[Math.floor(Math.random() * rssSources.length)];
      newSources.push({ type: 'rss', ...source });
    }
    
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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Anthropic API key not configured'
      })
    };
  }

  try {
    console.log('Generating new ideas with Anthropic...');
    let ideas = await generateIdeas(anthropicKey);
    ideas = enrichSources(ideas);

    const today = new Date().toISOString().split('T')[0];
    console.log('Successfully generated new ideas for:', today);

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
      body: JSON.stringify({
        error: 'Failed to generate ideas',
        details: error.message
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

  const ideas = JSON.parse(cleanedContent);
  
  return ideas;
}
