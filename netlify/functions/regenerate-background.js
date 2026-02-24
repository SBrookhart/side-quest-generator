// Background function for force-regenerating today's quests.
// Netlify treats files ending in -background as background functions:
// returns 202 immediately, runs for up to 15 minutes.
// Usage: GET /api/regenerate-background

import { generateAndStore } from './generateDaily.js';

export const handler = async () => {
  console.log('Force regeneration triggered via background function');
  try {
    const ideas = await generateAndStore({ force: true });
    console.log(`Force regeneration complete: ${ideas.length} quests stored`);
  } catch (error) {
    console.error('Force regeneration failed:', error);
  }
};
