/**
 * Persistence and reporting for benchmark results
 */
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { RunOutput, SavedResult } from "./types.ts";

export const RESULTS_DIR = "results";

/** Ensure the results directory exists */
async function ensureResultsDir(): Promise<void> {
  try {
    await mkdir(path.join(process.cwd(), RESULTS_DIR), { recursive: true });
  } catch {
    // Directory likely already exists
  }
}

/** Generate a filename for the results */
function generateFilename(output: RunOutput, benchmarkId?: string): string {
  const benchmarkSlug = benchmarkId ?? "unknown";
  const modelSlug = output.summary.model.id.replace(/\//g, "-");
  const timestamp = output.summary.timestamp.replace(/[:.]/g, "-");
  return `${benchmarkSlug}_${modelSlug}_${timestamp}.json`;
}

/** Save run results to a JSON file */
export async function saveResults(
  output: RunOutput & { benchmarkId?: string },
  benchmarkId?: string
): Promise<string> {
  await ensureResultsDir();

  const filename = generateFilename(output, benchmarkId ?? output.benchmarkId);

  // Include benchmarkId in the saved output
  const outputToSave = {
    ...output,
    benchmarkId: benchmarkId ?? output.benchmarkId ?? "unknown",
  };

  const json = JSON.stringify(outputToSave, null, 2);
  const abs = path.join(process.cwd(), RESULTS_DIR, filename);
  await writeFile(abs, json, "utf-8");

  console.log(`\n📁 Results saved to ${path.join(RESULTS_DIR, filename)}`);

  return filename;
}

/** Save multi-run results (multiple models in one file) */
export async function saveMultiRunResults(
  runs: RunOutput[],
  benchmarkId: string,
  benchmarkName: string,
  judge: { id: string; name: string }
): Promise<string> {
  await ensureResultsDir();

  const timestamp = new Date().toISOString();
  const modelCount = runs.length;
  const timestampSlug = timestamp.replace(/[:.]/g, "-");
  const filename = `${benchmarkId}_${modelCount}models_${timestampSlug}.json`;

  const multiOutput = {
    kind: "multi" as const,
    benchmarkId,
    benchmarkName,
    judge,
    timestamp,
    runs: runs.map((run) => ({
      ...run,
      summary: {
        ...run.summary,
        benchmarkId,
        benchmarkName,
      },
    })),
  };

  const json = JSON.stringify(multiOutput, null, 2);
  const abs = path.join(process.cwd(), RESULTS_DIR, filename);
  await writeFile(abs, json, "utf-8");

  console.log(`\n📁 Multi-run results saved to ${path.join(RESULTS_DIR, filename)}`);

  return filename;
}

/** List saved result files (newest first) with parsed data */
export async function listResults(): Promise<{ filename: string; output: SavedResult }[]> {
  const dirAbs = path.join(process.cwd(), RESULTS_DIR);
  try {
    const entries = await readdir(dirAbs, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => e.name)
      .sort()
      .reverse();

    const outputs: { filename: string; output: SavedResult }[] = [];
    for (const filename of files) {
      try {
        const raw: unknown = JSON.parse(
          await readFile(path.join(dirAbs, filename), "utf8")
        );
        if (typeof raw === "object" && raw !== null) {
          outputs.push({ filename, output: raw as SavedResult });
        }
      } catch {
        // ignore malformed files
      }
    }

    return outputs;
  } catch {
    return [];
  }
}

/** Load a specific result output by filename */
export async function loadResult(filename: string): Promise<SavedResult> {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error("Invalid result filename");
  }
  const safe = path.basename(filename);
  if (!safe.endsWith(".json")) throw new Error("Invalid result filename");

  const abs = path.join(process.cwd(), RESULTS_DIR, safe);
  const raw: unknown = JSON.parse(await readFile(abs, "utf8"));
  return raw as SavedResult;
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
