// netlify/functions/latest.js

import { handler as generateDailyHandler } from "./generateDaily.js";

export const handler = async (event, context) => {
  return generateDailyHandler(event, context);
};
