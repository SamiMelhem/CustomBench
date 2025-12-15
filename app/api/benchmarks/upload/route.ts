import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UPLOADS_DIR = "uploads";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const customId = formData.get("id") as string | null;
    const qaFile = formData.get("qa") as File | null;
    const qaText = formData.get("qaText") as string | null;

    // Validate name and description
    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    // Parse QA data from file or text
    let questions: string[] = [];
    let answers: string[] = [];

    if (qaFile) {
      const text = await qaFile.text();
      const parsed = JSON.parse(text);
      questions = parsed.questions;
      answers = parsed.answers;
    } else if (qaText?.trim()) {
      const parsed = JSON.parse(qaText);
      questions = parsed.questions;
      answers = parsed.answers;
    } else {
      return NextResponse.json({ error: "Please provide a qa.json file or paste the JSON content" }, { status: 400 });
    }

    // Validate QA data
    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Questions and answers must be arrays" }, { status: 400 });
    }

    if (questions.length !== answers.length) {
      return NextResponse.json(
        { error: `Mismatch: ${questions.length} questions but ${answers.length} answers` },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "Dataset cannot be empty" }, { status: 400 });
    }

    // Create benchmark folder
    const benchmarkId = customId?.trim() || slugify(name);
    const benchmarkDir = join(UPLOADS_DIR, benchmarkId);

    await mkdir(benchmarkDir, { recursive: true });

    // Write config.json
    const config = {
      name: name.trim(),
      description: description.trim(),
      source: "uploaded",
    };
    await writeFile(join(benchmarkDir, "config.json"), JSON.stringify(config, null, 2), "utf-8");

    // Write qa.json
    const qa = { questions, answers };
    await writeFile(join(benchmarkDir, "qa.json"), JSON.stringify(qa, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      id: benchmarkId,
      benchmarkId,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error("Error uploading benchmark:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload benchmark" }, { status: 500 });
  }
}
