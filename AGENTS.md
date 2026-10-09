# Agent guide — TanStack Start theme lib

This folder contains a source-distribution theme helper for TanStack Start.
The consuming application's own Vite/TanStack Start engine compiles these source files
as part of its build; this repository is not a prebuilt `dist` package that consumers
import as compiled JavaScript.
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

## Consumer integration

This is a public, source-distribution library for TanStack Start. Do not encode any
specific consumer repository, folder layout, CSS package, or app-specific theme name
in the generic library guide. Every consuming application has its own root document,
provider, adapter, and stylesheet entrypoint.

Before changing a theme name, theme tokens, or SSR integration, inspect the consumer's
nearest equivalent of these files:

- **root document** — confirms the CSS entrypoint, `ThemeInitScript` placement, and
  document-level theme attributes.
- **provider/router context** — confirms how the server-selected theme reaches
  `ThemeProvider`.
- **app-facing theme adapter** — owns consumer-specific `createTheme()` configuration;
  app-specific selectable names belong there, not in generic `src/` code.
- **stylesheet entrypoint** — confirms how the consumer loads this library's theme
  classes and where its concrete CSS variable tokens live.

The consumer import chain commonly looks like:

```text
root document → app stylesheet entrypoint → shared/package stylesheet → theme tokens
```

Do not assume the consumer's stylesheet entrypoint is inside this library. Find it by
following the root document's stylesheet import/link and reading the nearest consumer
guide before editing.

When adding a concrete theme such as `soft` in a consumer:

1. Add the selectable name to the consumer's app adapter.
2. Add its CSS variable token class to the consumer's stylesheet source of truth.
3. Add the option/icon to the consumer's theme control if the UI exposes a selector.
4. Confirm the consumer root document renders `ThemeInitScript` in `<head>` and loads
   its stylesheet entrypoint.
5. Confirm the consumer provider passes the same selected theme into `ThemeProvider`.

Do not treat `system` as a concrete CSS theme when it is configured as
`systemPreference`; it is a selected preference that resolves to a concrete theme.

## Root document ownership

`ThemeInitScript` owns pre-hydration theme DOM setup. It applies the selected and
resolved classes/data attributes before hydration. Avoid duplicating theme mutation
with `hydrateTheme()`, `useEffect()`, or a module-level store in the root document.

The root document may render app attributes, but do not assume `className={theme}` is
sufficient: a selected `system` preference also needs its resolved concrete class. If
changing this contract, update the root document and provider together and verify the
resulting SSR/hydration behavior.

Before finishing a root integration change, remove stale imports such as unused
`hydrateTheme`, `themeStore`, or `useSelector` left over from an older synchronization
approach.

## Edit rules

- Keep this package source-first. The consumer's Vite/TanStack Start build compiles the
  library source together with the application. Do not add a package-level `dist` build,
  bundler, or generated runtime artifact unless explicitly asked.
- Keep runtime dependencies limited to the actual source contract. Repository-only tools
  such as Vitest, jsdom, coverage tools, and test plugins must not be added to runtime or
  peer dependencies merely to test this source tree. Prefer the consumer/repository's
  existing engine and dev tooling.
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

After edits, run the nearest scoped check from the repo root / workspace. Verify the
source through the consuming application's own TypeScript/Vite/TanStack Start pipeline;
do not infer compatibility from a separately built package artifact.

Preferred package-level check when workspace filtering is available:

```sh
pnpm --filter @tanstack-start/theme typecheck
```

If filtering is not wired in the current workspace, run the frontend typecheck and report unrelated existing errors separately:

```sh

pnpm run typecheck
```

For consumer integration changes, also verify the scoped paths and contracts:

- Run the consumer's scoped typecheck and distinguish pre-existing errors from touched files.
- Confirm the changed theme name appears in the consumer app adapter and the matching
  selector appears in the consumer stylesheet source of truth.
- Confirm the consumer root document loads its stylesheet entrypoint and renders
  `ThemeInitScript`.
- Confirm the consumer provider derives/normalizes the selected theme and passes it to
  `ThemeProvider`.

Do not run migrations, generated type commands, or git commits unless the user explicitly asks.
