import { NextResponse } from "next/server";
import { saveMultiRunResults } from "../../../src/report";
import type { RunOutput, ModelConfig } from "../../../src/types";

interface SaveResultsRequest {
  runs: RunOutput[];
  benchmarkId: string;
  benchmarkName: string;
  judge: ModelConfig;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveResultsRequest;
    const { runs, benchmarkId, benchmarkName, judge } = body;

    if (!runs || !Array.isArray(runs) || runs.length === 0) {
      return NextResponse.json(
        { error: "No runs to save" },
        { status: 400 }
      );
    }

    if (!benchmarkId || !benchmarkName) {
      return NextResponse.json(
        { error: "Missing benchmark info" },
        { status: 400 }
      );
    }

    const filename = await saveMultiRunResults(runs, benchmarkId, benchmarkName, judge);

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Error saving results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save results" },
      { status: 500 }
    );
  }
}
