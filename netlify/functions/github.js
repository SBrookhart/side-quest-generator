export async function handler() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 200, body: "[]" };

  const q = "confusing OR unclear OR wish OR hard to understand in:title,body type:issue state:open";
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();

  const ideas = json.items
    .filter(i =>
      !i.pull_request &&
      i.body &&
      i.body.length < 1200 &&
      !/dependabot|bump|ci|lint|test/i.test(i.title)
    )
    .slice(0,3)
    .map(i => ({
      title: "Explain This Repo Like I’m New Here",
      murmur: i.body.split("\n")[0],
      quest: "Build a simple explainer that makes this project understandable in under 60 seconds.",
      worth:[
        "You don’t need to know the codebase",
        "Clarity beats correctness",
        "Shippable in a weekend"
      ],
      signals:[
        {name:"GitHub",url:i.html_url}
      ]
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
