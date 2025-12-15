/**
 * OpenRouter model clients via Vercel AI SDK
 */
import { generateText, generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { ModelConfig, JudgeVerdict } from "./types.ts";

// Default models
export const DEFAULT_MODEL: ModelConfig = {
  id: "anthropic/claude-3.5-sonnet",
  name: "Claude 3.5 Sonnet",
};

export const DEFAULT_JUDGE: ModelConfig = {
  id: "openai/gpt-4o-mini",
  name: "GPT-4o Mini",
};

// Initialize OpenRouter provider
function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is required.\n" +
        "Get your API key at https://openrouter.ai/keys"
    );
  }
  return createOpenRouter({ apiKey });
}

const FNAF_SYSTEM_PROMPT = `You are answering trivia questions about the Five Nights at Freddy's (FNAF) video game series and movie franchise. This includes lore from all games (FNAF 1-4, Sister Location, Pizzeria Simulator/FNAF 6, Ultimate Custom Night, Security Breach, Help Wanted, etc.) and the 2023 movie.

Answer concisely and directly. Focus on the most accurate answer according to established FNAF lore and fan theories.`;

const JUDGE_SYSTEM_PROMPT = `You are a strict but fair judge evaluating answers to trivia questions about the Five Nights at Freddy's (FNAF) video game and movie franchise. Evaluate if the model's answer is correct. The answer doesn't need to be word-for-word identical, but it must convey the same core meaning and be factually accurate according to FNAF lore.`;

// Zod schema for judge verdicts - ensures type-safe structured output
const judgeVerdictSchema = z.object({
  correct: z.boolean().describe("Whether the model's answer is correct"),
  rationale: z.string().describe("Brief explanation of why the answer is correct or incorrect"),
});

/** Ask a model a question and get the response */
export async function askModel(
  question: string,
  modelConfig: ModelConfig = DEFAULT_MODEL
): Promise<string> {
  const openrouter = getOpenRouter();

  const { text } = await generateText({
    model: openrouter(modelConfig.id),
    system: FNAF_SYSTEM_PROMPT,
    prompt: question,
    maxOutputTokens: 500,
  });

  return text.trim();
}

/** Have the judge evaluate if the model's answer is correct */
export async function judgeAnswer(
  question: string,
  expectedAnswer: string,
  modelAnswer: string,
  judgeConfig: ModelConfig = DEFAULT_JUDGE
): Promise<JudgeVerdict> {
  const openrouter = getOpenRouter();

  const judgePrompt = `QUESTION: ${question}

EXPECTED ANSWER: ${expectedAnswer}

MODEL'S ANSWER: ${modelAnswer}`;

  // Primary: use generateObject for structured output
  try {
    const { object } = await generateObject({
      model: openrouter(judgeConfig.id),
      schema: judgeVerdictSchema,
      system: JUDGE_SYSTEM_PROMPT,
      prompt: judgePrompt,
      temperature: 0,
    });

    return object;
  } catch {
    // Fallback: generateText + manual JSON parsing (for models that don't support structured output)
    console.warn(`⚠ Structured output failed, falling back to text parsing`);

    const textPrompt = `${JUDGE_SYSTEM_PROMPT}

${judgePrompt}

Respond in this exact JSON format only, with no other text:
{"correct": true/false, "rationale": "brief explanation"}`;

    const { text } = await generateText({
      model: openrouter(judgeConfig.id),
      prompt: textPrompt,
      maxOutputTokens: 200,
    });

    // Parse the JSON response
    try {
      const cleaned = text.trim();
      // Handle potential markdown code blocks
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as { correct: unknown; rationale: unknown };

      if (typeof parsed.correct !== "boolean" || typeof parsed.rationale !== "string") {
        throw new Error("Invalid verdict structure");
      }

      return {
        correct: parsed.correct,
        rationale: parsed.rationale,
      };
    } catch {
      // If parsing fails, try to infer from the response
      console.warn(`⚠ Judge response parsing failed, inferring from text: ${text}`);
      const lowerText = text.toLowerCase();
      const seemsCorrect = lowerText.includes('"correct": true') || lowerText.includes('"correct":true');

      return {
        correct: seemsCorrect,
        rationale: `[Parse error - inferred] ${text.slice(0, 100)}`,
      };
    }
  }
}
