import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-archive");

  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `day:${today}`;
  const indexKey = "archive:index";

  // Load index (source of truth)
  let index = await store.get(indexKey, { type: "json" });
  if (!Array.isArray(index)) index = [];

  // If index already contains today, stop
  if (index.includes(today)) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "already-generated",
        date: today
      })
    };
  }

  // --- Generate ideas (placeholder – your pipeline can live here)
  const ideas = [
    {
      title: "Gas Fee Translator",
      murmur:
        "Users repeatedly express confusion around transaction fees during network congestion.",
      quest:
        "Build a plain-English explanation layer that interprets gas fees at transaction time.",
      worth: [
        "Improves trust for non-technical users",
        "Reduces abandoned transactions"
      ],
      signals: [
        { type: "twitter", url: "https://x.com/search?q=gas%20fees" }
      ]
    },
    {
      title: "DAO Proposal Digest",
      murmur:
        "Governance threads are long and participation remains low.",
      quest:
        "Summarize proposals into risks, tradeoffs, and outcomes.",
      worth: [
        "Increases governance participation",
        "Reduces cognitive load for voters"
      ],
      signals: [
        { type: "github", url: "https://github.com/ethereum/governance" }
      ]
    }
  ];

  const payload = {
    date: today,
    mode: "live",
    ideas
  };

  // Write day FIRST
  await store.set(dayKey, payload);

  // Update index SECOND
  index.unshift(today);
  await store.set(indexKey, index);

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "generated",
      date: today,
      ideasWritten: ideas.length
    })
  };
}
