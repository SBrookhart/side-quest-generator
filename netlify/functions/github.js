// netlify/functions/github.js

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

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!res.ok) return [];

    const data = await res.json();

    return (data.items || []).map(item => ({
      type: "github",
      name: "GitHub Issue",
      text: item.body || item.title || "",
      url: item.html_url
    }));
  } catch {
    return [];
  }
}

export default async function handler() {
  const signals = await getGithubSignals();
  return Response.json(signals);
}
