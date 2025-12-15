import { loadDataset, getBenchmarkInfo } from "../../../src/data";
import { runBenchmark, type ProgressEvent } from "../../../src/runner";
import type { ModelConfig } from "../../../src/types";

interface RunRequest {
  benchmarkId: string;
  modelId: string;
  modelName?: string;
  judgeId?: string;
  judgeName?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequest;
    const {
      benchmarkId,
      modelId,
      modelName,
      judgeId = "openai/gpt-4o-mini",
      judgeName = "GPT-4o Mini",
    } = body;

    if (!benchmarkId || !modelId) {
      return new Response(
        JSON.stringify({ error: "Missing benchmarkId or modelId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load the benchmark data and info
    const items = await loadDataset(benchmarkId);
    const benchmarkInfo = await getBenchmarkInfo(benchmarkId);
    const benchmarkName = benchmarkInfo?.name || benchmarkId;

    // Model configurations
    const model: ModelConfig = {
      id: modelId,
      name: modelName ?? modelId,
    };

    const judge: ModelConfig = {
      id: judgeId,
      name: judgeName,
    };

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: ProgressEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          const output = await runBenchmark(items, model, judge, sendEvent);

          // Send the complete output for collection (saving happens when all models complete)
          const completeEvent = {
            type: "run_complete",
            output: {
              ...output,
              summary: {
                ...output.summary,
                benchmarkId,
                benchmarkName,
              },
            },
            benchmarkId,
            benchmarkName,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`));

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error starting benchmark:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start benchmark" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
