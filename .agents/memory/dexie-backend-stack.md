---
name: Dexie backend stack
description: Architecture details for the Dexie.js-backed local-first data layer in PodCraft Central
---

# Dexie Backend Stack

## Architecture
Component → Store (React Context) → Service → Dexie DB (`podcraft-v2`)

No component may call IndexedDB directly. All reads/writes go through services.

## DB (`src/db/index.ts`)
- DB name: `podcraft-v2` (separate from the legacy raw-IDB `podcraft-central` to avoid conflicts)
- 12 tables: `users (++id, &email)`, `sessions`, `profiles (&userId)`, `projects (userId, status)`, `episodes (userId, projectId, status)`, `tasks (userId, projectId, status, dueDate, priority)`, `calendar_events (userId, date, type)`, `templates (userId, category)`, `media_assets (userId, category)`, `settings (userId)`, `legal_acceptances (userId, documentName)`, `activity_events (userId, entityType, entityId)`
- All user-scoped tables carry a `userId: number` field (Dexie auto-increment id from `users` table)
- Settings id = `${userId}_${key}` (string compound key for simplicity)

## Services (`src/services/`)
14 modules: authService, userService, profileService, projectService, episodeService, taskService, calendarService, templateService, mediaService, settingsService, legalService, analyticsService, activityService, storageService

**Why:** Provider-agnostic — UI calls services only, so backend can be swapped later.

## Stores
- `AuthStore.tsx`: uses `authService.createAccount` / `signIn`; session stored as `{ userId: number, email, name }` in `sessionStorage` key `podcraft_session_v2`; `signUp` returns `{ ok, error, userId }` so callers can record legal acceptances
- `MediaStore.tsx`: uses `useAuth()` to get `user.userId`, scopes all Dexie queries by userId; reloads on `user.userId` change; keeps identical public interface (`useMediaStore`, same methods) so no page changes needed

## Legal Acceptance
- Recorded after signup via `legalService.recordAcceptance(userId, docName)` in `Signup.tsx`
- Versions defined in `DOCUMENT_VERSIONS` map in legalService
- `legal_acceptances` table stores: id, userId, documentName, documentVersion, acceptedAt

## Analytics
- `analyticsService.getProductionStats(userId)` computes all metrics from real Dexie data
- Shows: project/episode/task counts, task pipeline by status, priority breakdown, overdue count, completion rate, recent activity, media storage stats
- No fake listener/download metrics (those require external platform integration)

## Activity Logging
- `activityService.logActivity(userId, type, entityType, entityId, description)` used by MediaStore on create/update operations
- Surfaced in Analytics > Activity tab

## Gotchas
- `db.transaction('rw', [tableArray], callback)` — tables must be an array, not spread args (Dexie v4+)
- `task.priority` and `task.status` are stored as `string` in DbTask; cast to `TaskPriority`/`TaskStatus` union when indexing color records
- `EpisodesList.onCreate` prop omits `id | projectId | userId | createdAt | updatedAt` from the Episode type
- Old `src/store/db.ts` (raw IDB) remains but AuthStore/MediaStore no longer import from it
