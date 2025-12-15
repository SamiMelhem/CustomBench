import Link from "next/link";
import type { BenchmarkListing } from "../../src/types";

export function BenchmarkCard({ benchmark }: { benchmark: BenchmarkListing }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {benchmark.source === "builtin" ? "Built-in" : "Uploaded"}
          </div>
          <h3 className="mt-1 text-lg font-semibold leading-tight">{benchmark.name}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {benchmark.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold tabular-nums">{benchmark.questionCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">questions</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Link
          href={`/run?benchmark=${encodeURIComponent(benchmark.id)}`}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Run benchmark
        </Link>
      </div>
    </div>
  );
}
