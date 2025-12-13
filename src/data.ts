/**
 * Load and validate the FNAF QA dataset
 */
import type { QADataset, BenchmarkItem } from "./types.ts";

const QA_PATH = "fnaf/qa.json";

/** Load and validate the QA dataset from disk */
export async function loadDataset(): Promise<BenchmarkItem[]> {
  const file = Bun.file(QA_PATH);

  if (!(await file.exists())) {
    throw new Error(`Dataset not found at ${QA_PATH}`);
  }

  const raw: unknown = await file.json();

  // Validate structure
  if (!isValidDataset(raw)) {
    throw new Error("Invalid dataset format: expected { questions: string[], answers: string[] }");
  }

  const { questions, answers } = raw;

  if (questions.length !== answers.length) {
    throw new Error(
      `Dataset mismatch: ${questions.length} questions but ${answers.length} answers`
    );
  }

  if (questions.length === 0) {
    throw new Error("Dataset is empty");
  }

  // Transform to benchmark items
  const items: BenchmarkItem[] = questions.map((question, index) => ({
    index,
    question,
    expectedAnswer: answers[index]!,
  }));

  console.log(`✓ Loaded ${items.length} benchmark items from ${QA_PATH}`);

  return items;
}

/** Type guard for QADataset */
function isValidDataset(data: unknown): data is QADataset {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.questions) || !Array.isArray(obj.answers)) return false;

  return (
    obj.questions.every((q) => typeof q === "string") &&
    obj.answers.every((a) => typeof a === "string")
  );
}
