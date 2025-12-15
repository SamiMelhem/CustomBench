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

/** Badge styling by color */
export const badge = {
  default: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  blue: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  green: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  yellow: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  red: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

/** Get accuracy color class based on value */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (accuracy >= 0.5) return "text-yellow-600 dark:text-yellow-400";
  return "text-rose-600 dark:text-rose-400";
}

/** Format accuracy as percentage */
export function percent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Format benchmark ID as readable name */
export function formatBenchmarkName(id: string): string {
  if (!id || id === "unknown") return "Unknown";
  // Handle common benchmark IDs
  const names: Record<string, string> = { fnaf: "FNAF Trivia" };
  if (names[id]) return names[id];
  return id
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Format timestamp for display */
export function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
}
