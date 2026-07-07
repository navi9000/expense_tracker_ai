# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router expense tracker. Application routes live in `src/app/`; `layout.tsx` defines global metadata and shell markup, `page.tsx` renders the main app, and `globals.css` contains Tailwind imports plus shared UI classes. Reusable UI belongs in `src/components/`, with the primary tracker in `src/components/expense-tracker.tsx`.

Domain logic is kept in `src/lib/`: `expenses.ts` defines expense types, categories, validation, filtering, summaries, and CSV export; `format.ts` centralizes currency and date formatting. Browser persistence lives in `src/hooks/use-local-expenses.ts`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and run Next.js compile checks.
- `npm run start`: serve the production build after `npm run build`.
- `npm run lint`: run ESLint with the Next.js flat config.
- `npm run typecheck`: run TypeScript without emitting files.

## Coding Style & Naming Conventions

Use TypeScript, React hooks, and functional components. Keep shared types close to domain logic in `src/lib/`. Use 2-space indentation, `camelCase` for variables/functions, `PascalCase` for React components and exported types, and `kebab-case` for non-component file names such as `use-local-expenses.ts`.

Styling is Tailwind-first, with stable reusable classes in `src/app/globals.css` only when repeated across the app. Keep UI copy concise and action-oriented.

## Testing Guidelines

No test runner is configured yet. Until one is added, validate changes with `npm run lint`, `npm run typecheck`, and `npm run build`. When adding tests, prefer colocated unit tests for pure logic, for example `src/lib/expenses.test.ts`, and integration tests for browser behavior such as localStorage persistence, filters, editing, deletion, and CSV export.

## Commit & Pull Request Guidelines

Git history is not available in this workspace, so use clear imperative commit messages such as `Add expense CSV export` or `Fix category filter totals`. Keep each commit focused on one logical change.

Pull requests should include a concise summary, validation commands run, linked issues when relevant, and screenshots or recordings for UI changes. Call out changes to storage keys, data shape, dependencies, or user-visible behavior.

## Security & Configuration Tips

Expense data is stored in `localStorage` for this demo and should be treated as browser-local only. Do not commit real personal finance data, credentials, `.env` files, generated build folders, or `node_modules/`.
