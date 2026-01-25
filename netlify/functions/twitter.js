// netlify/functions/twitter.js
export async function getTwitterSignals() {
  // Placeholder until paid API is added
  return [
    {
      type: "twitter",
      text: "Developers keep rebuilding the same infra dashboards.",
      url: "https://x.com",
      timestamp: new Date().toISOString()
    }
  ];
}

export default async function handler() {
  return Response.json(await getTwitterSignals());
}
