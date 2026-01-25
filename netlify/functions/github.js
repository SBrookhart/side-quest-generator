// netlify/functions/github.js

// ----- Helper (used by generateDaily.js) -----
export async function getGithubSignals() {
  const query = `
    ("missing" OR "wish there was" OR "hard to" OR "no tool")
    in:body
    is:issue
    is:open
  `;

  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    query
  )}&sort=updated&order=desc&per_page=10`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return (data.items || []).map(item => ({
    type: "github",
    name: "GitHub Issue",
    title: item.title,
    text: item.body || "",
    url: item.html_url
  }));
}

// ----- HTTP handler (required by Netlify) -----
export default async function handler() {
  try {
    const signals = await getGithubSignals();
    return Response.json(signals, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: "GitHub ingestion failed" },
      { status: 500 }
    );
  }
}
