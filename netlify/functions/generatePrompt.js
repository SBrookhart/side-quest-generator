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
        steps: '5-7 clear, beginner-friendly steps with explanations',
        code: '2-3 complete code examples with comments'
      },
      'Medium': {
        steps: '4-6 structured steps',
        code: '1-2 key code patterns or examples'
      },
      'Hard': {
        steps: '3-5 architectural steps',
        code: '1 architectural code example showing system design'
      }
    };

    const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];
    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    const promptText = `You are generating a detailed build prompt that someone will copy/paste into an AI assistant to help them build their own project.

Output ONLY markdown. Do NOT include any conversational introduction, preamble, or commentary. Start directly with "## The Concept" and end with the Tips section.

IMPORTANT: Use first-person language throughout. This is a personal project the builder wants to create. Say "I'm building" not "you're building". Say "my project" not "your project".

Project Details:
- Title: ${title}
- Why it exists: ${murmur}
- What to build: ${quest}
- Why it's worth it: ${worthList}
- Difficulty: ${difficulty}

Generate a comprehensive, detailed build prompt with these sections:

## The Concept
Write 2-3 sentences in FIRST PERSON explaining what I'm building and why it's cool. Use "I", "my", "me" - NOT "you" or "your".

## What I'm Building
List 3-5 core features as bullet points. Be specific about functionality.

## User Flow
Describe 3-4 steps showing exactly how someone would use this, from start to finish.

## Tech Stack Suggestions
Provide 2-3 concrete technology options for:
- Frontend (if applicable)
- Backend (if applicable)  
- APIs/Tools/Libraries
Include a note that I can swap these for my preferred stack.

## Implementation Steps
Provide ${guidance.steps} to build this project from scratch to working MVP.

## Starter Code Snippets
Include ${guidance.code}. Make them practical and copy-paste ready.

## Bonus Ideas
List 2-3 ways to extend or enhance the project once the core is working.

## Tips
Provide ${difficulty === 'Easy' ? 'encouraging advice for beginners, including common pitfalls to avoid' : difficulty === 'Medium' ? 'practical advice on shipping and deployment' : 'architectural considerations and scaling advice'}.

Remember: 
1. Output ONLY the markdown sections above. No introduction or commentary.
2. Use FIRST PERSON language (I, my, me) throughout - especially in The Concept section.
3. Start directly with ## The Concept.`;

    console.log('Calling Gemini API...');

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
          maxOutputTokens: 3000
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

    // Clean up markdown code fences if present
    generatedPrompt = generatedPrompt
      .replace(/^```markdown\n/i, '')
      .replace(/^```\n/i, '')
      .replace(/\n```$/i, '')
      .trim();

    console.log('Prompt generated successfully');

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
