/**
 * Types for the FNAF QA Benchmark Runner
 */

/** Raw format of the qa.json file */
export interface QADataset {
  questions: string[];
  answers: string[];
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
