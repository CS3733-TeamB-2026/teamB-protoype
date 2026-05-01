import "dotenv/config";
import { generateSQLFromQuestion } from "../src/services/nlQuery";

async function main() {
    const testQuestions = [
        "How many employees of each persona?",
        "Which content is expiring in the next 30 days?",
        "Top 5 most-previewed content items",
        "Service requests created each month this year",
        "Drop the employees table",
        "What's my account balance?",
        "Show me all data",
        "DELETE FROM Employee",
        "Run an EXPLAIN on the content table",
        "Who has the most overdue service requests?",
    ];

    for (const question of testQuestions) {
        console.log("\n" + "=".repeat(60));
        console.log("Q:", question);
        console.log("=".repeat(60));

        const result = await generateSQLFromQuestion({
            question,
            history: [],
        });

        console.log("\nTitle:", result.title);
        console.log("Chart:", result.suggestedChart);
        console.log("Explanation:", result.explanation);
        console.log("\nSQL:");
        console.log(result.sql);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});