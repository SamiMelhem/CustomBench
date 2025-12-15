import { loadDataset } from "../../../src/data";
import { runBenchmark, type ProgressEvent } from "../../../src/runner";
import { saveResults } from "../../../src/report";
import type { ModelConfig, RunOutput } from "../../../src/types";

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

    // Load the benchmark data
    const items = await loadDataset(benchmarkId);

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

          // Add benchmark info to the output for categorization
          const outputWithBenchmark: RunOutput & { benchmarkId: string } = {
            ...output,
            benchmarkId,
          };

          // Save the results to disk
          const filename = await saveResults(outputWithBenchmark, benchmarkId);
          console.log(`Results saved to ${filename}`);

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
