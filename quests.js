const quests = [
  {
    title: "Gas Fee Translator",
    sourceType: "X",
    sourceIcon: "🟦",
    origin: "Tweet discussing confusing gas fees",
    problem: "Users struggle to understand gas fees at checkout.",
    quest: "Build a real-time gas fee explainer widget with plain English tooltips.",
    audience: "Wallets, onboarding tools",
    difficulty: "Medium",
    sourceLink: "https://twitter.com/ethereum/status/1700000000000000000"
  },
  {
    title: "DAO Proposal Summarizer",
    sourceType: "GitHub",
    sourceIcon: "🐙",
    origin: "DAO governance issue thread with 50+ comments",
    problem: "Long proposals are hard to digest for voters.",
    quest: "Create a summarizer that highlights outcomes, risks, and key changes.",
    audience: "DAO delegates and voters",
    difficulty: "Easy-Medium",
    sourceLink: "https://github.com/org/repo/issues/123"
  },
  {
    title: "Protocol Changelog Radar",
    sourceType: "GitHub",
    sourceIcon: "🐙",
    origin: "Rapid protocol updates during testnet launch",
    problem: "Developers miss breaking changes across different repos.",
    quest: "Aggregate notable changelog events into a simple alert feed.",
    audience: "App developers, protocol integrators",
    difficulty: "Medium",
    sourceLink: "https://github.com/solana-labs/solana/CHANGELOG.md"
  }
];

const container = document.getElementById("quests");

quests.forEach((q, index) => {
  const card = document.createElement("div");
  card.className = "quest-card";

  card.innerHTML = `
    <div class="quest-title">${q.sourceIcon} Side Quest #${index + 1}: ${q.title}</div>

    <div class="label">Origin</div>
    <div class="value">${q.origin}</div>

    <div class="label">The problem</div>
    <div class="value">${q.problem}</div>

    <div class="label">The quest</div>
    <div class="value">${q.quest}</div>

    <div class="label">Who wants this</div>
    <div class="value">${q.audience}</div>

    <div class="meta">
      <span class="badge">Difficulty: ${q.difficulty}</span>
      <span class="badge">${q.sourceType}</span>
      <a class="source-link" href="${q.sourceLink}" target="_blank">
        View Source →
      </a>
    </div>
  `;

  container.appendChild(card);
});
