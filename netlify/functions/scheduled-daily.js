import { generateAndStore } from './generateDaily.js';

export const handler = async (event, context) => {
  // Validate cron secret to prevent unauthorized triggers
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = event.headers?.['x-cron-secret'];
    if (provided !== cronSecret) {
      console.warn('Unauthorized scheduled-daily call: invalid or missing x-cron-secret');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
  }

  console.log('Scheduled daily generation triggered at:', new Date().toISOString());

  try {
    const ideas = await generateAndStore();
    console.log('Daily generation completed:', ideas.length, 'quests stored');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: ideas.length })
    };
  } catch (error) {
    console.error('Scheduled generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scheduled generation failed', details: error.message })
    };
  }
};

export const config = {
  schedule: "0 5 * * *"  // 05:00 UTC daily (matches pg_cron EST job)
};
