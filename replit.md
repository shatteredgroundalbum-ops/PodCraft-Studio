# PodCraft Central

A fully-featured podcast production workspace app — plan, record, edit, mix, master, and publish podcasts, all in the browser.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- **Frontend**: React + Vite, react-router-dom, Tailwind CSS v4, framer-motion, lucide-react

## Where things live

- `artifacts/podcraft-central/` — React + Vite SPA, preview path `/`
- `artifacts/podcraft-central/src/store/db.ts` — IndexedDB CRUD + auth helpers
- `artifacts/podcraft-central/src/store/AuthStore.tsx` — Auth context (IndexedDB-backed, sessionStorage session)
- `artifacts/podcraft-central/src/store/MediaStore.tsx` — All entity CRUD with IndexedDB persistence
- `artifacts/podcraft-central/src/components/` — AppLayout, PodCraftLogo, BrandPanel
- `artifacts/podcraft-central/src/pages/` — All pages (Splash, Login, Signup, Dashboard, Projects, Studio, Tasks, Analytics, Templates, MediaLibrary, Calendar, Team, Settings, Help, About, KnowledgeBase, Legal)

## Architecture decisions

- **All data stored locally** in IndexedDB — no backend required for the frontend app
- **Auth** via IndexedDB user records with a simple hash + sessionStorage session (no JWT, no server)
- **Studio recording** uses native browser `MediaRecorder` API + Web Audio API for metering
- **Routing**: react-router-dom v7 with `BrowserRouter` (NOT wouter); nested `<Routes>` for Settings, KnowledgeBase, Legal sub-paths
- **Providers**: `AuthProvider` > `MediaStoreProvider` wrapping all routes

## Product

PodCraft Central is a complete podcast production workflow:
- **Dashboard** — overview, pipeline stats, recent activity
- **Projects** — expandable project cards with episode management
- **Studio** — real MediaRecorder recording + Web Audio metering + mastering presets
- **Tasks** — full task CRUD with checklist, comments, attachments, activity log
- **Analytics** — platform analytics overview (placeholder for future integration)
- **Templates** — create/edit/delete production templates
- **Media Library** — categorized file browser with upload + download
- **Calendar** — visual month calendar showing task due dates + episode publish dates
- **Team** — invite/manage team members with roles
- **Settings** — profile, account, notifications, appearance, audio, privacy, billing, integrations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT use wouter — all pages use react-router-dom
- Settings, KnowledgeBase, and Legal use nested `<Routes>` (match with `/*` on parent routes)
- IndexedDB opens once and is cached; `dbInstance` is a module-level singleton
- Studio uses `MediaRecorder` — browser must allow microphone access; test with real HTTPS or localhost

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
