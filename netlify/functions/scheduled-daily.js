import { handler as generateDailyHandler } from './generateDaily.js';

// This function runs automatically every day at midnight UTC
export const handler = async (event, context) => {
  console.log('Scheduled daily generation triggered at:', new Date().toISOString());
  
  try {
    // Call the generateDaily function
    const result = await generateDailyHandler(event, context);
    
    console.log('Daily generation completed:', result.statusCode);
    return result;
  } catch (error) {
    console.error('Scheduled generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scheduled generation failed', details: error.message })
    };
  }
};

// Configure the schedule - runs daily at midnight UTC
export const config = {
  schedule: "0 0 * * *"  // Cron syntax: minute hour day month weekday
};
