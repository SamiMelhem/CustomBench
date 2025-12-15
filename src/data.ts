/**
 * Load and validate benchmark datasets
 */
import { readdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { QADataset, BenchmarkItem, DatasetConfig, BenchmarkListing } from "./types.ts";

const BENCHMARKS_DIR = "benchmarks";
const UPLOADS_DIR = "uploads";

/** Check if a file exists */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Read and parse a JSON file */
async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as T;
}

/** List all available benchmarks from both benchmarks/ and uploads/ directories */
export async function listBenchmarks(): Promise<BenchmarkListing[]> {
  const benchmarks: BenchmarkListing[] = [];

  // Load built-in benchmarks
  const builtinBenchmarks = await loadBenchmarksFromDir(BENCHMARKS_DIR, "builtin");
  benchmarks.push(...builtinBenchmarks);

  // Load uploaded benchmarks (if directory exists)
  try {
    const uploadedBenchmarks = await loadBenchmarksFromDir(UPLOADS_DIR, "uploaded");
    benchmarks.push(...uploadedBenchmarks);
  } catch {
    // uploads directory may not exist yet
  }

  return benchmarks;
}

/** Load benchmarks from a directory */
async function loadBenchmarksFromDir(
  dir: string,
  source: "builtin" | "uploaded"
): Promise<BenchmarkListing[]> {
  const benchmarks: BenchmarkListing[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const benchmarkId = entry.name;
      const benchmarkPath = join(dir, benchmarkId);

      try {
        const info = await loadBenchmarkInfo(benchmarkId, benchmarkPath, source);
        if (info) {
          benchmarks.push(info);
        }
      } catch (error) {
        console.warn(`Warning: Could not load benchmark ${benchmarkId}:`, error);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return benchmarks;
}

/** Load benchmark info (config + question count) */
async function loadBenchmarkInfo(
  id: string,
  path: string,
  defaultSource: "builtin" | "uploaded"
): Promise<BenchmarkListing | null> {
  const configPath = join(path, "config.json");
  const qaPath = join(path, "qa.json");

  // Check if files exist
  if (!(await fileExists(configPath)) || !(await fileExists(qaPath))) {
    return null;
  }

  const config = await readJsonFile<DatasetConfig>(configPath);
  const qa = await readJsonFile<QADataset>(qaPath);

  return {
    id,
    name: config.name,
    description: config.description,
    source: config.source ?? defaultSource,
    questionCount: qa.questions.length,
  };
}

/** Load and validate a specific benchmark dataset */
export async function loadDataset(benchmarkId: string): Promise<BenchmarkItem[]> {
  // Try benchmarks directory first, then uploads
  let qaPath = join(BENCHMARKS_DIR, benchmarkId, "qa.json");

  if (!(await fileExists(qaPath))) {
    qaPath = join(UPLOADS_DIR, benchmarkId, "qa.json");
  }

  if (!(await fileExists(qaPath))) {
    throw new Error(`Benchmark not found: ${benchmarkId}`);
  }

  const raw: unknown = await readJsonFile(qaPath);

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

  console.log(`✓ Loaded ${items.length} benchmark items from ${qaPath}`);

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

/** Validate a dataset structure (for upload validation) */
export function validateDataset(data: unknown): { valid: boolean; error?: string } {
  if (!isValidDataset(data)) {
    return { valid: false, error: "Invalid format: expected { questions: string[], answers: string[] }" };
  }

  if (data.questions.length !== data.answers.length) {
    return { valid: false, error: `Mismatch: ${data.questions.length} questions but ${data.answers.length} answers` };
  }

  if (data.questions.length === 0) {
    return { valid: false, error: "Dataset is empty" };
  }

  return { valid: true };
}
