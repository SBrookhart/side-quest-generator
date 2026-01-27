export const handler = async () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No API key' })
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const data = await response.json();
    
    console.log('Available models:', JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
