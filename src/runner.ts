/**
 * Benchmark runner - ask-and-score loop with error handling
 */
import type { BenchmarkItem, ItemResult, ModelConfig, RunOutput, RunSummary } from "./types.ts";
import { askModel, judgeAnswer, DEFAULT_MODEL, DEFAULT_JUDGE } from "./clients.ts";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/** Progress event types for SSE streaming */
export type ProgressEvent =
  | { type: "start"; total: number }
  | { type: "item_complete"; current: number; total: number; result: ItemResult }
  | { type: "done"; summary: RunSummary };

/** Progress callback function type */
export type ProgressCallback = (event: ProgressEvent) => void;

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run a single benchmark item with retries */
async function runItem(
  item: BenchmarkItem,
  modelConfig: ModelConfig,
  judgeConfig: ModelConfig
): Promise<ItemResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Get model's answer
      const modelAnswer = await askModel(item.question, modelConfig);

      // Have the judge evaluate
      const verdict = await judgeAnswer(
        item.question,
        item.expectedAnswer,
        modelAnswer,
        judgeConfig
      );

      return {
        index: item.index,
        question: item.question,
        expectedAnswer: item.expectedAnswer,
        modelAnswer,
        verdict,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `⚠ Attempt ${attempt}/${MAX_RETRIES} failed for Q${item.index + 1}: ${lastError.message}`
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  // All retries exhausted - return a failed result
  return {
    index: item.index,
    question: item.question,
    expectedAnswer: item.expectedAnswer,
    modelAnswer: `[ERROR: ${lastError?.message ?? "Unknown error"}]`,
    verdict: {
      correct: false,
      rationale: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    },
  };
}

/** Run the full benchmark */
export async function runBenchmark(
  items: BenchmarkItem[],
  modelConfig: ModelConfig = DEFAULT_MODEL,
  judgeConfig: ModelConfig = DEFAULT_JUDGE,
  onProgress?: ProgressCallback
): Promise<RunOutput> {
  console.log(`\n🚀 Starting benchmark run`);
  console.log(`   Model: ${modelConfig.name} (${modelConfig.id})`);
  console.log(`   Judge: ${judgeConfig.name} (${judgeConfig.id})`);
  console.log(`   Questions: ${items.length}\n`);

  // Emit start event
  onProgress?.({ type: "start", total: items.length });

  const results: ItemResult[] = [];
  let correctCount = 0;

  for (const item of items) {
    process.stdout.write(`[${item.index + 1}/${items.length}] ${item.question.slice(0, 50)}... `);

    const result = await runItem(item, modelConfig, judgeConfig);
    results.push(result);

    if (result.verdict.correct) {
      correctCount++;
      console.log("✓");
    } else {
      console.log("✗");
    }

    // Emit item complete event
    onProgress?.({
      type: "item_complete",
      current: item.index + 1,
      total: items.length,
      result,
    });
  }

  const summary: RunSummary = {
    model: modelConfig,
    judge: judgeConfig,
    totalQuestions: items.length,
    correctCount,
    accuracy: correctCount / items.length,
    timestamp: new Date().toISOString(),
  };

  // Emit done event
  onProgress?.({ type: "done", summary });

  return { summary, results };
}
