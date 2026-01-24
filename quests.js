const quests = [
  {
    title: "Gas Fee Translator",
    origin: "Tweet from an Ethereum infra developer",
    problem: "Users don’t understand why gas fees change or what they’re paying for.",
    quest: "Build a lightweight widget that explains gas fees in plain English at the moment of transaction.",
    audience: "Wallet teams, onboarding tools, L2 explorers",
    difficulty: "Medium",
    sourceLink: "https://twitter.com"
  },
  {
    title: "DAO Proposal Summarizer",
    origin: "GitHub issue with 40+ comments",
    problem: "DAO voters don’t have time to read long governance proposals.",
    quest: "Create a tool that summarizes proposals and highlights key tradeoffs.",
    audience: "DAO contributors, delegates, voters",
    difficulty: "Easy–Medium",
    sourceLink: "https://github.com"
  },
  {
    title: "Protocol Changelog Radar",
    origin: "Multiple dev tweets during a testnet launch",
    problem: "Builders miss breaking changes across fast-moving protocols.",
    quest: "Aggregate protocol changelogs into a single alert feed.",
    audience: "App developers, infra teams",
    difficulty: "Medium",
    sourceLink: "https://github.com"
  }
];

const container = document.getElementById("quests");

quests.forEach((q, index) => {
  const div = document.createElement("div");
  div.className = "quest";

  div.innerHTML = `
    <h2>Side Quest #${index + 1}: ${q.title}</h2>

    <div class="label">Origin</div>
    <div>${q.origin}</div>

    <div class="label">The problem</div>
    <div>${q.problem}</div>

    <div class="label">The quest</div>
    <div>${q.quest}</div>

    <div class="label">Who wants this</div>
    <div>${q.audience}</div>

    <span class="badge">Difficulty: ${q.difficulty}</span>

    <div class="source">
      <a href="${q.sourceLink}" target="_blank">View source</a>
    </div>
  `;

  container.appendChild(div);
});
