/**
 * CLI Benchmark Runner
 *
 * Usage: bun run index.ts [benchmark-id] [model-id]
 *
 * Environment variables:
 *   OPENROUTER_API_KEY - Required. Get your key at https://openrouter.ai/keys
 *
 * Examples:
 *   bun run index.ts fnaf
 *   bun run index.ts fnaf anthropic/claude-3.5-sonnet
 *   bun run index.ts fnaf openai/gpt-4o
 */
import { loadDataset, listBenchmarks } from "./src/data.ts";
import { runBenchmark } from "./src/runner.ts";
import { saveResults, printSummary } from "./src/report.ts";
import { DEFAULT_MODEL, DEFAULT_JUDGE } from "./src/clients.ts";
import type { ModelConfig } from "./src/types.ts";

async function main() {
  console.log("🎯 Benchmark Runner CLI\n");

  // Check for API key early
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ Error: OPENROUTER_API_KEY environment variable is required.");
    console.error("   Get your API key at https://openrouter.ai/keys");
    console.error("\n   Set it in your .env file or run with:");
    console.error("   OPENROUTER_API_KEY=your-key bun run index.ts <benchmark>");
    process.exit(1);
  }

  // Parse command line args
  const benchmarkId = process.argv[2];
  const modelArg = process.argv[3];

  if (!benchmarkId) {
    console.log("Available benchmarks:\n");
    const benchmarks = await listBenchmarks();
    for (const b of benchmarks) {
      console.log(`  ${b.id} - ${b.name} (${b.questionCount} questions)`);
    }
    console.log("\nUsage: bun run index.ts <benchmark-id> [model-id]");
    process.exit(0);
  }

  const model: ModelConfig = modelArg
    ? { id: modelArg, name: modelArg }
    : DEFAULT_MODEL;

  try {
    // Load benchmark data
    const items = await loadDataset(benchmarkId);

    // Run the benchmark
    const output = await runBenchmark(items, model, DEFAULT_JUDGE);

    // Save and display results
    await saveResults(output);
    printSummary(output);

    console.log("\n✅ Benchmark complete!");
  } catch (error) {
    console.error("\n❌ Benchmark failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
