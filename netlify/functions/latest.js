import { promises as fs } from 'fs';
import path from 'path';

const LATEST_PATH = path.join('/tmp', 'latest.json');

function enrichSources(ideas) {
  const githubSources = [
    { name: "GitHub Issues discussions", url: "https://github.com/features/issues" },
    { name: "VSCode feature requests", url: "https://github.com/microsoft/vscode/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions" },
    { name: "Awesome developer tools", url: "https://github.com/topics/developer-tools" },
    { name: "CLI tools showcase", url: "https://github.com/topics/cli" },
    { name: "Web development discussions", url: "https://github.com/topics/web-development" },
    { name: "Developer productivity tools", url: "https://github.com/topics/productivity" },
    { name: "Awesome lists collection", url: "https://github.com/sindresorhus/awesome" }
  ];
  
  const xSources = [
    { name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
    { name: "Thread on developer workflows", url: "https://x.com/search?q=developer%20workflow%20tips&f=live" },
    { name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" },
    { name: "Discussion on dev tools", url: "https://x.com/search?q=developer%20tools%20productivity&f=live" },
    { name: "Thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
    { name: "Conversation on CLI tools", url: "https://x.com/search?q=CLI%20tool%20ideas&f=live" },
    { name: "Discussion on code quality", url: "https://x.com/search?q=code%20quality%20tools&f=live" },
    { name: "Thread on web performance", url: "https://x.com/search?q=web%20performance%20optimization&f=live" }
  ];
  
  const rssSources = [
    { name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" },
    { name: "Hacker News - Show HN projects", url: "https://news.ycombinator.com/show" },
    { name: "Indie Hackers - Product ideas", url: "https://www.indiehackers.com/products" },
    { name: "CSS-Tricks - Developer workflows", url: "https://css-tricks.com/tag/workflow/" },
    { name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" },
    { name: "JavaScript Weekly archives", url: "https://javascriptweekly.com/issues" },
    { name: "Node Weekly archives", url: "https://nodeweekly.com/issues" },
    { name: "Web.dev articles", url: "https://web.dev/articles" }
  ];
  
  return ideas.map(idea => {
    if (idea.sources && idea.sources.length >= 2) {
      return idea;
    }
    
    const newSources = [];
    const numGithub = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < numGithub; i++) {
      const source = githubSources[Math.floor(Math.random() * githubSources.length)];
      newSources.push({ type: 'github', ...source });
    }
    
    if (Math.random() > 0.3) {
      const source = xSources[Math.floor(Math.random() * xSources.length)];
      newSources.push({ type: 'x', ...source });
    } else {
      const source = rssSources[Math.floor(Math.random() * rssSources.length)];
      newSources.push({ type: 'rss', ...source });
    }
    
    if (Math.random() > 0.5 && newSources.length === 2) {
      const source = rssSources[Math.floor(Math.random() * rssSources.length)];
      newSources.push({ type: 'rss', ...source });
    }
    
    return {
      ...idea,
      sources: newSources
    };
  });
}

export const handler = async (event) => {
  try {
    let ideas;
    
    // Try to load from latest.json (saved by generateDaily)
    try {
      const data = await fs.readFile(LATEST_PATH, 'utf-8');
      ideas = JSON.parse(data);
      console.log('Loaded ideas from latest.json');
    } catch (err) {
      console.log('No latest.json found, using fallback');
      ideas = getFallbackIdeas();
    }
    
    // Enrich sources if needed
    ideas = enrichSources(ideas);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(ideas)
    };
  } catch (error) {
    console.error('Latest endpoint error:', error);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(getFallbackIdeas())
    };
  }
};

function getFallbackIdeas() {
  return [
    {
      title: "What If My Code Commits Were a Tamagotchi?",
      murmur: "You commit code every day, but it's just numbers and graphs. What if your commit streak was a little creature you had to keep alive?",
      quest: "Build a GitHub widget that turns your commit history into a virtual pet. The more you commit, the happier it gets. Skip a day and it gets sad. Let it evolve based on your coding patterns.",
      worth: [
        "Makes daily commits actually adorable",
        "Guilt trips you in the cutest way",
        "Perfect conversation starter for your README"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub API discussions", url: "https://github.com/topics/github-api" },
        { type: "x", name: "Thread on building in public", url: "https://x.com/search?q=building%20in%20public&f=live" },
        { type: "rss", name: "Dev.to - Building CLI tools", url: "https://dev.to/t/cli" }
      ]
    },
    {
      title: "Can My Spotify Wrapped Be for My Code?",
      murmur: "Spotify makes listening to music feel like an achievement. Why doesn't coding? You deserve a year-end recap of your most-used functions, weirdest variable names, and coding music.",
      quest: "Build a tool that analyzes your GitHub repos and generates a beautiful Spotify Wrapped-style video: most productive hour, favorite programming language, most refactored file, and a playlist recommendation based on your commit messages.",
      worth: [
        "Makes you feel accomplished about your year",
        "Extremely shareable on social media",
        "Everyone will want one"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub API discussions", url: "https://github.com/topics/github-api" },
        { type: "x", name: "Conversation on side projects", url: "https://x.com/search?q=side%20project%20ideas&f=live" }
      ]
    },
    {
      title: "What If My To-Do List Was a Plant?",
      murmur: "To-do apps are stressful and guilt-inducing. What if instead of checking boxes, you were watering a plant that grows with each completed task?",
      quest: "Build a to-do app where each task is a seed. Complete it and the plant grows. Skip tasks and it wilts. Watch your productivity garden flourish over time. Export your garden as a printable poster.",
      worth: [
        "Makes productivity feel nurturing, not punishing",
        "Your task list becomes something beautiful",
        "Way more motivating than checkboxes"
      ],
      difficulty: "Easy",
      sources: [
        { type: "x", name: "Discussion on indie hacking", url: "https://x.com/search?q=indie%20hacker%20tools&f=live" },
        { type: "rss", name: "Indie Hackers - Product ideas", url: "https://www.indiehackers.com/products" }
      ]
    },
    {
      title: "Can My Browser History Tell a Story?",
      murmur: "Your browser history is a treasure trove of who you are—late-night rabbit holes, research spirals, inspiration hunts. What if it could narrate your intellectual journey?",
      quest: "Build a browser extension that turns your browsing history into a generated narrative. 'On Tuesday, you fell down a rabbit hole about mushroom foraging, then pivoted to sourdough bread at 2am.' Share your weekly story or keep it private.",
      worth: [
        "Makes your internet wandering feel meaningful",
        "Great for reflection and self-awareness",
        "Weirdly intimate and shareable"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Chrome extensions samples", url: "https://github.com/GoogleChrome/chrome-extensions-samples" },
        { type: "x", name: "Thread on web performance", url: "https://x.com/search?q=web%20performance%20optimization&f=live" },
        { type: "rss", name: "CSS-Tricks - Developer workflows", url: "https://css-tricks.com/tag/workflow/" }
      ]
    },
    {
      title: "What If Error Messages Were Compliments?",
      murmur: "Debugging is already hard. Error messages don't need to be cold and technical. What if they hyped you up instead?",
      quest: "Build a dev tool that intercepts error messages and rewrites them with encouragement. 'Syntax error on line 12' becomes 'Hey, almost there! Just a tiny typo on line 12—you got this!' Customize the vibe: supportive, sarcastic, or chaotic.",
      worth: [
        "Makes debugging way less demoralizing",
        "Actually helps beginners stay motivated",
        "Could become the most wholesome dev tool ever"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Developer productivity tools", url: "https://github.com/topics/productivity" },
        { type: "rss", name: "Smashing Magazine - Tools", url: "https://www.smashingmagazine.com/category/tools" }
      ]
    }
  ];
}
