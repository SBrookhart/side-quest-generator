export async function handler() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return { statusCode: 200, body: "[]" };

  const url = "https://api.twitter.com/2/tweets/search/recent?query=wish%20there%20was%20tool&max_results=10";
  const res = await fetch(url, {
    headers:{Authorization:`Bearer ${token}`}
  });
  const json = await res.json();

  const ideas = (json.data||[]).map(t=>({
    title:"Someone Should Build This",
    murmur:t.text,
    quest:"Turn this frustration into a tiny expressive tool.",
    worth:["Low scope","High creativity","Good conversation starter"],
    signals:[{name:"X",url:`https://x.com/i/web/status/${t.id}`}]
  }));

  return { statusCode:200, body:JSON.stringify(ideas) };
}
