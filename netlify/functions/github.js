// netlify/functions/github.js
export async function getGitHubSignals() {
  const queries = [
    `"missing" in:body is:issue is:open`,
    `"wish there was" in:body is:issue is:open`,
    `"hard to" in:body is:issue is:open`
  ];

  const results = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=5`,
        { headers: { Accept: "application/vnd.github+json" } }
      );

      if (!res.ok) continue;

      const data = await res.json();
      for (const item of data.items || []) {
        results.push({
          type: "github",
          text: item.body || item.title,
          url: item.html_url,
          date: item.created_at
        });
      }
    } catch {}
  }

  return results;
}

export default async function handler() {
  const signals = await getGitHubSignals();
  return Response.json(signals);
}
