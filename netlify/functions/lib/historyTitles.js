function supabaseHeaders(key) {
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };
}

export async function getExistingQuestTitles(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) return [];

  const headers = supabaseHeaders(supabaseKey);
  const [dailyRes, archiveRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/daily_quests?select=title`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/quest_archive?select=title`, { headers })
  ]);

  const dailyRows = dailyRes.ok ? await dailyRes.json() : [];
  const archiveRows = archiveRes.ok ? await archiveRes.json() : [];

  return [...dailyRows, ...archiveRows]
    .map((row) => row.title)
    .filter(Boolean);
}
