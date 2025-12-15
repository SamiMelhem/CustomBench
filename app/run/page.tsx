import { listBenchmarks } from "../../src/data";
import { RunPageClient } from "./RunPageClient";

export const dynamic = "force-dynamic";

// Default popular models - shown immediately without loading
const DEFAULT_MODELS = [
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "openai/o1", name: "OpenAI o1" },
  { id: "openai/o1-mini", name: "OpenAI o1 Mini" },
  { id: "openai/o3-mini", name: "OpenAI o3 Mini" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
  { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B" },
  { id: "mistralai/mistral-large-2411", name: "Mistral Large" },
  { id: "mistralai/mistral-small-2501", name: "Mistral Small" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
  { id: "x-ai/grok-2-1212", name: "Grok 2" },
];

export default async function RunPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [benchmarks, params] = await Promise.all([listBenchmarks(), searchParams]);
  const benchmark = params.benchmark;
  const initialBenchmarkId = Array.isArray(benchmark) ? benchmark[0] ?? "" : benchmark ?? "";

  return (
    <RunPageClient
      benchmarks={benchmarks}
      initialBenchmarkId={initialBenchmarkId}
      defaultModels={DEFAULT_MODELS}
    />
  );
}
