# Agent guide — TanStack Start theme lib

This folder contains the source-distribution theme helper for TanStack Start.
Read this before changing files in `frontend/main/src/shared/libs/theme/`.

## Core contract

- A theme is the exact CSS class token applied to `<html>`.
- Do not resolve `system` to `light` or `dark` in JavaScript.
- CSS owns visual resolution through selectors, Tailwind variants, and `prefers-color-scheme`.
- Router/server context is the initial source of truth for the first rendered theme.
- `ThemeProvider` is only the bridge from router context into the client theme store.
- User-facing UI should read and update theme through `useTheme()`.

## File map

- `src/index.ts` — generic controller factory, TanStack Store integration, DOM applier, React bridge.
- `src/server.ts` — default TanStack Start cookie read/write server functions.
- `src/schema.ts` — safe theme token validation for persisted/user-provided values.
- `src/type.ts` — shared theme types.
- root `index.ts` — HaanHarn app-facing theme instance and public exports.
- root `components.tsx` / `ThemeToggle.tsx` — app-facing controls; keep generic factory code out of these.
- `docs/release/` — release-note markdown for GitHub releases.

## Edit rules

- Keep this package source-first. Do not add a package-level `dist` build unless explicitly asked.
- Do not add or edit shared UI primitives from `package/components/ui/` from here.
- Do not introduce HaanHarn-specific theme names inside `createTheme()`; app-specific names belong in the root adapter instance.
- Keep `parseTheme()` / `isTheme()` as the runtime guard for raw cookie, server, or URL values.
- Keep user actions in `setTheme()`: hydrate/update the store, apply the DOM theme, then persist.
- Do not call the persistence server function while hydrating router/server context.
- Avoid DOM or external-store mutation during React render. Use user event handlers or an effect for external synchronization.
- If changing `ThemeProvider`, preserve SSR compatibility: the root document should still render `<html className={theme} data-theme={theme}>` from router context.
- If changing `system` behavior, update README and release docs. Default stance: `system` remains a class token and CSS decides the visual result.
- Avoid adding dependencies. This lib should stay small and framework-adapter focused.

## React synchronization guidance

Prefer this mental model:

1. Initial theme comes from TanStack Start server/router context and is rendered on `<html>`.
2. User changes happen through `setTheme()` in an event handler.
3. `ThemeProvider` only syncs router-context changes into the store/DOM without persistence.

An effect is acceptable when synchronizing with external systems such as `document.documentElement` or the singleton TanStack Store. Do not use effects for values that can be derived during render.

## Verification

After edits, run the nearest scoped check from the repo root / workspace.

Preferred package-level check when workspace filtering is available:

```sh
pnpm --filter @tanstack-start/theme typecheck
```

If filtering is not wired in the current workspace, run the frontend typecheck and report unrelated existing errors separately:

```sh

pnpm run typecheck
```

Do not run migrations, generated type commands, or git commits unless the user explicitly asks.
