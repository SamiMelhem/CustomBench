/**
 * Shared styling constants for consistent UI
 */

/** Standard link button styling */
export const linkButton =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900";

/** Primary button styling */
export const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60";

/** Secondary/outline button styling */
export const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900";

/** Card container styling */
export const card =
  "rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950";

/** Input field styling */
export const inputField =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950";

/** Format accuracy as percentage */
export function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Format benchmark ID as readable name */
export function formatBenchmarkName(id: string): string {
  if (!id || id === "uncategorized") return "Uncategorized";
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
