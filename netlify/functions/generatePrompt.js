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

    const promptText = `Generate a detailed build prompt in markdown. Output ONLY markdown - no preamble, no postamble.

Use FIRST PERSON language (I, my, me) throughout.

Project: ${title}
Context: ${murmur}
Goal: ${quest}
Value: ${worthList}
Level: ${difficulty}

Structure (complete all sections):

## The Concept
2-3 sentences in first person about what I'm building.

## What I'm Building
3-5 core features as bullets.

## User Flow
3-4 steps of how someone uses this.

## Tech Stack Suggestions
2-3 specific options (swappable).

## Implementation Steps
${guidance.steps} in ${guidance.tone} tone.

## Starter Code Snippets
${guidance.code}.

## Bonus Ideas
2-3 extension ideas.

## Tips
${guidance.tone} advice for ${difficulty} level.

Output the COMPLETE guide with ALL sections. Start with "## The Concept"`;

    console.log('Calling Gemini API...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    // Add timeout to the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second server timeout

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
            maxOutputTokens: 8192,  // High limit to prevent cutoffs
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
        
        // Parse error to check for rate limits
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.code === 429) {
            return {
              statusCode: 429,
              headers,
              body: JSON.stringify({ 
                error: 'Rate limit exceeded',
                details: 'The AI service is temporarily at capacity. Please wait a minute and try again.'
              })
            };
          }
        } catch (e) {
          // If parsing fails, continue with original error
        }
        
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
      let generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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

      // Clean up markdown fences
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
        console.error('Request timeout');
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({ 
            error: 'Request timeout',
            details: 'The AI took too long to respond. Please try again.'
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
