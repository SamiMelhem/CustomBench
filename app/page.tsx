import Link from "next/link";

import { listBenchmarks } from "../src/data";
import { listResults } from "../src/report";
import type { MultiRunOutput, RunOutput } from "../src/types";
import { BenchmarkCard } from "./components/BenchmarkCard";
import {
  linkButton,
  primaryButton,
  card,
  badge,
  percent,
  formatBenchmarkName,
  formatDate,
  getAccuracyColor,
} from "./lib/styles";

export const dynamic = "force-dynamic";

/** Extract display info from a result output */
function getResultInfo(output: RunOutput | MultiRunOutput) {
  const isMulti = "kind" in output && output.kind === "multi";

  if (isMulti) {
    const multi = output as MultiRunOutput;
    const bestAccuracy = Math.max(...multi.runs.map((r) => r.summary.accuracy));
    return {
      benchmarkId: multi.benchmarkId,
      modelDisplay: `${multi.runs.length} models tested`,
      bestAccuracy,
      timestamp: multi.timestamp,
    };
  }

  const single = output as RunOutput & { benchmarkId?: string };
  return {
    benchmarkId: single.benchmarkId ?? "unknown",
    modelDisplay: single.summary.model.name,
    bestAccuracy: single.summary.accuracy,
    timestamp: single.summary.timestamp,
  };
}

export default async function DashboardPage() {
  const [benchmarks, results] = await Promise.all([listBenchmarks(), listResults()]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">Benchmarks</h1>
          <Link href="/upload" className={linkButton}>
            Upload custom benchmark
          </Link>
        </div>

        {benchmarks.length === 0 ? (
          <div className={`${card} text-sm text-slate-600 dark:text-slate-300`}>
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
          <Link href="/results" className={primaryButton}>
            View all results
          </Link>
        </div>

        {results.length === 0 ? (
          <div className={`${card} text-sm text-slate-600 dark:text-slate-300`}>
            No saved results yet. Run a benchmark to see your results here.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70">
              <table className="w-full border-collapse bg-white text-sm dark:bg-slate-950">
                <thead className="bg-slate-50 text-left dark:bg-slate-900/40">
                  <tr>
                    <th className="px-4 py-2 font-medium">Benchmark</th>
                    <th className="px-4 py-2 font-medium">Models</th>
                    <th className="px-4 py-2 font-medium">Best Accuracy</th>
                    <th className="px-4 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 5).map(({ filename, output }) => {
                    const info = getResultInfo(output);
                    return (
                      <tr key={filename} className="border-t border-slate-200/70 dark:border-slate-800/70">
                        <td className="px-4 py-3">
                          <span className={badge.blue}>{formatBenchmarkName(info.benchmarkId)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{info.modelDisplay}</td>
                        <td className={`px-4 py-3 tabular-nums font-semibold ${getAccuracyColor(info.bestAccuracy)}`}>
                          {percent(info.bestAccuracy)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(info.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {results.length > 5 && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Showing 5 of {results.length} results.{" "}
                <Link href="/results" className="text-sky-600 hover:underline dark:text-sky-400 font-medium">
                  View all →
                </Link>
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
