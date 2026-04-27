import cron from "node-cron"
import {applyExpirationTags} from "./autoTag"

cron.schedule("0 * * * *", async () => {
    try{
        await applyExpirationTags();
        console.log("[CRON] Expiration tags updated.");
    }catch(e){
        console.error("[CRON] Error updating expiration tags:", e);
    }
})