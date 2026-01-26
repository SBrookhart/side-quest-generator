import { getStore } from "@netlify/blobs";

const generateIdeasForDay = (dayIndex) => {
  const day1Ideas = [
    {
      title: "What Actually Changed in This Upgrade?",
      murmur: "Protocol upgrades ship without clear changelogs, leaving developers to discover breaking changes through failures.",
      quest: "Build a tool that diffs contract upgrades and shows what functions changed, what got removed, and what's new—in plain English.",
      worth: [
        "Prevents surprise failures",
        "Makes upgrades transparent",
        "Interesting technical challenge"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Protocol Governance", url: "https://github.com/search?q=contract+upgrade+breaking" },
        { type: "x", name: "Developer X", url: "https://x.com/search?q=contract%20upgrade%20broke" }
      ]
    },
    {
      title: "Why Don't These NFTs Load Anymore?",
      murmur: "NFT metadata disappears when IPFS pins expire or servers go down, but nobody notices until holders complain.",
      quest: "Create a monitoring service that checks NFT metadata availability across IPFS and HTTP, alerting when assets become unreachable.",
      worth: [
        "Protects project reputation",
        "Prevents holder complaints",
        "Simple monitoring + alerts"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "NFT Infrastructure", url: "https://github.com/search?q=nft+metadata+missing" },
        { type: "x", name: "NFT Twitter", url: "https://x.com/search?q=nft%20image%20broken" }
      ]
    },
    {
      title: "Can I Actually Afford This Transaction?",
      murmur: "Users see gas estimates but don't know if they'll change or if they're getting ripped off compared to others.",
      quest: "Build a gas price explainer that shows historical trends, percentile rankings, and suggests better times to transact.",
      worth: [
        "Reduces transaction anxiety",
        "Saves users real money",
        "Clean data visualization"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Wallet Issues", url: "https://github.com/search?q=gas+fee+expensive" },
        { type: "x", name: "Crypto X", url: "https://x.com/search?q=gas%20fees%20expensive" }
      ]
    },
    {
      title: "Where Are All the Working Faucets?",
      murmur: "Testnet faucet links break constantly and nobody maintains a current list of what actually works.",
      quest: "Create a live directory of testnet faucets with uptime monitoring, rate limit info, and one-click requesting.",
      worth: [
        "Saves hours of googling",
        "Helps new developers instantly",
        "Super fast to build"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Developer Tools", url: "https://github.com/search?q=testnet+faucet" },
        { type: "x", name: "Dev X", url: "https://x.com/search?q=testnet%20faucet%20help" }
      ]
    },
    {
      title: "Did This Proposal Actually Pass?",
      murmur: "DAO voting results get scattered across Snapshot, forums, and Discord without a single source of truth.",
      quest: "Build a unified DAO decision tracker that shows proposal status, vote counts, and execution status across platforms.",
      worth: [
        "Makes governance transparent",
        "Reduces voter confusion",
        "Useful data aggregation practice"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "DAO Governance", url: "https://github.com/search?q=dao+proposal+voting" },
        { type: "x", name: "DAO Twitter", url: "https://x.com/search?q=dao%20proposal%20status" }
      ]
    }
  ];

  const day2Ideas = [
    {
      title: "Why Can't I Replay This Transaction?",
      murmur: "Developers need to test edge cases but can't easily replay past transactions on a local fork without manual setup.",
      quest: "Build a tool that takes any transaction hash and creates a one-click local fork with that exact state, ready to replay and modify.",
      worth: [
        "Makes debugging way easier",
        "Perfect for learning contracts",
        "Great developer experience win"
      ],
      difficulty: "Hard",
      sources: [
        { type: "github", name: "Testing Tools", url: "https://github.com/search?q=transaction+replay+fork" },
        { type: "x", name: "Dev X", url: "https://x.com/search?q=replay%20transaction%20debug" }
      ]
    },
    {
      title: "Where Did My Approval Go?",
      murmur: "Users approve token spending limits but have no idea which apps can still spend their tokens months later.",
      quest: "Create an approval dashboard that shows all active token approvals, when they were made, and lets users revoke them in bulk.",
      worth: [
        "Prevents unauthorized drains",
        "Builds user trust",
        "Clean security UX"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Security Tools", url: "https://github.com/search?q=token+approval+revoke" },
        { type: "x", name: "Security X", url: "https://x.com/search?q=token%20approval%20security" }
      ]
    },
    {
      title: "Why Is This Contract Call Failing?",
      murmur: "Contract interactions fail with cryptic error messages that don't explain what actually went wrong or how to fix it.",
      quest: "Build an error decoder that translates revert messages and failed transactions into plain English explanations with suggested fixes.",
      worth: [
        "Saves debugging frustration",
        "Helps newcomers learn faster",
        "Simple string matching to start"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Developer Experience", url: "https://github.com/search?q=contract+error+cryptic" },
        { type: "x", name: "Dev Help", url: "https://x.com/search?q=contract%20error%20help" }
      ]
    },
    {
      title: "Which Wallet Actually Supports This?",
      murmur: "Users don't know which wallets support which chains, leading to confusion and failed connection attempts.",
      quest: "Create a wallet compatibility matrix showing which wallets work with which chains, updated automatically from each wallet's docs.",
      worth: [
        "Reduces onboarding friction",
        "Helps users choose wallets",
        "Easy web scraping project"
      ],
      difficulty: "Easy",
      sources: [
        { type: "github", name: "Wallet Docs", url: "https://github.com/search?q=wallet+chain+support" },
        { type: "x", name: "Wallet Help", url: "https://x.com/search?q=which%20wallet%20supports" }
      ]
    },
    {
      title: "How Much Did This Really Cost?",
      murmur: "Transaction receipts show gas in Wei and Gwei, but people want to know the actual dollar cost at the time of the transaction.",
      quest: "Build a transaction cost calculator that shows historical fiat value of gas fees using time-stamped price data.",
      worth: [
        "Makes costs understandable",
        "Good for expense tracking",
        "Interesting price API work"
      ],
      difficulty: "Medium",
      sources: [
        { type: "github", name: "Analytics Tools", url: "https://github.com/search?q=gas+cost+usd" },
        { type: "x", name: "Cost Tracking", url: "https://x.com/search?q=transaction%20cost%20usd" }
      ]
    }
  ];

  return dayIndex === 0 ? day1Ideas : day2Ideas;
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

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const ideas = generateIdeasForDay(i);

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
