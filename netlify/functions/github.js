export async function handler() {
  try {
    const res = await fetch(
      "https://api.github.com/search/issues?q=repo:facebook/react&per_page=5",
      {
        headers: {
          "User-Agent": "tech-murmurs",
          "Accept": "application/vnd.github+json",
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: res.status,
        items: data.items || [],
        tokenPresent: !!process.env.GITHUB_TOKEN
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
