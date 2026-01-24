import Parser from "rss-parser";
const parser = new Parser();

export async function handler() {
  const feed = await parser.parseURL("https://devpost.com/feed");

  const ideas = feed.items.slice(0, 5).map(item => ({
    title: item.title,
    origin: "Hackathon prompt",
    problem: "Opportunity surfaced via hackathon challenge.",
    quest: "Prototype a minimal solution inspired by this challenge.",
    audience: "Hackathon builders",
    difficulty: "Easy",
    tags: ["Product"],
    sources: [{
      type: "external",
      url: item.link
    }]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(ideas)
  };
}
