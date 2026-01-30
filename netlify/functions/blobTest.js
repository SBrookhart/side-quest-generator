export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Tech Murmurs API is working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        latest: '/.netlify/functions/latest',
        archive: '/.netlify/functions/archive',
        generateDaily: '/.netlify/functions/generateDaily',
        generatePrompt: '/.netlify/functions/generatePrompt'
      }
    })
  };
};
