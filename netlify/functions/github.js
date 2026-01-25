export async function handler() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 200, body: "[]" };

  const query =
    "confusing OR unclear OR missing OR wish OR hard to understand in:title,body -is:pr";
  const url =
    "https://api.github.com/search/issues?q=" +
    encodeURIComponent(query) +
    "&per_page=10";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();

  const signals = (json.items || [])
    .filter(i =>
      i.body &&
      i.body.length < 1200 &&
      !/typo|bump|dependabot|eslint|lint|ci|chore/i.test(i.title)
    )
    .map(i => ({
      type: "github",
      name: "GitHub Issue",
      url: i.html_url,
      text: i.title + " — " + i.body.slice(0, 200)
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(signals)
  };
}
