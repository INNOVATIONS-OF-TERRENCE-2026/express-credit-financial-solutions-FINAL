

# Fix All 22 Edge Function TypeScript Build Errors

## Problem
Deno's strict TypeScript treats caught exceptions as `unknown`, so `error.message` / `err.message` / `e.message` fails. Plus one TS7053 indexing error in `education-content`.

## Fix
Cast `error`/`err`/`e` to `Error` at each usage site. One-line change per error location.

## All 22 fixes across 15 files

| # | File | Line | Change |
|---|------|------|--------|
| 1 | `ai-letter-preview/index.ts` | 192 | `error.message` → `(error as Error).message` |
| 2 | `ai-letter-preview/index.ts` | 201 | `error.message` → `(error as Error).message` |
| 3 | `bulk-document-intelligence-processor/index.ts` | 320 | `err.message` → `(err as Error).message` |
| 4 | `create-plaid-link-token/index.ts` | 75 | `error.message` → `(error as Error).message` |
| 5 | `education-content/index.ts` | 148 | `contentPrompts[topic]` → `contentPrompts[topic as keyof typeof contentPrompts]` |
| 6 | `exchange-plaid-token/index.ts` | 141 | `error.message` → `(error as Error).message` |
| 7 | `expire-vip-trials/index.ts` | 150 | `error.message` → `(error as Error).message` |
| 8 | `expire-vip-trials/index.ts` | 152 | `error.message` → `(error as Error).message` |
| 9 | `generate-dispute-ai/index.ts` | 187 | `error.message` → `(error as Error).message` |
| 10 | `generate-dispute-letter-secure/index.ts` | 200 | `error.message` → `(error as Error).message` |
| 11 | `generate-dispute-letter/index.ts` | 113 | `error.message` → `(error as Error).message` |
| 12 | `hide-lovable-badge/index.ts` | 44 | `error.message` → `(error as Error).message` |
| 13 | `orchestrate-ai-workflow/index.ts` | 59 | `e.message` → `(e as Error).message` |
| 14 | `orchestrate-ai-workflow/index.ts` | 82 | `e.message` → `(e as Error).message` |
| 15 | `orchestrate-ai-workflow/index.ts` | 102 | `e.message` → `(e as Error).message` |
| 16 | `orchestrate-ai-workflow/index.ts` | 123 | `e.message` → `(e as Error).message` |
| 17 | `orchestrate-ai-workflow/index.ts` | 145 | `e.message` → `(e as Error).message` |
| 18 | `orchestrate-ai-workflow/index.ts` | 404 | `err.message` → `(err as Error).message` |
| 19 | `predict-credit-score/index.ts` | 138 | `error.message` → `(error as Error).message` |
| 20 | `process-automation-event/index.ts` | 210 | `error.message` → `(error as Error).message` |
| 21 | `process-document-autonomous/index.ts` | 233 | `err.message` → `(err as Error).message` |
| 22 | `sync-credit-data/index.ts` | 188 | `error.message` → `(error as Error).message` |

## Safety
- Zero logic changes — only type narrowing casts
- No schema changes, no frontend changes
- Fixes all 22 compile errors in one pass

