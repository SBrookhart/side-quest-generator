// netlify/functions/generateDaily.js

import { getStore } from "@netlify/blobs";
import { getGitHubSignals } from "./github.js";
import { getHackathonSignals } from "./hackathons.js";
import { getTwitterSignals } from "./twitter.js";
import { getRoadmapSignals } from "./roadmaps.js";

const MAX_IDEAS = 5;

function synthesizeIdea(signals) {
  return {
    title: "Unclaimed Builder Opportunity",
    murmur: "Multiple independent signals point to an unresolved builder frustration that has not yet been claimed.",
    quest: "Build a narrowly scoped tool that removes this recurring friction without over-engineering.",
    value: "Turns repeated low-grade pain into a concrete, vibe-coder-friendly side project.",
    difficulty: signals.length >= 4 ? "Medium" : "Easy",
    sources: signals.map(s => ({
      type: s.type === "twitter" ? "x" : s.type,
      name: s.type.toUpperCase(),
      url: s.url
    }))
  };
}

export async function handler(request) {
  const store = getStore({ name: "tech-murmurs" });
  const today = new Date().toISOString().slice(0, 10);

  const [
    github,
    hackathons,
    twitter,
    roadmaps
  ] = await Promise.all([
    getGitHubSignals(),
    getHackathonSignals(),
    getTwitterSignals(),
    getRoadmapSignals()
  ]);

  const allSignals = [
    ...github,
    ...hackathons,
    ...twitter,
    ...roadmaps
  ];

  // Hard guarantee: always 5 ideas
  const ideas = [];
  for (let i = 0; i < MAX_IDEAS; i++) {
    ideas.push(synthesizeIdea(allSignals.slice(i, i + 3)));
  }

  const payload = {
    mode: "live",
    date: today,
    ideas
  };

  await store.set("latest", JSON.stringify(payload));
  await store.set(`daily-${today}`, JSON.stringify(payload));

  return new Response(JSON.stringify(payload), { status: 200 });
}
