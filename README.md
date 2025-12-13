# FNAF QA Benchmark Runner

A Bun + TypeScript harness for running FNAF (Five Nights at Freddy's) trivia questions through LLMs via OpenRouter, grading responses with an LLM judge, and saving JSON results.

## Prerequisites

- [Bun](https://bun.sh) runtime
- [OpenRouter API key](https://openrouter.ai/keys)

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Usage

Run the benchmark with the default model (Claude 3.5 Sonnet):

```bash
bun run index.ts
```

Run with a specific model:

```bash
bun run index.ts anthropic/claude-3.5-sonnet
bun run index.ts openai/gpt-4o
bun run index.ts google/gemini-pro
```

Or using npm-style scripts:

```bash
bun run benchmark
bun run start
```

## How It Works

1. **Load Dataset**: Reads 32 FNAF trivia questions from `fnaf/qa.json`
2. **Ask Model**: Sends each question to the specified model via OpenRouter
3. **Judge Answers**: GPT-4o-mini evaluates if the model's answer matches the expected answer (using Zod structured outputs)
4. **Report Results**: Saves detailed JSON results to `results/` and prints a summary

## Output

Results are saved to `results/` with the filename format:
```
{model-id}_{timestamp}.json
```

Each result file contains:
- Run summary (model, judge, accuracy, timestamp)
- Per-question results (question, expected answer, model answer, verdict)

## Project Structure

```
├── index.ts           # CLI entry point
├── fnaf/
│   └── qa.json        # FNAF trivia dataset (32 Q&A pairs)
├── src/
│   ├── types.ts       # TypeScript type definitions
│   ├── data.ts        # Dataset loading and validation
│   ├── clients.ts     # OpenRouter API clients (model + judge with Zod)
│   ├── runner.ts      # Benchmark execution loop
│   └── report.ts      # Results persistence and console output
└── results/           # JSON output files (auto-created)
```

## Models

- **Default Model**: `anthropic/claude-3.5-sonnet`
- **Judge Model**: `openai/gpt-4o-mini` (with Zod structured outputs)

You can use any model available on [OpenRouter](https://openrouter.ai/models).

## Technical Details

The judge uses Vercel AI SDK's `generateObject()` with a Zod schema for reliable structured output parsing. If a model doesn't support structured outputs, it falls back to `generateText()` with manual JSON parsing.
