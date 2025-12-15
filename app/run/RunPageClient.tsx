"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { BenchmarkListing, ModelConfig } from "../../src/types";
import { linkButton, primaryButton } from "../lib/styles";
import { ModelSelector, getModelName } from "../components/ModelSelector";
import { LiveRunner } from "../components/LiveRunner";

interface RunPageClientProps {
  benchmarks: BenchmarkListing[];
  initialBenchmarkId: string;
  defaultModels: ModelConfig[];
}

interface RunConfig {
  benchmarkId: string;
  modelId: string;
  judgeId: string;
}

export function RunPageClient({ benchmarks, initialBenchmarkId, defaultModels }: RunPageClientProps) {
  const [models, setModels] = useState<ModelConfig[]>(defaultModels);
  const [benchmarkId, setBenchmarkId] = useState(initialBenchmarkId || benchmarks[0]?.id || "");
  const [selectedModels, setSelectedModels] = useState<string[]>(["anthropic/claude-3.5-sonnet"]);
  const [judgeId, setJudgeId] = useState("openai/gpt-4o-mini");

  const [isRunning, setIsRunning] = useState(false);
  const [runConfigs, setRunConfigs] = useState<RunConfig[]>([]);
  const [completedRuns, setCompletedRuns] = useState(0);

  // Fetch full model list in background
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const ids = new Set(defaultModels.map((m) => m.id));
          const extra = data.filter((m: ModelConfig) => !ids.has(m.id));
          setModels([...defaultModels, ...extra]);
        }
      })
      .catch(() => {});
  }, [defaultModels]);

  const selectedBenchmark = benchmarks.find((b) => b.id === benchmarkId);

  function handleStart() {
    if (!benchmarkId || selectedModels.length === 0) return;
    const configs = selectedModels.map((mid) => ({
      benchmarkId,
      modelId: mid,
      judgeId,
    }));
    setRunConfigs(configs);
    setCompletedRuns(0);
    setIsRunning(true);
  }

  const allDone = completedRuns >= runConfigs.length && runConfigs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Run benchmark</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Streams live progress while the runner evaluates each item.
          </p>
        </div>
        <Link href="/upload" className={linkButton}>
          Upload benchmark
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Benchmark */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Benchmark</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={benchmarkId}
              onChange={(e) => setBenchmarkId(e.target.value)}
              disabled={isRunning}
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.questionCount})
                </option>
              ))}
            </select>
            {selectedBenchmark && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedBenchmark.description}</p>
            )}
          </div>

          {/* Models to test */}
          <div className={isRunning ? "opacity-50 pointer-events-none" : ""}>
            <ModelSelector
              value={selectedModels}
              onChange={(v) => setSelectedModels(v as string[])}
              multiple
              allowDuplicates
              label="Test Models"
              models={models}
            />
          </div>

          {/* Judge */}
          <div className={isRunning ? "opacity-50 pointer-events-none" : ""}>
            <ModelSelector
              value={judgeId}
              onChange={(v) => setJudgeId(v as string)}
              label="Judge Model"
              models={models}
            />
          </div>
        </div>

        {!isRunning && (
          <button
            className={primaryButton}
            onClick={handleStart}
            disabled={!benchmarkId || selectedModels.length === 0}
          >
            Start{selectedModels.length > 1 ? ` (${selectedModels.length} models)` : ""}
          </button>
        )}

        {allDone && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <span className="text-emerald-800 dark:text-emerald-200 font-medium">
              ✓ All {runConfigs.length} run{runConfigs.length > 1 ? "s" : ""} completed!
            </span>
            <Link href="/results" className="ml-3 text-emerald-600 hover:underline dark:text-emerald-400">
              View results →
            </Link>
          </div>
        )}
      </div>

      {/* Running benchmarks */}
      {isRunning && runConfigs.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium">
            Running {runConfigs.length} benchmark{runConfigs.length > 1 ? "s" : ""} ({completedRuns}/
            {runConfigs.length} done)
          </div>
          {runConfigs.map((cfg, idx) => (
            <div
              key={`${cfg.modelId}-${idx}`}
              className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950"
            >
              <div className="text-sm font-medium mb-3">{getModelName(cfg.modelId, models)}</div>
              <LiveRunner
                benchmarkId={cfg.benchmarkId}
                modelId={cfg.modelId}
                modelName={getModelName(cfg.modelId, models)}
                judgeId={cfg.judgeId}
                judgeName={getModelName(cfg.judgeId, models)}
                onComplete={() => setCompletedRuns((n) => n + 1)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
