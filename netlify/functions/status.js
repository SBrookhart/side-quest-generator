function getTodayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export const handler = async () => {
  const today = getTodayET();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let databaseOk = false;
  let questsAvailable = false;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/daily_quests?quest_date=eq.${today}&select=id&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (res.ok) {
        databaseOk = true;
        const rows = await res.json();
        questsAvailable = rows.length > 0;
      }
    } catch {
      // database unreachable
    }
  }

  let status, message;
  if (databaseOk && questsAvailable) {
    status = 'operational';
    message = 'All systems operational — live quests available.';
  } else if (databaseOk && !questsAvailable) {
    status = 'degraded';
    message = 'Database reachable, but today\'s quests haven\'t generated yet.';
  } else {
    status = 'down';
    message = 'Database unreachable — serving fallback content.';
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60'
    },
    body: JSON.stringify({
      status,
      message,
      date: today,
      services: {
        database: databaseOk,
        quests_available: questsAvailable
      }
    })
  };
};
