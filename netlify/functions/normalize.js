// Lightweight safety net: rewrites common technical jargon that may slip
// through the prompt's AVOID instructions. Only includes terms where a
// natural, readable replacement exists — drops terms like "proxy", "terminal",
// "Kubernetes" etc. where no rewrite sounds natural (the prompt prevents those).

const REWRITES = [
  [/\bCI\/?CD\b/gi, 'automated checks'],
  [/\bCLI tools?\b/gi, 'command-line tools'],
  [/\bCLI\b/gi, 'command-line app'],
  [/\bDevOps\b/gi, 'app operations'],
  [/\bwebhooks?\b/gi, 'automatic notifications'],
  [/\bmiddleware\b/gi, 'connecting layer'],
  [/\bcontainerization\b/gi, 'app packaging'],
  [/\bcontainers?\b/gi, 'packaged apps'],
  [/\bdeployment pipelines?\b/gi, 'release process'],
  [/\bGitHub Actions?\b/gi, 'automated workflows'],
  [/\bcron jobs?\b/gi, 'scheduled tasks'],
  [/\binfrastructure\b/gi, 'technical setup'],
  [/\bself-host(?:ed|ing)?\b/gi, 'self-run'],
  [/\bAPI gateways?\b/gi, 'request routers'],
  [/\blinters?\b/gi, 'code checkers'],
];

function rewriteJargon(text = '') {
  return REWRITES.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text);
}

// Extract significant words (>3 chars) from a title for comparison.
function titleWords(title) {
  return new Set(
    (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  );
}

// Returns true if two titles share >= 50% of their significant words.
function titlesAreSimilar(a, b) {
  const wordsA = titleWords(a);
  const wordsB = titleWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
  return overlap / Math.min(wordsA.size, wordsB.size) >= 0.5;
}

// Filter out ideas whose titles are too similar to any title in recentTitles,
// or to other ideas earlier in the same batch (intra-batch dedup).
export function deduplicateIdeas(ideas, recentTitles = []) {
  const kept = [];
  for (const idea of ideas) {
    const isDupeOfRecent = recentTitles.some(t => titlesAreSimilar(idea.title, t));
    const isDupeOfKept = kept.some(k => titlesAreSimilar(idea.title, k.title));
    if (!isDupeOfRecent && !isDupeOfKept) {
      kept.push(idea);
    }
  }
  return kept;
}

export function normalizeIdeas(ideas) {
  let hardCount = 0;

  const normalized = ideas.map((idea, index) => {
    let difficulty = ['Easy', 'Medium', 'Hard'].includes(idea.difficulty)
      ? idea.difficulty
      : 'Medium';

    // Cap at most 1 Hard quest per batch
    if (difficulty === 'Hard') {
      hardCount += 1;
      if (hardCount > 1) difficulty = 'Medium';
    }

    return {
      ...idea,
      title: rewriteJargon(idea.title) || `Side Quest ${index + 1}`,
      murmur: rewriteJargon(idea.murmur) || 'A practical idea that solves a real everyday friction point in a playful way.',
      quest: rewriteJargon(idea.quest) || 'Build a simple app flow that helps people do this faster with less stress.',
      worth: Array.isArray(idea.worth) && idea.worth.length
        ? idea.worth.slice(0, 3)
        : ['Practical value people can feel immediately', 'Straightforward weekend build scope', 'Teaches useful product-thinking skills'],
      difficulty,
    };
  });

  // Guarantee exactly 1 Hard quest: promote the last Medium if none exist
  if (hardCount === 0 && normalized.length > 0) {
    const lastMedium = normalized.findLastIndex(q => q.difficulty === 'Medium');
    if (lastMedium !== -1) {
      normalized[lastMedium].difficulty = 'Hard';
    }
  }

  return normalized;
}
