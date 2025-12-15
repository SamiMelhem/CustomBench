import Link from "next/link";

import { listBenchmarks } from "../src/data";
import { listResults } from "../src/report";
import type { MultiRunOutput, RunOutput } from "../src/types";
import { BenchmarkCard } from "./components/BenchmarkCard";
import { linkButton, percent, formatBenchmarkName } from "./lib/styles";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [benchmarks, results] = await Promise.all([listBenchmarks(), listResults()]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">Benchmarks</h1>
          <Link href="/upload" className={linkButton}>
            Upload benchmark
          </Link>
        </div>

        {benchmarks.length === 0 ? (
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-sm text-slate-600 dark:border-slate-800/70 dark:bg-slate-950 dark:text-slate-300">
            No benchmarks found. Add a dataset under <code className="font-mono">benchmarks/&lt;id&gt;</code>.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {benchmarks.map((b) => (
              <BenchmarkCard key={b.id} benchmark={b} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">Recent results</h2>
          <Link href="/results" className={linkButton}>
            View all
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-sm text-slate-600 dark:border-slate-800/70 dark:bg-slate-950 dark:text-slate-300">
            No saved results yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70">
            <table className="w-full border-collapse bg-white text-sm dark:bg-slate-950">
              <thead className="bg-slate-50 text-left dark:bg-slate-900/40">
                <tr>
                  <th className="px-4 py-2 font-medium">Benchmark</th>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Accuracy</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map(({ filename, output }) => {
                  const isMulti = (output as MultiRunOutput).kind === "multi";
                  const benchmarkId = isMulti
                    ? (output as MultiRunOutput).benchmarkId
                    : (output as RunOutput & { benchmarkId?: string }).benchmarkId ?? "unknown";
                  
                  return (
                    <tr key={filename} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {formatBenchmarkName(benchmarkId)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {isMulti
                          ? `Multiple models (${(output as MultiRunOutput).runs.length})`
                          : (output as RunOutput).summary.model.name}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {isMulti
                          ? "—"
                          : `${percent((output as RunOutput).summary.accuracy)} (${(output as RunOutput).summary.correctCount}/${(output as RunOutput).summary.totalQuestions})`}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {isMulti
                          ? (output as MultiRunOutput).timestamp
                          : (output as RunOutput).summary.timestamp}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/results/${encodeURIComponent(filename)}`}
                          className={linkButton}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
