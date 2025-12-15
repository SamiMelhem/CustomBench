"use client";

import { useState, useCallback, useEffect } from "react";
import type { ItemResult, RunSummary } from "../../src/types";
import { percent } from "../lib/styles";
import { ProgressBar } from "./ProgressBar";
import { ResultsTable } from "./ResultsTable";

interface LiveRunnerProps {
  benchmarkId: string;
  modelId: string;
  modelName: string;
  judgeId?: string;
  judgeName?: string;
  onComplete?: (summary: RunSummary) => void;
}

type RunState = "idle" | "running" | "completed" | "error";

export function LiveRunner({
  benchmarkId,
  modelId,
  modelName,
  judgeId = "openai/gpt-4o-mini",
  judgeName = "GPT-4o Mini",
  onComplete,
}: LiveRunnerProps) {
  const [state, setState] = useState<RunState>("idle");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRun = useCallback(async () => {
    setState("running");
    setResults([]);
    setCurrent(0);
    setTotal(0);
    setSummary(null);
    setError(null);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benchmarkId, modelId, modelName, judgeId, judgeName }),
      });

      if (!response.ok) throw new Error("Failed to start benchmark");
      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "start") setTotal(event.total);
            if (event.type === "item_complete") {
              setCurrent(event.current);
              setResults((prev) => [...prev, event.result]);
            }
            if (event.type === "done") {
              setSummary(event.summary);
              setState("completed");
              onComplete?.(event.summary);
            }
            if (event.type === "error") {
              setError(event.error);
              setState("error");
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }, [benchmarkId, modelId, modelName, judgeId, judgeName, onComplete]);

  useEffect(() => {
    startRun();
  }, [startRun]);

  return (
    <div className="space-y-4">
      {state === "running" && (
        <div className="space-y-2">
          <ProgressBar current={current} total={total} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Running {modelName}...
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm dark:border-rose-900/60 dark:bg-rose-950/40">
          <span className="text-rose-800 dark:text-rose-200">Error: {error}</span>
          <button
            onClick={() => void startRun()}
            className="ml-2 text-rose-600 hover:text-rose-800 dark:text-rose-400 underline"
          >
            Retry
          </button>
        </div>
      )}

      {summary && (
        <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Completed</div>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {summary.correctCount}/{summary.totalQuestions}
            </span>
            <span
              className={`font-semibold ${
                summary.accuracy >= 0.8
                  ? "text-emerald-600 dark:text-emerald-400"
                  : summary.accuracy >= 0.5
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {percent(summary.accuracy)}
            </span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-slate-950 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-sm font-medium">Results ({results.length})</span>
          </div>
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  );
}
