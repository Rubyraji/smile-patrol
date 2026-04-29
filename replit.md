# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Apps

- **`artifacts/habits` — Brush Buddies**: A kid-friendly tooth brushing tracker. The home page leads with a big-tap "Today" checklist (morning brush, daily extras, bedtime brush) so kids see exactly what to do now; the full week grid is tucked into a collapsible "This week's history" section for parents. Includes a 2-minute interactive timer dial, configurable per-kid daily extras (flossing, tooth cream, mouthwash, tongue scrape, or custom), and a weekly reward system: completing every daily goal (2 brushes + each task) for all 7 days unlocks a sticker added to the kid's collection (with a confetti celebration). Multi-kid support with avatars/colors. State stored in localStorage. Routes: `/` (home + today checklist + rewards + history), `/brush` (timer), `/kids` (manage kids and tasks).
- **`artifacts/api-server`**: Express API server (currently unused by Brush Buddies).
- **`artifacts/mockup-sandbox`**: Canvas mockup sandbox.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
