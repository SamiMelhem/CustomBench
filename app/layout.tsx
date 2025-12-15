import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CustomBench",
  description: "Run AI model benchmarks with live progress",
};

const navLink =
  "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-medium";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <nav className="border-b border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-slate-950">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="text-lg font-semibold">
                CustomBench
              </Link>
              <div className="flex gap-1">
                <Link href="/" className={navLink}>
                  Dashboard
                </Link>
                <Link href="/run" className={navLink}>
                  Run
                </Link>
                <Link href="/upload" className={navLink}>
                  Upload
                </Link>
                <Link href="/results" className={navLink}>
                  Results
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
