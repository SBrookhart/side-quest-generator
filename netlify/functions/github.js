// netlify/functions/github.js

const SEARCH_QUERIES = [
  "missing",
  "no way to",
  "hard to",
  "wish there was",
  "feature request",
  "would be useful if"
];

const MAX_RESULTS = 20;

export default async function getGitHubSignals() {
  const query = SEARCH_QUERIES.map(q => `"${q}"`).join(" OR ");

  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    query
  )}+is:issue+is:open&sort=updated&order=desc&per_page=${MAX_RESULTS}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });
  } catch {
    return [];
  }

  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data.items)) return [];

  return data.items
    .filter(item => {
      // Exclude obvious noise
      if (!item.body) return false;
      if (item.pull_request) return false;

      const text = `${item.title} ${item.body}`.toLowerCase();

      // Must include unmet-need language
      return SEARCH_QUERIES.some(q => text.includes(q));
    })
    .map(item => {
      const text = item.body
        .replace(/\r?\n/g, " ")
        .slice(0, 280)
        .trim();

      return {
        type: "github",
        text,
        url: item.html_url,
        date: item.updated_at.slice(0, 10)
      };
    });
}
