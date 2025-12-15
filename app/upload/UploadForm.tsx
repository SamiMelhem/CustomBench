"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const button =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950";

export function UploadForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [qaText, setQaText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("description", description);
      if (id.trim()) fd.set("id", id.trim());
      if (file) fd.set("qa", file);
      if (!file && qaText.trim()) fd.set("qaText", qaText);

      const resp = await fetch("/api/benchmarks/upload", { method: "POST", body: fd });
      const data = (await resp.json()) as { id?: string; benchmarkId?: string; error?: string };

      if (!resp.ok) {
        throw new Error(data.error ?? `Upload failed (${resp.status})`);
      }

      router.push(`/run?benchmark=${encodeURIComponent(data.id ?? data.benchmarkId ?? "")}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My benchmark"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">ID (optional)</label>
          <input
            className={input}
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="my-benchmark"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className={input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="A brief description of this benchmark"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">qa.json file</label>
          <input
            type="file"
            accept="application/json,.json"
            className={input}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Format: {"{ questions: string[], answers: string[] }"}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Or paste qa.json</label>
          <textarea
            className={input + " font-mono text-xs"}
            value={qaText}
            onChange={(e) => setQaText(e.target.value)}
            rows={5}
            placeholder='{"questions": ["..."], "answers": ["..."]}'
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button className={button} type="button" disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? "Uploading…" : "Upload"}
        </button>
        <button className={button} type="button" disabled={isSubmitting} onClick={() => router.push("/")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
