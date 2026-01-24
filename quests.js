const quests = [
  {
    title: "Gas Fee Translator",
    sourceType: "X",
    origin: "Tweet from an Ethereum infrastructure developer",
    problem: "Users don’t understand why gas fees change or what they are actually paying for.",
    quest: "Build a lightweight widget that explains gas fees in plain English at the moment of transaction.",
    audience: "Wallet teams, onboarding tools, L2 explorers",
    difficulty: "Medium",
    sourceLink: "https://twitter.com/ethereum"
  },
  {
    title: "DAO Proposal Summarizer",
    sourceType: "GitHub",
    origin: "Heavily commented governance issue in a DAO repo",
    problem: "DAO voters don’t have time to read long proposals or debate threads.",
    quest: "Create a tool that summarizes proposals and highlights key tradeoffs and risks.",
    audience: "DAO contributors, delegates, voters",
    difficulty: "Easy–Medium",
    sourceLink: "https://github.com/ethereum/governance"
  },
  {
    title: "Protocol Changelog Radar",
    sourceType: "GitHub",
    origin: "Multiple developer posts during a fast-moving testnet launch",
    problem: "Builders miss breaking changes across rapidly evolving protocols.",
    quest: "Aggregate protocol changelogs into a single alert feed with breaking-change detection.",
    audience: "Application developers, infra teams",
    difficulty: "Medium",
    sourceLink: "https://github.com/solana-labs/solana"
  }
];

const container = document.getElementById("quests");

quests.forEach((q, index) => {
  const div = document.createElement("div");
  div.className = "quest";

  div.innerHTML = `
    <h2>Side Quest #${index + 1}: ${q.title}</h2>

    <div class="section">
      <div class="label">Origin</div>
      <div class="value">${q.origin}</div>
    </div>

    <div class="section">
      <div class="label">The problem</div>
      <div class="value">${q.problem}</div>
    </div>

    <div class="section">
      <div class="label">The quest</div>
      <div class="value">${q.quest}</div>
    </div>

    <div class="section">
      <div class="label">Who wants this</div>
      <div class="value">${q.audience}</div>
    </div>

    <div class="meta">
      <span class="pill">Difficulty: ${q.difficulty}</span>
      <span class="pill">Source: ${q.sourceType}</span>
      <a class="source-link" href="${q.sourceLink}" target="_blank">
        View source →
      </a>
    </div>
  `;

  container.appendChild(div);
});
