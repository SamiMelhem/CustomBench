import { UploadForm } from "./UploadForm";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Upload benchmark</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Upload a dataset in the same format as the built-in FNAF benchmark.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950">
        <UploadForm />
      </div>
    </div>
  );
}
