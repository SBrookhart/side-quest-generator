// netlify/functions/github.js

const SEARCH_QUERY = `
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

const MAX_RESULTS = 25;

/* ---------- helpers ---------- */

function cleanText(text = "") {
  return text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`[^`]*`/g, "")        // remove inline code
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function isHighSignal(text) {
  return (
    text.length >= 80 &&
    !text.toLowerCase().includes("thanks") &&
    !text.toLowerCase().includes("duplicate") &&
    !text.toLowerCase().includes("closed")
  );
}

/* ---------- core ingestion ---------- */

export async function fetchGitHubSignals() {
  const url =
    "https://api.github.com/search/issues" +
    `?q=${encodeURIComponent(SEARCH_QUERY)}` +
    `&sort=updated&order=desc&per_page=${MAX_RESULTS}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "tech-murmurs"
    }
  });

  if (!res.ok) {
    console.error("GitHub API error:", res.status);
    return [];
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items
    .map(issue => {
      const text = cleanText(issue.body || issue.title || "");

      if (!isHighSignal(text)) return null;

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

/* ---------- Netlify handler ---------- */

export async function handler() {
  try {
    const signals = await fetchGitHubSignals();
    return Response.json({ signals }, { status: 200 });
  } catch (err) {
    console.error("GitHub function crashed:", err);
    return Response.json({ signals: [] }, { status: 200 });
  }
}
