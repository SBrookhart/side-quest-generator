export async function handler() {
  return {statusCode:200, body:JSON.stringify([
    {
      title:"Reframe an Abandoned Hackathon Try",
      murmur:"Many hackathon ideas don’t get follow-up despite good core concepts.",
      quest:"Build a gallery of half-finished hackathon ideas reframed as vibe-coder side quests.",
      worth:["Clear starting point","Socially interesting","Glue work"],
      signals:[{name:"Devpost",url:"https://devpost.com/software"}]
    }
  ])};
}
