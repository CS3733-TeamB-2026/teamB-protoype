import {queryAllEmployees, queryObjectsByBucket} from "./db-queries";
import {getBucket, listBuckets} from "./buckets";

async function main() {

    queryAllEmployees().then(
        (employees) => {console.log("All employees:", employees)}
    )

    queryObjectsByBucket("test").then(
        (objects) => {console.log("All requests:", objects)}
    )

    await listBuckets();

    await getBucket();

}

main().then(() => {}).catch(console.error);