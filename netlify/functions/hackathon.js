export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify([
      {
        title:"Resurrect the Abandoned Hackathon Idea",
        murmur:"Many hackathon ideas never ship despite strong concepts.",
        quest:"Build a gallery of abandoned hackathon ideas reframed as weekend projects.",
        worth:[
          "Built-in scope control",
          "Clear starting point",
          "Socially interesting"
        ],
        signals:[
          {name:"Devpost",url:"https://devpost.com/software"}
        ]
      }
    ])
  };
}
