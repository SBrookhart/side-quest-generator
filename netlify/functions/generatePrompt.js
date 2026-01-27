export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { title, murmur, quest, worth, difficulty } = body;

    if (!title || !murmur || !quest || !difficulty) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const difficultyGuidance = {
      'Easy': {
        tone: 'beginner-friendly and encouraging',
        detail: 'step-by-step with clear explanations',
        steps: '5-7 clear steps',
        code: 'Include 2-3 helpful code examples'
      },
      'Medium': {
        tone: 'balanced and practical',
        detail: 'structured but not hand-holdy',
        steps: '4-6 structured steps',
        code: 'Include 1-2 key code patterns'
      },
      'Hard': {
        tone: 'technical and architectural',
        detail: 'focus on system design and best practices',
        steps: '3-5 architectural steps',
        code: 'Include 1 architectural example'
      }
    };

    const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];
    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    const systemPrompt = `You're a creative technical mentor helping indie builders and vibe coders bring playful projects to life.

Tone: ${guidance.tone}
Detail level: ${guidance.detail}

Keep it practical, buildable, and fun. This should feel like a friend helping you ship something cool.`;

    const userPrompt = `Create a detailed build prompt for this project idea:

**Title:** ${title}
**Why it exists:** ${murmur}
**What to build:** ${quest}
**Why it's worth it:** ${worthList}
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
5. **Implementation Steps** - ${guidance.steps}
6. **Starter Code Snippets** - ${guidance.code}
7. **Bonus Ideas** - 2-3 ways to extend it
8. **Tips** - ${difficulty === 'Easy' ? 'Encouraging advice for beginners' : difficulty === 'Medium' ? 'Practical shipping advice' : 'Architectural considerations'}

Format as clean markdown that's ready to copy/paste.`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    console.log('Calling Gemini API with gemini-2.5-flash...');

    // Use gemini-2.5-flash - confirmed available in your API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: `Gemini API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedPrompt) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No prompt in response',
          details: JSON.stringify(data)
        })
      };
    }

    console.log('Success! Prompt generated.');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ prompt: generatedPrompt })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate prompt',
        details: error.message
      })
    };
  }
};
