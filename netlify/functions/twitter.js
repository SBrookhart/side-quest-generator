export async function handler() {
  const token = process.env.X_BEARER_TOKEN;
  if(!token) return {statusCode:200, body:"[]"};

  const queries = [
    `"what does this do" (repo OR tool) -is:retweet -is:reply lang:en`,
    `"hard to explain" (tool OR repo) -is:retweet -is:reply lang:en`
  ];
  const signals=[];

  for(const q of queries){
    try{
      const url="https://api.twitter.com/2/tweets/search/recent?query="+encodeURIComponent(q)+"&max_results=8&tweet.fields=public_metrics";
      const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
      const j=await r.json();
      (j.data||[]).forEach(t=>{
        if(t.text.length>40 && !/lol|💀/i.test(t.text)){
          signals.push({name:"X",url:`https://x.com/i/web/status/${t.id}`,signal:t.text});
        }
      });
    }catch{}
  }
  const unique=[];
  const seen=new Set();
  signals.forEach(s=>{
    const k=s.signal.slice(0,60);
    if(!seen.has(k)){seen.add(k);unique.push(s);}
  });

  return {
    statusCode:200,
    body:JSON.stringify(unique.slice(0,5).map(s=>({
      title:"Ambient Developer Signal",
      murmur:s.signal,
      quest:"Use this developer expression to enrich an idea from other sources.",
      worth:["Adds emotional context","Supports another idea","Creative insight"],
      signals:[{name:s.name,url:s.url}]
    })))
  };
}
