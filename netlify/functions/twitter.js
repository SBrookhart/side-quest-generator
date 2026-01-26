// netlify/functions/twitter.js

/**
 * 🔑 Named export for orchestration
 */
export async function getTwitterSignals() {
  // Safe empty for now (no rate burn, no failures)
  return [];
}

/**
 * HTTP endpoint
 */
export async function handler() {
  const signals = await getTwitterSignals();
  return new Response(JSON.stringify(signals), {
    headers: { "Content-Type": "application/json" }
  });
}
