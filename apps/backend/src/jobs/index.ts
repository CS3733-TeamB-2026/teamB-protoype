import cron from "node-cron"
import {applyExpirationTagsToAll} from "./autoTag"

cron.schedule("0 * * * *", async () => {
    try{
        await applyExpirationTagsToAll();
        console.log("[CRON] Expiration tags updated.");
    }catch(e){
        console.error("[CRON] Error updating expiration tags:", e);
    }
})