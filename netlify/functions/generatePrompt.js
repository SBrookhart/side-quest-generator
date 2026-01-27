export const handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!geminiKey && !openaiKey) {
    console.error('No API keys configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'No API keys configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to environment variables.' })
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
        assumptions: 'Assume minimal experience. Explain concepts as you go.',
        steps: '5-7 clear steps',
        code: 'Include 2-3 helpful code examples'
      },
      'Medium': {
        tone: 'balanced and practical',
        detail: 'structured but not hand-holdy',
        assumptions: 'Assume basic development knowledge but explain architecture choices.',
        steps: '4-6 structured steps',
        code: 'Include 1-2 key code patterns'
      },
      'Hard': {
        tone: 'technical and architectural',
        detail: 'focus on system design and best practices',
        assumptions: 'Assume solid development experience. Focus on tradeoffs and scalability.',
        steps: '3-5 architectural steps',
        code: 'Include 1 architectural example'
      }
    };

    const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];
    const worthList = Array.isArray(worth) ? worth.join(', ') : (worth || 'Building something cool');

    const systemPrompt = `You're a creative technical mentor helping indie builders and vibe coders bring playful projects to life.

Tone: ${guidance.tone}
Detail level: ${guidance.detail}
Assumptions: ${guidance.assumptions}

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

    let prompt = '';

    // Try Gemini first (free tier)
    if (geminiKey) {
      try {
        console.log('Trying Gemini API...');
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\n${userPrompt}`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
              }
            })
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          prompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('Gemini API succeeded');
        } else {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }
      } catch (geminiError) {
        console.error('Gemini failed, trying OpenAI fallback:', geminiError);
        
        // Fallback to OpenAI if available
        if (openaiKey) {
          const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiKey}`
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

          if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API error:', openaiResponse.status, errorData);
            throw new Error(`Both APIs failed. OpenAI: ${openaiResponse.status}`);
          }

          const openaiData = await openaiResponse.json();
          prompt = openaiData.choices?.[0]?.message?.content || '';
          console.log('OpenAI fallback succeeded');
        } else {
          throw geminiError;
        }
      }
    } else if (openaiKey) {
      // Only OpenAI available
      console.log('Using OpenAI API...');
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
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
        const errorData = await response.text();
        console.error('OpenAI API error:', response.status, errorData);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: `OpenAI API error: ${response.status}`,
            details: errorData 
          })
        };
      }

      const data = await response.json();
      prompt = data.choices?.[0]?.message?.content || '';
    }

    if (!prompt) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No prompt generated by AI' })
      };
    }

    console.log('Prompt generated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ prompt })
    };

  } catch (error) {
    console.error('Prompt generation failed:', error);
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
