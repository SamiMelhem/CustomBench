/**
 * Types for the Benchmark Runner
 */

export type DatasetSource = "builtin" | "uploaded";

/** Raw format of the qa.json file */
export interface QADataset {
  questions: string[];
  answers: string[];
}

/** Benchmark config.json format */
export interface DatasetConfig {
  name: string;
  description: string;
  source: DatasetSource;
}

/** Benchmark metadata (config + computed fields) */
export interface BenchmarkListing {
  id: string;
  name: string;
  description: string;
  source: DatasetSource;
  questionCount: number;
}

/** A single benchmark question-answer pair */
export interface BenchmarkItem {
  index: number;
  question: string;
  expectedAnswer: string;
}

/** Model configuration for benchmarking */
export interface ModelConfig {
  id: string;
  name: string;
}

/** Judge verdict for a single answer */
export interface JudgeVerdict {
  correct: boolean;
  rationale: string;
}

/** Result for a single benchmark item */
export interface ItemResult {
  index: number;
  question: string;
  expectedAnswer: string;
  modelAnswer: string;
  verdict: JudgeVerdict;
}

/** Summary statistics for a model run */
export interface RunSummary {
  model: ModelConfig;
  judge: ModelConfig;
  benchmarkId?: string;
  benchmarkName?: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  timestamp: string;
}

/** Complete run output for persistence */
export interface RunOutput {
  summary: RunSummary;
  results: ItemResult[];
}

/** Progress events for SSE streaming */
export interface ProgressEvent {
  type: "start" | "item_complete" | "model_done" | "done" | "error";
  modelId?: string;
  current?: number;
  total?: number;
  result?: ItemResult;
  summary?: RunSummary;
  filename?: string;
  message?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

/** Multi-model run output */
export interface MultiRunOutput {
  kind: "multi";
  benchmarkId: string;
  benchmarkName: string;
  judge: ModelConfig;
  timestamp: string;
  runs: RunOutput[];
}

/** Union type for saved results */
export type SavedResult = RunOutput | MultiRunOutput;
