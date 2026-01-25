export async function getGithubSignals() {
  const query = `
    language:javascript
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
      "Accept": "application/vnd.github+json"
    }
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.items.map(item => ({
    type: "github",
    title: item.title,
    text: item.body || "",
    url: item.html_url,
    repo: item.repository_url
  }));
}
