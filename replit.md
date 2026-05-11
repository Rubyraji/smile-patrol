# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Apps

- **`artifacts/habits` — Toothbrush Hero**: A kid-friendly tooth brushing tracker. The home page leads with a big-tap "Today" checklist (morning brush → anytime extras → bedtime brush → night-only extras like tooth cream) so kids see exactly what to do now; the full week grid is tucked into a collapsible "This week's history" section for parents. The 2-minute brush timer shows realistic upper + lower **dental arches** (SVG, age-appropriate teeth) inside a circular progress ring; the upper arch lights up and pulses for the first minute, the lower arch for the second minute. Each kid has an `age` field (1–18) that drives a pediatric eruption model (`src/lib/teeth.ts`) — primary teeth, mixed dentition, and permanent teeth are rendered automatically, with primary teeth marked by a small dot and unerupted/missing slots shown as dashed outlines. Parents can also tap any tooth in the kid editor to override it as missing (loose, just lost, or not in yet); a Reset button clears overrides. Configurable per-kid daily extras include prominent on/off toggles for the two most common ones (Flossing, nighttime Tooth cream) plus quick-add chips for others and custom tasks. Tasks have a `time` field (`anytime` or `night`) that controls placement in the Today list. Weekly reward system: completing every daily goal (2 brushes + each task) for all 7 days unlocks a sticker added to the kid's collection (with a confetti celebration). Multi-kid support with a customizable character picker — over 100 characters organized into tabs (Animals, Birds, Sea, Fantasy, Heroes, Bugs, Nature) plus a color palette. State stored in localStorage. Optional **parent sign-off**: a global 4-digit PIN (stored in `brush.parent.v1` localStorage slot via `loadParentSettings`/`setParentPin`/`setRequireParentSignoff`) that, when enabled, gates brush logging — at the end of a session the kid sees a "Parent: tap to confirm" button that opens a numeric keypad (`src/components/parent-pin-pad.tsx`, supports `verify` | `set` | `change` modes) and only persists the session on a correct PIN. Toggle, set/change/remove flows live on the Kids page. Routes: `/` (home + today checklist + rewards + history), `/brush` (timer with dental arches), `/kids` (manage kids, age, missing teeth, quick toggles, custom tasks, and parent PIN).
- **`artifacts/api-server`**: Express API server. Hosts `/api/family/*` routes for cross-device family sync (create, join, push, pull). Uses `@workspace/db` (Drizzle + PostgreSQL) with tables `family_groups` and `family_data`.
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
- **Mobile**: Capacitor (`com.radhikaarasu.smilepatrol`) — config at `artifacts/habits/capacitor.config.ts`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
