// netlify/functions/twitter.js

export async function getTwitterSignals() {
  // Intentionally empty for now — safe, predictable
  return [];
}

export async function handler() {
  const signals = await getTwitterSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
