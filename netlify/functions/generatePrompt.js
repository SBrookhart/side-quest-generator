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
        steps: '5-7 beginner-friendly steps',
        code: '2-3 code examples',
        tone: 'encouraging and supportive'
      },
      'Medium': {
        steps: '4-6 practical steps',
        code: '1-2 code patterns',
        tone: 'focused on shipping'
      },
      'Hard': {
        steps: '3-5 architectural steps',
        code: '1 system design example',
        tone: 'technical and in-depth'
      }
    };

    const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];
    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    // Simplified, clearer prompt to reduce token usage and prevent cutoffs
    const promptText = `Generate a build guide in markdown. Output ONLY markdown - no intro text.

Use first person (I, my, me).

Project: ${title}
Why: ${murmur}
What: ${quest}
Worth: ${worthList}
Level: ${difficulty}

Include these sections:

## The Concept
2 sentences on what I'm building

## What I'm Building
3-5 features as bullets

## User Flow
3-4 usage steps

## Tech Stack
2-3 technology options

## Implementation Steps
${guidance.steps}

## Code Snippets
${guidance.code}

## Bonus Ideas
2-3 extensions

## Tips
${guidance.tone} advice

Start with "## The Concept"`;

    console.log('Calling Gemini API...');

    // Use the model we KNOW works from earlier
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,  // Balanced limit
            candidateCount: 1
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.code === 429) {
            return {
              statusCode: 429,
              headers,
              body: JSON.stringify({ 
                error: 'Rate limit exceeded',
                details: 'Please wait a minute and try again.'
              })
            };
          }
        } catch (e) {}
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: `Gemini API error: ${response.status}`,
            details: errorText.substring(0, 200)
          })
        };
      }

      const data = await response.json();
      let generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedPrompt) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'No prompt in response'
          })
        };
      }

      generatedPrompt = generatedPrompt
        .replace(/^```markdown\n/i, '')
        .replace(/^```\n/i, '')
        .replace(/\n```$/i, '')
        .trim();

      console.log('Prompt generated successfully, length:', generatedPrompt.length);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prompt: generatedPrompt })
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({ 
            error: 'Request timeout',
            details: 'Please try again.'
          })
        };
      }
      throw fetchError;
    }

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
