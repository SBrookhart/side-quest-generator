export async function getGithubSignals() {
  const res = await fetch(
    "https://api.github.com/search/issues?q=label:help+wanted+state:open&per_page=10",
    {
      headers: {
        "User-Agent": "tech-murmurs"
      }
    }
  );

  const data = await res.json();

  return (data.items || []).map(issue => ({
    type: "github",
    name: "GitHub Issue",
    url: issue.html_url,
    text: issue.title + " — " + (issue.body || "").slice(0, 300)
  }));
}
