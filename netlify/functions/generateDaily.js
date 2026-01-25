import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-archive");

  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `day:${today}`;
  const indexKey = "archive:index";

  // Check if today already exists
  const existing = await store.get(dayKey, { type: "json" });
  if (existing) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "already-generated",
        date: today
      })
    };
  }

  // 🔹 Generate ideas (replace with your live pipeline)
  const ideas = [
    {
      title: "Gas Fee Translator",
      murmur: "Users repeatedly express confusion around transaction fees during congestion.",
      quest: "Build a plain-English explanation layer that interprets gas fees at transaction time.",
      worth: [
        "Improves trust and transparency for non-technical users",
        "Reduces failed or abandoned transactions"
      ],
      signals: [
        { type: "twitter", url: "https://x.com/search?q=gas%20fees" }
      ]
    },
    {
      title: "DAO Proposal Digest",
      murmur: "Governance discussions are long and participation remains low.",
      quest: "Summarize proposals into risks, tradeoffs, and outcomes.",
      worth: [
        "Increases governance participation",
        "Reduces cognitive overhead for delegates"
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

  // Write day snapshot
  await store.set(dayKey, payload);

  // Update index
  const index = (await store.get(indexKey, { type: "json" })) || [];
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
