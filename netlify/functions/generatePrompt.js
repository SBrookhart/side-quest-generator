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

    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    const promptText = `You're a creative technical mentor helping indie builders bring playful projects to life.

Create a detailed build prompt for this project:

Title: ${title}
Why it exists: ${murmur}
What to build: ${quest}
Why it's worth it: ${worthList}
Difficulty: ${difficulty}

Generate a comprehensive prompt that someone can copy/paste into Claude, ChatGPT, or another AI to help them build this. Include:

1. The Concept (2-3 sentences)
2. Core Features (3-5 bullet points)
3. User Flow (3-4 steps)
4. Tech Stack Suggestions (2-3 specific options with note they can swap)
5. Implementation Steps (${difficulty === 'Easy' ? '5-7' : difficulty === 'Medium' ? '4-6' : '3-5'} steps)
6. Starter Code Snippets (${difficulty === 'Easy' ? '2-3 examples' : difficulty === 'Medium' ? '1-2 patterns' : '1 architectural example'})
7. Bonus Ideas (2-3 ways to extend it)
8. Tips (${difficulty === 'Easy' ? 'encouraging advice for beginners' : difficulty === 'Medium' ? 'practical shipping advice' : 'architectural considerations'})

Format as clean markdown that's ready to copy/paste.`;

    console.log('Calling Gemini API with gemini-pro...');

    // Use gemini-pro (stable, widely available model)
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
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
