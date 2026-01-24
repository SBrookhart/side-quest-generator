export async function handler() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return {statusCode:200, body:"[]"};

  const query = "confusing OR unclear OR wish OR hard to see OR why is this -is:pr in:title,body";
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=40`;

  const res = await fetch(url, {
    headers:{Authorization:`Bearer ${token}`}
  });
  const json = await res.json();
  if (!json.items) return {statusCode:200, body:"[]"};

  const ideas = json.items
    .filter(i=>!i.pull_request && i.body && i.body.length<1200)
    .slice(0,5)
    .map(i=>({
      title:i.title,
      murmur: i.body.split("\n")[0],
      quest:"Create a visual interface or explainer that clarifies this frustration.",
      worth:[
        "Can be prototyped with web tech",
        "Useful even if simple",
        "Creative, not heavy"
      ],
      signals:[{name:"GitHub",url:i.html_url}]
    }));

  return {
    statusCode:200,
    body:JSON.stringify(ideas)
  };
}
