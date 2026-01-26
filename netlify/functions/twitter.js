// netlify/functions/twitter.js

export async function getTwitterSignals() {
  // Intentionally conservative: return empty until strong signals exist
  return [];
}

export async function handler() {
  const signals = await getTwitterSignals();
  return new Response(JSON.stringify(signals), { status: 200 });
}
