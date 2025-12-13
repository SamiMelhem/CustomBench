/**
 * Persistence and reporting for benchmark results
 */
import type { RunOutput } from "./types.ts";

const RESULTS_DIR = "results";

/** Ensure the results directory exists */
async function ensureResultsDir(): Promise<void> {
  const dir = Bun.file(RESULTS_DIR);
  try {
    await Bun.$`mkdir -p ${RESULTS_DIR}`;
  } catch {
    // Directory likely already exists
  }
}

/** Generate a filename for the results */
function generateFilename(output: RunOutput): string {
  const modelSlug = output.summary.model.id.replace(/\//g, "-");
  const timestamp = output.summary.timestamp.replace(/[:.]/g, "-");
  return `${RESULTS_DIR}/${modelSlug}_${timestamp}.json`;
}

/** Save run results to a JSON file */
export async function saveResults(output: RunOutput): Promise<string> {
  await ensureResultsDir();

  const filename = generateFilename(output);
  const json = JSON.stringify(output, null, 2);

  await Bun.write(filename, json);

  console.log(`\n📁 Results saved to ${filename}`);

  return filename;
}

/** Print a console summary of the run */
export function printSummary(output: RunOutput): void {
  const { summary, results } = output;
  const accuracyPercent = (summary.accuracy * 100).toFixed(1);

  console.log("\n" + "═".repeat(60));
  console.log("                    BENCHMARK SUMMARY");
  console.log("═".repeat(60));
  console.log(`  Model:     ${summary.model.name}`);
  console.log(`  Judge:     ${summary.judge.name}`);
  console.log(`  Timestamp: ${summary.timestamp}`);
  console.log("─".repeat(60));
  console.log(`  Total Questions: ${summary.totalQuestions}`);
  console.log(`  Correct:         ${summary.correctCount}`);
  console.log(`  Incorrect:       ${summary.totalQuestions - summary.correctCount}`);
  console.log(`  Accuracy:        ${accuracyPercent}%`);
  console.log("═".repeat(60));

  // Show incorrect answers for review
  const incorrect = results.filter((r) => !r.verdict.correct);
  if (incorrect.length > 0 && incorrect.length <= 10) {
    console.log("\n📋 Incorrect Answers:");
    for (const r of incorrect) {
      console.log(`\n  Q${r.index + 1}: ${r.question}`);
      console.log(`    Expected: ${r.expectedAnswer}`);
      console.log(`    Got:      ${r.modelAnswer.slice(0, 100)}${r.modelAnswer.length > 100 ? "..." : ""}`);
      console.log(`    Reason:   ${r.verdict.rationale}`);
    }
  }
}
