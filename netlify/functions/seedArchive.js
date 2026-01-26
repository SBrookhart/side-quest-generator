import { getStore } from "@netlify/blobs";

const generateTestIdeas = () => {
  return [
    {
      title: "Why Can't I Find Working Faucets?",
      murmur: "Testnet faucet links break constantly and nobody maintains a current list.",
      quest: "Create a live directory of testnet faucets with uptime checks and rate limit info.",
      worth: [
        "Saves hours of developer time",
        "Helps newcomers instantly",
        "Simple to build and maintain"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" },
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    },
    {
      title: "What Actually Changed in This Contract?",
      murmur: "Smart contract upgrades happen without clear changelogs, breaking things silently.",
      quest: "Build a contract diff tool that shows what functions changed between versions in plain English.",
      worth: [
        "Prevents surprise failures",
        "Makes upgrades transparent",
        "Interesting technical problem"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" }
      ]
    },
    {
      title: "Why Is Gas So Unpredictable?",
      murmur: "Users approve transactions without knowing if the gas price is fair or terrible.",
      quest: "Create a gas price context tool that shows historical comparisons and suggests better timing.",
      worth: [
        "Reduces transaction anxiety",
        "Saves users real money",
        "Simple data visualization"
      ],
      difficulty: "Medium",
      sources: [
        { type: "twitter", name: "X", url: "https://x.com" }
      ]
    },
    {
      title: "Did This Proposal Actually Pass?",
      murmur: "DAO voting results scatter across platforms with no single source of truth.",
      quest: "Build a DAO decision tracker showing proposal status, votes, and execution across platforms.",
      worth: [
        "Makes governance transparent",
        "Reduces voter confusion",
        "Useful aggregation practice"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" }
      ]
    },
    {
      title: "Where Did My NFT Metadata Go?",
      murmur: "IPFS pins expire and HTTP servers die, but nobody notices until NFTs break.",
      quest: "Create a metadata health monitor that checks availability and sends alerts when links die.",
      worth: [
        "Protects project reputation",
        "Prevents holder complaints",
        "Easy monitoring setup"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "GitHub", url: "https://github.com" }
      ]
    }
  ];
};

export default async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return Response.json(
      { error: "Missing siteID or token" },
      { status: 500 }
    );
  }

  const store = getStore({
    name: "tech-murmurs",
    siteID,
    token
  });

  const days = ["2026-01-23", "2026-01-24"];
  const seeded = [];

  for (const day of days) {
    const ideas = generateTestIdeas();

    await store.set(
      `daily-${day}`,
      JSON.stringify({ 
        date: day, 
        mode: "editorial", 
        ideas 
      })
    );

    seeded.push(day);
  }

  return Response.json({ 
    success: true,
    seeded,
    message: "Archive seeded successfully"
  });
};
