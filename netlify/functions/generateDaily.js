import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("tech-murmurs-archive", {
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN
  });

  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `day:${today}`;
  const indexKey = "archive:index";

  let index = await store.get(indexKey, { type: "json" });
  if (!Array.isArray(index)) index = [];

  if (index.includes(today)) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "already-generated",
        date: today
      })
    };
  }

  const ideas = [
    {
      title: "Gas Fee Translator",
      murmur:
        "Users repeatedly express confusion around transaction fees during congestion.",
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
        "Governance discussions are long and participation remains low.",
      quest:
        "Summarize proposals into risks, tradeoffs, and outcomes.",
      worth: [
        "Increases governance participation",
        "Reduces cognitive overhead"
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

  await store.set(dayKey, payload);
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
