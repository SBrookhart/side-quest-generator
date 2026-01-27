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

    const promptText = `Generate a detailed build prompt in markdown. Output ONLY markdown - no preamble, no postamble, no conversational intro.

Use FIRST PERSON language (I, my, me) throughout.

Project: ${title}
Context: ${murmur}
Goal: ${quest}
Value: ${worthList}
Level: ${difficulty}

Create a complete guide with these exact sections:

## The Concept
Write 2-3 sentences in first person about what I'm building.

## What I'm Building
List 3-5 core features as bullet points.

## User Flow
Describe 3-4 steps of how someone uses this.

## Tech Stack Suggestions
List 2-3 specific technology options I can use (note these are swappable).

## Implementation Steps
Write ${guidance.steps} in ${guidance.tone} tone.

## Starter Code Snippets
Include ${guidance.code}.

## Bonus Ideas
List 2-3 ways to extend this project.

## Tips
Write ${guidance.tone} advice specific to ${difficulty} level projects.

CRITICAL: Output the COMPLETE guide. Do not truncate or summarize. Include all sections with full detail.

Start directly with "## The Concept" - NO introduction text.`;

    console.log('Calling Gemini API...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;

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
            maxOutputTokens: 8192,  // Increased significantly to prevent cutoffs
            candidateCount: 1,
            stopSequences: []  // No stop sequences that could truncate
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
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
