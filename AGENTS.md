# Agent guide — TanStack Start theme lib

This folder contains the source-distribution theme helper for TanStack Start.
Read this before changing files in this package or its app adapter.

## Core contract

- `theme` is the selected user preference (`light`, `dark`, or the configured `systemPreference`).
- `resolvedTheme` is the concrete visual theme applied for Tailwind/shadcn compatibility (`light` or `dark` in the common app setup).
- `ThemeInitScript` owns pre-hydration DOM class/data setup only; it does not initialize React state.
- Router/server context is the initial source of truth for React state.
- `ThemeProvider` initializes React Context from router context during its first render.
- `useTheme()` should read React Context first; it must not observe a module default before the provider value.

## File map

- `src/index.ts` — generic controller factory, DOM applier, pre-hydration script, React Context bridge.
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
- Keep user actions in `useTheme().setTheme()`: update React Context state, apply DOM classes/data attributes, then persist.
- Do not call the persistence server function while reading router/server context.
- Do not use `useEffect` or route `beforeLoad` to initialize the first React theme state; `ThemeProvider` must derive it from props on first render.
- Keep DOM mutation out of React render. Initial DOM belongs in `ThemeInitScript`; user changes belong in event handlers.
- If changing `ThemeProvider`, preserve first-render correctness: children calling `useTheme()` must see the provider `theme` prop, not `defaultTheme`.
- If changing `system` behavior, update README and release docs. Current stance: `system` is a selected preference and JS resolves it only to apply the concrete DOM class for Tailwind/shadcn compatibility.
- Avoid adding dependencies. This lib should stay small and framework-adapter focused.

## React synchronization guidance

Prefer this mental model:

1. Server/router context reads and normalizes the selected preference.
2. `ThemeInitScript` uses that preference to set `<html>` classes/data before React hydrates.
3. `ThemeProvider` uses the same preference to initialize React Context state on its first render.
4. `useTheme()` reads React Context; outside a provider it may fall back to the configured default.
5. User changes happen through `useTheme().setTheme()` in an event handler.

Do not rely on `router.hydrate`, route `beforeLoad`, or `useEffect` to push the initial preference into a store. Those paths are too late or disconnected from provider-owned state. Effects are only appropriate for optional post-hydration subscriptions, not first theme initialization.

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
