# CustomBench - LLM Benchmark Runner

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3.6-000000?style=for-the-badge&logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-FF6B6B?style=for-the-badge)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

A full-featured web application and CLI tool for running benchmarks on Large Language Models (LLMs) via OpenRouter. Built with Next.js, React, Bun, and TypeScript, it provides an intuitive web interface for testing LLM performance on custom question-answer datasets with live progress tracking and detailed results analysis.

## Features

- 🌐 **Web Interface**: Modern Next.js web application with real-time progress tracking
- 📊 **Dashboard**: View available benchmarks and recent results at a glance
- 🚀 **Live Execution**: Stream benchmark progress in real-time with Server-Sent Events (SSE)
- 📤 **Custom Benchmarks**: Upload your own Q&A datasets via the web UI
- 🔍 **Results Analysis**: Detailed results with per-question verdicts, accuracy metrics, and winner highlighting
- 🎯 **Multi-Model Testing**: Run multiple models simultaneously in a single benchmark session
- 🏆 **Leaderboard View**: Results grouped by benchmark with trophy indicators for best-performing models
- ⏹️ **Run Control**: Stop running benchmarks at any time with cancel functionality
- 💻 **CLI Support**: Still works as a command-line tool for automation
- 🎨 **Dark Mode**: Built-in dark mode support

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
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

### Web Application (Recommended)

Start the development server:

```bash
bun run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

**Web Features:**
- **Dashboard** (`/`): Browse available benchmarks and view recent results summary
- **Run** (`/run`): Configure and run benchmarks with live progress
  - Select multiple models to test simultaneously
  - Choose your preferred LLM judge model
  - Stop/cancel runs at any time
  - Auto-saves consolidated results when all models complete
- **Upload** (`/upload`): Upload custom benchmark datasets
- **Results** (`/results`): Comprehensive results browser
  - Grouped by benchmark with expandable run cards
  - Shows judge model used for each run
  - Trophy indicators for best-performing models
  - Detailed per-question breakdowns with verdicts

### CLI (Alternative)

Run benchmarks from the command line:

```bash
# List available benchmarks
bun run index.ts

# Run a specific benchmark with default model
bun run index.ts fnaf

# Run with a specific model
bun run index.ts fnaf anthropic/claude-3.5-sonnet
bun run index.ts fnaf openai/gpt-4o
```

Or use the npm-style script:

```bash
bun run benchmark
```

## How It Works

1. **Load Dataset**: Reads Q&A pairs from benchmark files (JSON format)
2. **Ask Model**: Sends each question to the specified LLM via OpenRouter API
3. **Judge Answers**: An LLM judge (default: GPT-4o Mini) evaluates if the model's answer matches the expected answer using Zod structured outputs
4. **Stream Progress**: Live progress updates via Server-Sent Events (web) or console output (CLI)
5. **Save Results**: Detailed JSON results saved to `results/` directory

## Benchmark Format

Benchmarks are JSON files with the following structure:

```json
{
  "questions": [
    "Question 1?",
    "Question 2?",
    ...
  ],
  "answers": [
    "Answer 1",
    "Answer 2",
    ...
  ]
}
```

### Built-in Benchmarks

- **FNAF**: Five Nights at Freddy's trivia questions (32 Q&A pairs)
- Located in `benchmarks/fnaf/qa.json`

### Custom Benchmarks

You can add custom benchmarks in two ways:

1. **Via Web UI**: Upload through `/upload` page
2. **Manually**: Place JSON files in `benchmarks/<id>/qa.json` directory

## Output

Results are saved to `results/` with the filename format:

**Multi-model runs (web UI):**
```
{benchmark-id}_{model-count}models_{timestamp}.json
```

**Single-model runs (CLI):**
```
{benchmark-id}_{model-id}_{timestamp}.json
```

Each result file contains:
- **Multi-run format**: Benchmark info, judge model, timestamp, and an array of all model results
- **Single-run format**: Run summary with model, judge, accuracy, timestamp, and benchmark info
- **Per-question results**: Question, expected answer, model answer, verdict (correct/incorrect), and judge rationale

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── benchmarks/   # Benchmark listing & upload
│   │   ├── models/       # Model listing from OpenRouter
│   │   ├── results/      # Results listing & loading
│   │   ├── run/          # Benchmark execution endpoint (SSE)
│   │   └── save-results/ # Consolidated results saving
│   ├── components/       # React components
│   │   ├── BenchmarkCard.tsx
│   │   ├── LiveRunner.tsx  # Real-time benchmark runner
│   │   ├── ModelSelector.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ResultsTable.tsx
│   ├── lib/              # Shared utilities
│   │   └── styles.ts     # Consistent styling constants
│   ├── results/          # Results page
│   ├── run/              # Run benchmark page
│   ├── upload/           # Upload benchmark page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── benchmarks/           # Benchmark datasets
│   └── fnaf/
│       ├── config.json   # Benchmark metadata
│       └── qa.json       # Q&A pairs
├── src/                   # Core library code
│   ├── types.ts          # TypeScript type definitions
│   ├── data.ts           # Dataset loading and validation
│   ├── clients.ts        # OpenRouter API clients
│   ├── runner.ts         # Benchmark execution logic
│   └── report.ts         # Results persistence (single & multi-run)
├── index.ts              # CLI entry point
└── results/              # JSON output files (auto-created)
```

## Models

- **Default Model**: `anthropic/claude-3.5-sonnet`
- **Judge Model**: `openai/gpt-4o-mini` (with Zod structured outputs)

You can use any model available on [OpenRouter](https://openrouter.ai/models). The web interface includes a searchable model selector that fetches available models from OpenRouter.

## Technical Details

### Architecture

- **Framework**: Next.js 16.1.4 with App Router
- **Runtime**: Bun (faster than Node.js)
- **Styling**: Tailwind CSS with dark mode support
- **Type Safety**: Full TypeScript with strict mode
- **API**: Vercel AI SDK with OpenRouter provider

### Judge Evaluation

The judge uses Vercel AI SDK's `generateObject()` with a Zod schema for reliable structured output parsing. If a model doesn't support structured outputs, it falls back to `generateText()` with manual JSON parsing.

### Live Progress

The web interface uses Server-Sent Events (SSE) to stream real-time progress updates:
- Current question being processed per model
- Completed questions count with progress bar
- Live results table as answers come in
- Final summary with accuracy metrics when complete
- Cancel/stop functionality at any time
- 30-minute timeout protection for long-running benchmarks

### Multi-Model Runs

When testing multiple models simultaneously:
- Each model runs independently with its own progress tracker
- Results are collected and saved to a single consolidated JSON file
- The results page shows all models from the same run grouped together
- Winner (highest accuracy) is highlighted with a trophy indicator

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linter
bun run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
