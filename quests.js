const ICONS = {
  github: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.55-3.88-1.55-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.21 1.79 1.21 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.18 1.18a10.9 10.9 0 012.9-.39c.99 0 1.99.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.64 1.57.24 2.73.12 3.02.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.8 1.08.8 2.18v3.23c0 .31.21.68.8.56 4.57-1.53 7.86-5.85 7.86-10.95C23.5 5.74 18.27.5 12 .5z"/>
    </svg>
  `,
  twitter: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.4 4.8c-.8.4-1.7.6-2.6.8.9-.5 1.6-1.4 1.9-2.4-.8.5-1.8.9-2.8 1.1-1.6-1.7-4.5-.9-5 1.4-.2.8-.1 1.6.2 2.3-3.3-.2-6.3-1.7-8.3-4.3-1 1.8-.5 4.1 1.2 5.3-.7 0-1.4-.2-2-.5 0 2.1 1.5 4 3.6 4.4-.6.2-1.3.2-1.9.1.5 1.8 2.3 3.1 4.3 3.1C9.7 19.4 6.7 20.3 4 20c2 1.3 4.4 2 6.8 2 8.2 0 12.8-7 12.5-13.3.9-.6 1.6-1.4 2.1-2.3z"/>
    </svg>
  `
};

const quests = [
  {
    title: "Gas Fee Translator",
    source: "twitter",
    origin: "Tweet by an Ethereum infra engineer",
    problem: "Gas pricing feels opaque and intimidating at the moment of transaction.",
    quest: "Build a contextual explainer that translates gas fees into plain English at checkout.",
    audience: "Wallet teams, onboarding flows",
    difficulty: "Medium",
    link: "https://twitter.com/ethereum"
  },
  {
    title: "DAO Proposal Summarizer",
    source: "github",
    origin: "Long governance issue thread",
    problem: "Voters lack time to read and compare detailed DAO proposals.",
    quest: "Create a summarization tool that highlights tradeoffs, risks, and outcomes.",
    audience: "DAO delegates and contributors",
    difficulty: "Easy–Medium",
    link: "https://github.com/ethereum/governance"
  }
];

const container = document.getElementById("quests");

quests.forEach((q, i) => {
  const card = document.createElement("div");
  card.className = "quest-card";

  card.innerHTML = `
    <div class="quest-title">Side Quest #${i + 1}: ${q.title}</div>

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
      <a class="source-link" href="${q.link}" target="_blank">
        ${ICONS[q.source]}
        View source
      </a>
    </div>
  `;

  container.appendChild(card);
});
