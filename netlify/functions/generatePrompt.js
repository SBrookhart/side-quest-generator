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
      body: JSON.stringify({ 
        error: 'GEMINI_API_KEY not configured'
      })
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

    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    const promptText = `You're a creative technical mentor helping indie builders bring playful projects to life.

Create a detailed build prompt for this project:

**Title:** ${title}
**Why it exists:** ${murmur}
**What to build:** ${quest}
**Why it's worth it:** ${worthList}
**Difficulty:** ${difficulty}

Generate a prompt someone can copy/paste into Claude, ChatGPT, or another AI. Include:

1. **The Concept** (2-3 sentences)
2. **Core Features** (3-5 bullets)
3. **User Flow** (3-4 steps)
4. **Tech Stack** (2-3 options with note they can swap)
5. **Implementation Steps** (${difficulty === 'Easy' ? '5-7' : difficulty === 'Medium' ? '4-6' : '3-5'} steps)
6. **Code Snippets** (${difficulty === 'Easy' ? '2-3 examples' : difficulty === 'Medium' ? '1-2 patterns' : '1 architectural example'})
7. **Bonus Ideas** (2-3 extensions)
8. **Tips** (${difficulty === 'Easy' ? 'beginner advice' : difficulty === 'Medium' ? 'shipping advice' : 'architecture considerations'})

Format as markdown.`;

    // Try different Gemini API endpoints
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        console.log(`${model} response status:`, response.status);

        if (response.ok) {
          const data = await response.json();
          const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          if (generatedPrompt) {
            console.log(`Success with ${model}`);
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ prompt: generatedPrompt })
            };
          }
        } else {
          const errorText = await response.text();
          lastError = `${model}: ${response.status} - ${errorText}`;
          console.error(lastError);
        }
      } catch (err) {
        lastError = `${model}: ${err.message}`;
        console.error(lastError);
      }
    }

    // If all models failed
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'All Gemini models failed',
        details: lastError || 'Unknown error'
      })
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
