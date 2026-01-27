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

    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    // Simplified prompt that generates ONLY markdown, no preamble
    const promptText = `Generate a detailed build prompt in markdown format. Output ONLY the markdown - no introduction, no preamble, no postamble. Start directly with the markdown content.

Project: ${title}
Why it exists: ${murmur}
What to build: ${quest}
Why it's worth it: ${worthList}
Difficulty: ${difficulty}

Create a markdown prompt with these sections:

## The Concept
Brief overview (2-3 sentences)

## What You're Building
Core features (3-5 bullet points)

## User Flow
Step-by-step how someone uses it (3-4 steps)

## Tech Stack Suggestions
Give 2-3 specific options for frontend, backend, and APIs/tools. Note they can swap for their preferred stack.

## Implementation Steps
${difficulty === 'Easy' ? '5-7' : difficulty === 'Medium' ? '4-6' : '3-5'} clear steps to build this

## Starter Code Snippets
${difficulty === 'Easy' ? '2-3 helpful code examples' : difficulty === 'Medium' ? '1-2 key code patterns' : '1 architectural example'}

## Bonus Ideas
2-3 ways to extend the project

## Tips
${difficulty === 'Easy' ? 'Encouraging advice for beginners' : difficulty === 'Medium' ? 'Practical shipping advice' : 'Architectural considerations'}

Output ONLY markdown. No conversational text before or after.`;

    console.log('Calling Gemini API with gemini-2.5-flash...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500  // Reduced from 2048 for faster generation
        }
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

    // Clean up any markdown code fences if Gemini added them
    generatedPrompt = generatedPrompt
      .replace(/^```markdown\n/i, '')
      .replace(/^```\n/i, '')
      .replace(/\n```$/i, '')
      .trim();

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
