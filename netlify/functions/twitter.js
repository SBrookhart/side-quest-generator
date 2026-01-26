// netlify/functions/twitter.js
export async function getTwitterSignals() {
  // Placeholder until paid API is added
  return [
    {
      type: "x", // Changed from "twitter" to "x"
      text: "Developers keep rebuilding the same infra dashboards.",
      url: "https://x.com/search?q=web3%20developer%20problem",
      date: new Date().toISOString()
    }
  ];
}

export default async function handler() {
  return Response.json(await getTwitterSignals());
}
