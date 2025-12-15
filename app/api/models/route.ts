import { NextResponse } from "next/server";

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

// Cache models for 5 minutes
let cachedModels: OpenRouterModel[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET() {
  try {
    // Return cached models if still valid
    if (cachedModels && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedModels);
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch models from OpenRouter");
    }

    const data = (await response.json()) as OpenRouterResponse;

    // Sort models by name and filter out deprecated ones
    const models = data.data
      .filter((m) => !m.id.includes(":free") || m.id.endsWith(":free"))
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        contextLength: m.context_length,
        pricing: m.pricing,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cache the results
    cachedModels = models;
    cacheTime = Date.now();

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    
    // Return fallback models if API fails
    const fallbackModels = [
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
      { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
      { id: "openai/gpt-4o", name: "GPT-4o" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
      { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
      { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
      { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B" },
      { id: "mistralai/mistral-large", name: "Mistral Large" },
    ];
    
    return NextResponse.json(fallbackModels);
  }
}
