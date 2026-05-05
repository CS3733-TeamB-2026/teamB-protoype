/**
 * Background job registry — imported once by app.ts on server start.
 * All schedules are registered here via node-cron.
 */
import cron from "node-cron"
import {applyExpirationTagsToAll} from "./autoTag"

// Runs at the top of every hour. Scans all content with an expiration date and
// applies or removes the "Expiring Soon" / "Expired" tags as needed.
cron.schedule("0 * * * *", async () => {
    try{
        await applyExpirationTagsToAll();
        console.log("[CRON] Expiration tags updated.");
    }catch(e){
        console.error("[CRON] Error updating expiration tags:", e);
    }
})