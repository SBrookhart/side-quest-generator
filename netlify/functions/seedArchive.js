export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Archive seeding is no longer needed - archive data is hardcoded in archive.js',
      note: 'The archive function serves Jan 23-29 from FALLBACK_ARCHIVE constant',
      archiveEndpoint: '/.netlify/functions/archive'
    })
  };
};
