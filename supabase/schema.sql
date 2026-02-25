-- Run in Supabase SQL Editor. Enable pg_cron and pg_net extensions first.

CREATE TABLE IF NOT EXISTS daily_quests (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  murmur TEXT,
  quest TEXT,
  worth JSONB DEFAULT '[]',
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  sources JSONB DEFAULT '[]',
  quest_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/New_York')::DATE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quest_archive (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  murmur TEXT,
  quest TEXT,
  worth JSONB DEFAULT '[]',
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  sources JSONB DEFAULT '[]',
  quest_date DATE NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(quest_date DESC);
CREATE INDEX IF NOT EXISTS idx_quest_archive_date ON quest_archive(quest_date DESC, display_order);

-- Enable Row Level Security
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_archive ENABLE ROW LEVEL SECURITY;

-- Allow public read access (quests are publicly displayed)
CREATE POLICY "Allow public read access" ON daily_quests
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON quest_archive
  FOR SELECT USING (true);

-- Idempotent archive function: moves yesterday's quests to archive
CREATE OR REPLACE FUNCTION archive_daily_quests() RETURNS jsonb AS $$
DECLARE
  yesterday DATE;
  archived_count INT;
BEGIN
  yesterday := (NOW() AT TIME ZONE 'America/New_York')::DATE - 1;
  IF EXISTS (SELECT 1 FROM quest_archive WHERE quest_date = yesterday LIMIT 1) THEN
    RETURN jsonb_build_object('status','already_archived','date',yesterday);
  END IF;
  INSERT INTO quest_archive (title,murmur,quest,worth,difficulty,sources,quest_date,display_order)
  SELECT title,murmur,quest,worth,difficulty,sources,quest_date,display_order
  FROM daily_quests WHERE quest_date = yesterday;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  DELETE FROM daily_quests WHERE quest_date = yesterday;
  RETURN jsonb_build_object('status','archived','count',archived_count,'date',yesterday);
END;
$$ LANGUAGE plpgsql;

-- pg_cron: archive at both 04:00 and 05:00 UTC (covers EDT/EST)
SELECT cron.schedule('archive-quests-est','0 5 * * *','SELECT archive_daily_quests()');
SELECT cron.schedule('archive-quests-edt','0 4 * * *','SELECT archive_daily_quests()');

-- pg_cron: trigger generation 1 min after archive
-- Replace YOUR_CRON_SECRET below with the value of your CRON_SECRET Netlify env var
SELECT cron.schedule('generate-quests-est','1 5 * * *',
  $$SELECT net.http_post(url:='https://side-quest-generator.netlify.app/.netlify/functions/scheduled-daily',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret','YOUR_CRON_SECRET'),
    body:='{}'::jsonb)$$);
SELECT cron.schedule('generate-quests-edt','1 4 * * *',
  $$SELECT net.http_post(url:='https://side-quest-generator.netlify.app/.netlify/functions/scheduled-daily',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret','YOUR_CRON_SECRET'),
    body:='{}'::jsonb)$$);
