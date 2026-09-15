// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate a fresh digest every day at 01:00 SAST (23:00 UTC).
// The /news page will keep showing the previous day's run until this fires.
crons.daily(
  "generate daily news at 1am",
  {
    hourUTC: 23, // 23:00 UTC = 01:00 SAST
    minuteUTC: 0,
  },
  internal.newsCron.triggerDailyGeneration,
);

export default crons;
