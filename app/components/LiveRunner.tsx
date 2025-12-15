"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ItemResult, RunSummary, RunOutput } from "../../src/types";
import { percent, card, linkButton, getAccuracyColor } from "../lib/styles";
import { ProgressBar } from "./ProgressBar";
import { ResultsTable } from "./ResultsTable";

interface LiveRunnerProps {
  benchmarkId: string;
  modelId: string;
  modelName: string;
  judgeId?: string;
  judgeName?: string;
  onComplete?: (output: RunOutput) => void;
  autoStart?: boolean;
}

type RunState = "idle" | "running" | "completed" | "error" | "cancelled";

const MAX_RUN_TIME_MS = 30 * 60 * 1000; // 30 minutes timeout

export function LiveRunner({
  benchmarkId,
  modelId,
  modelName,
  judgeId = "openai/gpt-4o-mini",
  judgeName = "GPT-4o Mini",
  onComplete,
  autoStart = false,
}: LiveRunnerProps) {
  const [state, setState] = useState<RunState>("idle");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const runIdRef = useRef(0);

  const stopRun = useCallback((userInitiated = true) => {
    // Increment run ID to invalidate any in-flight requests
    runIdRef.current++;

    // Cancel the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only set cancelled state if user-initiated
    if (userInitiated) {
      setState("cancelled");
    }
  }, []);

  const startRun = useCallback(async () => {
    // Increment run ID for this new run
    const thisRunId = ++runIdRef.current;

    setState("running");
    setResults([]);
    setCurrent(0);
    setTotal(0);
    setSummary(null);
    setError(null);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set timeout to prevent infinite runs
    timeoutRef.current = setTimeout(() => {
      if (runIdRef.current === thisRunId) {
        abortController.abort();
        setError("Benchmark run timed out after 30 minutes");
        setState("error");
      }
    }, MAX_RUN_TIME_MS);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benchmarkId, modelId, modelName, judgeId, judgeName }),
        signal: abortController.signal,
      });

      // Check if this run is still valid
      if (runIdRef.current !== thisRunId) return;

      if (!response.ok) {
        throw new Error(`Failed to start benchmark: ${response.status}`);
      }
      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if this run is still valid
        if (runIdRef.current !== thisRunId) return;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "start") {
              setTotal(event.total);
            }
            if (event.type === "item_complete") {
              setCurrent(event.current);
              setResults((prev) => {
                // Prevent duplicate results by checking index
                const exists = prev.some((r) => r.index === event.result.index);
                if (exists) return prev;
                return [...prev, event.result];
              });
            }
            if (event.type === "done") {
              setSummary(event.summary);
              // Don't set completed yet - wait for run_complete
            }
            if (event.type === "run_complete") {
              // Full output received - mark as completed and notify parent
              setSummary(event.output.summary);
              setResults(event.output.results);
              setState("completed");
              onComplete?.(event.output);
              // Clear timeout on completion
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }
            if (event.type === "error") {
              setError(event.error);
              setState("error");
              // Clear timeout on error
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      // Only update state if this run is still the current one
      if (runIdRef.current === thisRunId) {
        if (err instanceof Error && err.name === "AbortError") {
          // AbortError from user cancel is already handled in stopRun
          // This only triggers for timeout or other aborts
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
          setState("error");
        }
      }
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } finally {
      if (runIdRef.current === thisRunId) {
        abortControllerRef.current = null;
      }
    }
  }, [benchmarkId, modelId, modelName, judgeId, judgeName, onComplete]);

  // Auto-start on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startRun();
    }
    // Cleanup on unmount
    return () => {
      stopRun(false); // false = not user initiated, just cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="space-y-4">
      {state === "running" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ProgressBar current={current} total={total} />
            <button onClick={() => stopRun(true)} className={`ml-3 ${linkButton}`}>
              Stop
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Running {modelName}... ({current}/{total})
          </p>
        </div>
      )}

      {state === "idle" && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Waiting to start...
        </div>
      )}

      {state === "cancelled" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-900/60 dark:bg-yellow-950/40">
          <span className="text-yellow-800 dark:text-yellow-200">Run cancelled</span>
          <button
            onClick={startRun}
            className="ml-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 underline"
          >
            Restart
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm dark:border-rose-900/60 dark:bg-rose-950/40">
          <span className="text-rose-800 dark:text-rose-200">Error: {error}</span>
          <button
            onClick={startRun}
            className="ml-2 text-rose-600 hover:text-rose-800 dark:text-rose-400 underline"
          >
            Retry
          </button>
        </div>
      )}

      {summary && (
        <div className={card}>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Completed</div>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {summary.correctCount}/{summary.totalQuestions}
            </span>
            <span className={`font-semibold ${getAccuracyColor(summary.accuracy)}`}>
              {percent(summary.accuracy)}
            </span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={`${card} !p-0 overflow-hidden`}>
          <div className="px-4 py-2 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-sm font-medium">Results ({results.length})</span>
          </div>
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  );
}
