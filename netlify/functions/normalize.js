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

export function normalizeIdeas(ideas) {
  let hardCount = 0;

  return ideas.map((idea, index) => {
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
}
