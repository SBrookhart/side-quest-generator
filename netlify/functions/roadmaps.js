export async function handler() {
  return {
    statusCode:200,
    body:JSON.stringify([
      {
        title:"Humanize a Roadmap Item",
        murmur:"Roadmaps describe future features but not what they *feel* like.",
        quest:"Turn a roadmap item into a visual micro-demo or explainer.",
        worth:["Focused scope","User-friendly","Creative"],
        signals:[{name:"Roadmaps",url:"https://github.com/search?q=roadmap"}]
      }
    ])
  };
}
