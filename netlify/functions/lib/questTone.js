const HARD_CAP_START_DATE = '2025-02-21';

const TECHNICAL_TERMS = [
  /\bci\/?cd\b/i,
  /\bcli\b/i,
  /\bdevops\b/i,
  /\bwebhook(s)?\b/i,
  /\bmiddleware\b/i,
  /\bcontainer(s|ization)?\b/i,
  /\bproxy\b/i,
  /\bterminal\b/i,
  /\bdebug(ger)?\b/i,
  /\blinter\b/i,
  /\bgithub action(s)?\b/i,
  /\bapi gateway\b/i,
  /\bcron job\b/i,
  /\bdeployment pipeline\b/i,
  /\binfrastructure\b/i,
  /\bself-host(ed|ing)?\b/i,
  /\bkubernetes\b/i,
  /\bdocker\b/i,
  /\bserverless\b/i
];

export function normalizeTitleKey(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findDuplicateQuestIndexes(ideas, existingTitles = []) {
  const seen = new Set(existingTitles.map(normalizeTitleKey).filter(Boolean));
  const duplicates = [];

  ideas.forEach((idea, index) => {
    const key = normalizeTitleKey(idea.title);
    const isDuplicate = key && seen.has(key);

    if (!isDuplicate) {
      if (key) seen.add(key);
      return;
    }
    duplicates.push(index);
  });

  return duplicates;
}

function isTooTechnical(idea) {
  const text = `${idea.title || ''} ${idea.murmur || ''} ${idea.quest || ''}`;
  return TECHNICAL_TERMS.some((pattern) => pattern.test(text));
}

function rewriteForVibeCoder(idea) {
  const rewrite = (text = '') => text
    .replace(/\bCI\/?CD\b/gi, 'automated checks')
    .replace(/\bCLI\b/gi, 'simple command tool')
    .replace(/\bDevOps\b/gi, 'app setup')
    .replace(/\bwebhooks?\b/gi, 'live updates')
    .replace(/\bmiddleware\b/gi, 'helper layer')
    .replace(/\bcontainers?\b/gi, 'app packaging')
    .replace(/\bcontainerization\b/gi, 'app packaging')
    .replace(/\bproxy\b/gi, 'middle helper')
    .replace(/\bterminal\b/gi, 'workspace')
    .replace(/\bdebug(ger)?\b/gi, 'fixing workflow')
    .replace(/\blinter\b/gi, 'quality helper')
    .replace(/\bGitHub Actions?\b/gi, 'auto steps')
    .replace(/\bAPI gateway\b/gi, 'request router')
    .replace(/\bcron jobs?\b/gi, 'scheduled runs')
    .replace(/\bdeployment pipeline\b/gi, 'release flow')
    .replace(/\binfrastructure\b/gi, 'setup')
    .replace(/\bself-host(ed|ing)?\b/gi, 'run-it-yourself')
    .replace(/\bKubernetes\b/gi, 'orchestration stack')
    .replace(/\bDocker\b/gi, 'packaged app')
    .replace(/\bserverless\b/gi, 'managed backend');

  return {
    ...idea,
    title: rewrite(idea.title),
    murmur: rewrite(idea.murmur),
    quest: rewrite(idea.quest)
  };
}

export function normalizeQuestsForDate(ideas, dateISO) {
  const appliesHardCap = dateISO >= HARD_CAP_START_DATE;
  let hardCount = 0;

  return ideas.map((idea, index) => {
    let next = rewriteForVibeCoder(idea);
    if (isTooTechnical(next)) {
      next = {
        ...next,
        difficulty: next.difficulty === 'Hard' ? 'Medium' : (next.difficulty || 'Medium')
      };
    }

    if (appliesHardCap && next.difficulty === 'Hard') {
      hardCount += 1;
      if (hardCount > 1) {
        next = { ...next, difficulty: 'Medium' };
      }
    }

    return {
      ...next,
      title: next.title || `Side Quest ${index + 1}`,
      murmur: next.murmur || 'A practical idea that solves a real everyday friction point in a playful way.',
      quest: next.quest || 'Build a simple app flow that helps people do this faster with less stress.',
      worth: Array.isArray(next.worth) && next.worth.length ? next.worth.slice(0, 3) : [
        'Practical value people can feel immediately',
        'Straightforward weekend build scope',
        'Teaches useful product-thinking skills'
      ],
      difficulty: ['Easy', 'Medium', 'Hard'].includes(next.difficulty) ? next.difficulty : 'Medium'
    };
  });
}
