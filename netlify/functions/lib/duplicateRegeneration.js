import { findDuplicateQuestIndexes, normalizeQuestsForDate, normalizeTitleKey } from './questTone.js';

export async function regenerateDuplicateIdeas({ ideas, existingTitles, normalizeDate, regenerateOne }) {
  const updated = [...ideas];
  const existingKeys = new Set(existingTitles.map(normalizeTitleKey).filter(Boolean));

  while (true) {
    const duplicateIndexes = findDuplicateQuestIndexes(updated, [...existingKeys]);
    if (!duplicateIndexes.length) return updated;

    for (const index of duplicateIndexes) {
      let replacement = null;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const blockedTitleKeys = [
          ...existingKeys,
          ...updated.map((item) => normalizeTitleKey(item.title)).filter(Boolean)
        ];

        const generated = await regenerateOne(blockedTitleKeys);
        const candidate = normalizeQuestsForDate(generated, normalizeDate)[0];
        const candidateKey = normalizeTitleKey(candidate?.title);

        if (candidate && candidateKey && !existingKeys.has(candidateKey)) {
          replacement = candidate;
          existingKeys.add(candidateKey);
          break;
        }
      }

      if (!replacement) {
        throw new Error('Failed to regenerate a non-duplicate quest after multiple attempts');
      }

      updated[index] = replacement;
    }
  }
}
