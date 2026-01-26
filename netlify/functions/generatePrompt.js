export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const { title, murmur, quest, worth, difficulty } = JSON.parse(event.body);

    const difficultyGuidance = {
      'Easy': {
        tone: 'beginner-friendly and encouraging',
        detail: 'step-by-step with clear explanations',
        assumptions: 'Assume minimal experience. Explain concepts as you go.'
      },
      'Medium': {
        tone: 'balanced and practical',
        detail: 'structured but not hand-holdy',
        assumptions: 'Assume basic development knowledge but explain architecture choices.'
      },
      'Hard': {
        tone: 'technical and architectural',
        detail: 'focus on system design and best practices',
        assumptions: 'Assume solid development experience. Focus on tradeoffs and scalability.'
      }
    };

    const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];

    const systemPrompt = `You're a creative technical mentor helping indie builders and vibe coders bring playful projects to life.

Tone: ${guidance.tone}
Detail level: ${guidance.detail}
Assumptions: ${guidance.assumptions}

Keep it practical, buildable, and fun. This should feel like a friend helping you ship something cool.`;

    const userPrompt = `Create a detailed build prompt for this project idea:

**Title:** ${title}
**Why it exists:** ${murmur}
**What to build:** ${quest}
**Why it's worth it:** ${worth.join(', ')}
**Difficulty:** ${difficulty}

Generate a comprehensive prompt that someone can copy/paste into Claude, ChatGPT, or another AI to help them build this. Include:

1. **The Concept** - Brief overview (2-3 sentences)
2. **What You're Building** - Core features (3-5 bullet points)
3. **User Flow** - Step-by-step how someone uses it (3-4 steps)
4. **Tech Stack Suggestions** - Give 2-3 specific options for:
   - Frontend (if needed)
   - Backend (if needed)
   - APIs/Tools
   - Include a note that they can swap these for their preferred stack
5. **Implementation Steps** - ${difficulty === 'Easy' ? '5-7 clear steps' : difficulty === 'Medium' ? '4-6 structured steps' : '3-5 architectural steps'}
6. **Starter Code Snippets** - ${difficulty === 'Easy' ? 'Include 2-3 helpful code examples' : difficulty === 'Medium' ? 'Include 1-2 key code patterns' : 'Include 1 architectural example'}
7. **Bonus Ideas** - 2-3 ways to extend it
8. **Tips** - ${difficulty === 'Easy' ? 'Encouraging advice for beginners' : difficulty === 'Medium' ? 'Practical shipping advice' : 'Architectural considerations'}

Format as clean markdown that's ready to copy/paste.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
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
    const prompt = data.choices?.[0]?.message?.content || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    };

  } catch (error) {
    console.error('Prompt generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate prompt',
        details: error.message 
      })
    };
  }
};
