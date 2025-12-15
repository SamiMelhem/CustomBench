"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

import type { BenchmarkListing, ModelConfig, RunOutput } from "../../src/types";
import { linkButton, primaryButton, secondaryButton, card, inputField } from "../lib/styles";
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
  const [runKey, setRunKey] = useState(0); // Used to force fresh LiveRunner instances
  const [collectedOutputs, setCollectedOutputs] = useState<RunOutput[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const expectedRunsRef = useRef(0);
  const hasSavedRef = useRef(false); // Prevent duplicate saves

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

  // Save results when all runs complete (only once)
  const saveResults = useCallback(async (outputs: RunOutput[]) => {
    // Guard against duplicate saves
    if (outputs.length === 0 || hasSavedRef.current) return;
    hasSavedRef.current = true;

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/save-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runs: outputs,
          benchmarkId,
          benchmarkName: selectedBenchmark?.name || benchmarkId,
          judge: {
            id: judgeId,
            name: getModelName(judgeId, models),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save results");
      }

      setSaveStatus("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setSaveStatus("error");
      hasSavedRef.current = false; // Allow retry on error
    }
  }, [benchmarkId, selectedBenchmark, judgeId, models]);

  // Handle run completion
  const handleRunComplete = useCallback((output: RunOutput) => {
    setCollectedOutputs((prev) => {
      const newOutputs = [...prev, output];
      
      // Check if all runs are complete
      if (newOutputs.length >= expectedRunsRef.current) {
        // All runs done - save results
        saveResults(newOutputs);
      }
      
      return newOutputs;
    });
    setCompletedRuns((n) => n + 1);
  }, [saveResults]);

  function handleStart() {
    if (!benchmarkId || selectedModels.length === 0) return;
    // Blur any focused element to close dropdowns
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const configs = selectedModels.map((mid) => ({
      benchmarkId,
      modelId: mid,
      judgeId,
    }));
    setRunConfigs(configs);
    setCompletedRuns(0);
    setCollectedOutputs([]);
    setSaveStatus("idle");
    setSaveError(null);
    expectedRunsRef.current = configs.length;
    hasSavedRef.current = false; // Reset save guard for new run
    setRunKey((k) => k + 1); // Force fresh LiveRunner instances
    setIsRunning(true);
  }

  const allDone = completedRuns >= runConfigs.length && runConfigs.length > 0;

  function handleReset() {
    setIsRunning(false);
    setRunConfigs([]);
    setCompletedRuns(0);
    setCollectedOutputs([]);
    setSaveStatus("idle");
    setSaveError(null);
    hasSavedRef.current = false;
  }

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
          Upload custom benchmark
        </Link>
      </div>

      <div className={`${card} space-y-4`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Benchmark */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Benchmark</label>
            <select
              className={inputField}
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
          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/60 dark:bg-blue-950/40">
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  Saving results...
                </span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                  ✓ All {runConfigs.length} run{runConfigs.length > 1 ? "s" : ""} completed & saved!
                </span>
                <Link href="/results" className="ml-3 text-emerald-600 hover:underline dark:text-emerald-400">
                  View results →
                </Link>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/60 dark:bg-rose-950/40">
                <span className="text-rose-800 dark:text-rose-200 font-medium">
                  ✓ Runs completed, but failed to save: {saveError}
                </span>
              </div>
            )}
            <button onClick={handleReset} className={secondaryButton}>
              New Run
            </button>
          </div>
        )}

        {isRunning && !allDone && (
          <button onClick={handleReset} className={secondaryButton}>
            Cancel & Reset
          </button>
        )}
      </div>

      {/* Running benchmarks */}
      {isRunning && runConfigs.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium">
            Running {runConfigs.length} model{runConfigs.length > 1 ? "s" : ""} ({completedRuns}/
            {runConfigs.length} done)
          </div>
          {runConfigs.map((cfg, idx) => (
            <div
              key={`${runKey}-${cfg.modelId}-${idx}`}
              className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950"
            >
              <div className="text-sm font-medium mb-3">{getModelName(cfg.modelId, models)}</div>
              <LiveRunner
                key={`runner-${runKey}-${cfg.modelId}-${idx}`}
                benchmarkId={cfg.benchmarkId}
                modelId={cfg.modelId}
                modelName={getModelName(cfg.modelId, models)}
                judgeId={cfg.judgeId}
                judgeName={getModelName(cfg.judgeId, models)}
                onComplete={handleRunComplete}
                autoStart={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
