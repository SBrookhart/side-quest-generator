// netlify/functions/github.js

const GITHUB_SEARCH_QUERY = `
  (
    "missing" OR
    "no way to" OR
    "hard to" OR
    "wish there was" OR
    "cannot" OR
    "doesn't support" OR
    "would be useful"
  )
  in:title,body
  is:issue
  is:open
`;

const MAX_RESULTS = 20;

function cleanText(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`[^`]*`/g, "")        // remove inline code
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export default async function getGitHubSignals() {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    GITHUB_SEARCH_QUERY
  )}&sort=updated&order=desc&per_page=${MAX_RESULTS}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    console.error("GitHub search failed:", res.status);
    return [];
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items
    .map(issue => {
      const text = cleanText(
        issue.body || issue.title || ""
      );

      if (text.length < 60) return null;

      return {
        type: "github",
        text,
        url: issue.html_url,
        date: issue.updated_at
          ? issue.updated_at.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      };
    })
    .filter(Boolean);
}
