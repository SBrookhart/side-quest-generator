export async function handler() {
  return {
    statusCode:200,
    body:JSON.stringify([
      {
        title:"Humanize a Roadmap",
        murmur:"Roadmaps explain what’s coming, not how it will feel.",
        quest:"Turn a technical roadmap into an interactive, human-readable preview.",
        worth:[
          "Mostly presentation work",
          "No infra required",
          "Great portfolio piece"
        ],
        signals:[
          {name:"Public Roadmaps",url:"https://github.com/search?q=roadmap&type=repositories"}
        ]
      }
    ])
  };
}
