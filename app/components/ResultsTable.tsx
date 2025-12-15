"use client";

import { useState } from "react";
import type { ItemResult } from "../../src/types";

export function ResultsTable({ results }: { results: ItemResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="bg-slate-50 text-left dark:bg-slate-900/40">
        <tr>
          <th className="px-4 py-2 font-medium w-12">#</th>
          <th className="px-4 py-2 font-medium">Question</th>
          <th className="px-4 py-2 font-medium w-20 text-center">Verdict</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <ResultRow
            key={r.index}
            result={r}
            isExpanded={expanded === r.index}
            onToggle={() => setExpanded(expanded === r.index ? null : r.index)}
          />
        ))}
      </tbody>
    </table>
  );
}

function ResultRow({
  result,
  isExpanded,
  onToggle,
}: {
  result: ItemResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-t border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {result.index + 1}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className={`transition-transform text-xs ${isExpanded ? "rotate-90" : ""}`}>▶</span>
            <span className="truncate">{result.question}</span>
          </div>
        </td>
        <td className="px-4 py-2 text-center">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
              result.verdict.correct
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            }`}
          >
            {result.verdict.correct ? "✓" : "✗"}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/50 dark:bg-slate-900/20">
          <td colSpan={3} className="px-4 py-4">
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-300">Expected Answer</div>
                <div className="mt-1 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  {result.expectedAnswer}
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-300">Model Answer</div>
                <div className="mt-1 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {result.modelAnswer}
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-300">Judge Rationale</div>
                <div className="mt-1 text-slate-600 dark:text-slate-400 italic">{result.verdict.rationale}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
