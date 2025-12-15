import { NextResponse } from "next/server";
import { listBenchmarks } from "../../../src/data";

export async function GET() {
  try {
    const benchmarks = await listBenchmarks();
    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error("Error listing benchmarks:", error);
    return NextResponse.json(
      { error: "Failed to list benchmarks" },
      { status: 500 }
    );
  }
}
