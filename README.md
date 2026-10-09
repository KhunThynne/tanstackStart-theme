# TanStack Start theme module

This module is a source-distribution theme helper for TanStack Start. It is designed to be built by the consumer app's Vite/TanStack Start pipeline instead of shipping a prebuilt `dist` bundle.

## Core idea

A theme is the user's selected preference applied to `<html>`. Real CSS themes are the concrete classes in `themes` (for example `light` and `dark`). The optional `systemPreference` key (default: `system`) means "follow the browser/device color scheme".

For Tailwind/shadcn compatibility, `system` is kept as the selected preference while the resolved concrete theme is also applied:

```html
<html class="system dark" data-theme="system" data-resolved-theme="dark"></html>
```

This lets app CSS target both concepts:

- `data-theme` / the `system` class = the selected preference
- `data-resolved-theme` / the `light` or `dark` class = the concrete visual theme used by Tailwind/shadcn selectors

JavaScript resolves `system` only to choose the concrete DOM class and `color-scheme`; the selected preference remains `system` for UI state and persistence.

## Tailwind/CSS conditions

The controller exposes `themeConditions` and `createThemeConditions(themes)` so consumers can see which selectors or Tailwind v4 custom variants match the configured themes.

```ts
const appTheme = createTheme({
  defaultTheme: "system",
  themes: ["light", "dark"],
  systemPreference: "system",
});

console.log(appTheme.themeConditions);
```

Each item includes:

```ts
{
  theme: "system",
  selector: "&:where(.system, .system *)",
  variant: "@custom-variant theme-system (&:where(.system, .system *));",
  dataVariant:
    "@custom-variant theme-system (&:where([data-theme=\"system\"], [data-theme=\"system\"] *));",
}
```

For `system`, this package still only applies the `system` class. If `system` should follow the operating-system preference, define that in CSS:

```css
html.system {
  color-scheme: light dark;
  /* default system/light tokens */
}

@media (prefers-color-scheme: dark) {
  html.system {
    /* system/dark tokens */
  }
}
```

Components should usually consume theme tokens instead of branching on `system` directly:

```tsx
<div className="bg-background text-foreground" />
```

## App setup

The package source lives in `src/`. The app-facing adapter outside `src/` creates the HaanHarn theme instance:

```ts
const appTheme = createTheme({
  defaultTheme: "system",
  themes: ["light", "dark"],
  systemPreference: "system",
});

export const { ThemeProvider, useTheme, setTheme, hydrateTheme } = appTheme;
export type Theme = typeof appTheme.$infer.Theme;
```

For an extracted package, users should create the instance in their own app module with their own theme names.

## TanStack Start flow

### 1. Server/router context reads the cookie

```ts
const rawTheme = await getThemeServerFn();
const theme = parseTheme(rawTheme);

return {
  theme,
  // other router context
};
```

### 2. Root document installs the pre-hydration DOM script

```tsx
function RootDocument() {
  const { theme } = Route.useRouteContext();

  return (
    <html suppressHydrationWarning>
      <head>
        <ThemeInitScript theme={theme} />
      </head>
      {/* ... */}
    </html>
  );
}
```

`ThemeInitScript` should be placed in `<head>` when possible. It updates `document.documentElement` before React hydrates, which prevents light/dark flash. It only touches DOM classes/data attributes; it does not and cannot initialize React context or store state.

### 3. React provider owns `useTheme()` state from router context

```tsx
<ThemeProvider theme={context.theme}>{children}</ThemeProvider>
```

`ThemeProvider` initializes React Context state from `context.theme` during its first render. `useTheme()` reads that context directly, so it does not see a module default before the provider value. No `useEffect`, route `beforeLoad`, or router `hydrate` call is required for the initial React theme state.

## UI usage

```ts
const { theme, setTheme } = useTheme();
```

- `theme` is the selected preference, e.g. `light`, `dark`, or `system`.
- `resolvedTheme` is the concrete visual theme, e.g. `light` or `dark`.
- `setTheme(nextTheme)` updates React Context state, applies the selected/resolved classes to `<html>`, and persists the cookie through the configured server function.

## Notes

- This is a source package for TanStack Start/Vite consumers. It intentionally exports `.ts`/`.tsx` source and lets the consuming repo compile it during its own production build. There is no package-level `dist` build step by default.
- `hydrateTheme(theme)` is still exposed for advanced/manual DOM synchronization, but normal app usage should prefer `<ThemeInitScript theme={context.theme}>` plus `<ThemeProvider theme={context.theme}>`.
- `style.colorScheme` is set from the resolved theme when it is `light` or `dark`.
- Components are intentionally not part of the package build. Consumers should build their own UI around `useTheme()`.
