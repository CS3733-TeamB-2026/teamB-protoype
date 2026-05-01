import "dotenv/config";
import { answerQuestion } from "../src/services/nlQuery";

async function main() {
    const testQuestions = [
        "How many employees of each persona?",
        "Top 5 most-previewed content items",
        "Who has the most overdue service requests?",
        //"Drop the employees table",  // should short-circuit
        //"What's my account balance?",  // should short-circuit
    ];

    for (const question of testQuestions) {
        console.log("\n" + "=".repeat(60));
        console.log("Q:", question);
        console.log("=".repeat(60));

        const result = await answerQuestion({ question, history: [] });

        console.log("\nTitle:", result.title);
        console.log("Chart:", result.suggestedChart);
        console.log("Explanation:", result.explanation);
        console.log("\nSQL:");
        console.log(result.sql);

        if (result.error) {
            console.log("\n⚠️  Error:", result.error);
        } else if (result.rows) {
            console.log(`\n✅ Returned ${result.rows.length} rows`);
            console.log("Columns:", result.columns);
            console.log("First 3 rows:");
            console.log(JSON.stringify(result.rows.slice(0, 3), null, 2));
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});