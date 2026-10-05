# TanStack Start theme module

This module is a source-distribution theme helper for TanStack Start. It is designed to be built by the consumer app's Vite/TanStack Start pipeline instead of shipping a prebuilt `dist` bundle.

## Core idea

A theme is a CSS class name applied to `<html>`.

The theme controller does **not** resolve `system` into `light` or `dark`. If the current theme is `system`, the document should look like this:

```html
<html class="system" data-theme="system"></html>
```

CSS owns what each class means:

```css
html.light {
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
}

html.system {
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  html.system {
    /* dark tokens for system mode */
  }
}
```

This keeps JavaScript responsible only for state, cookie persistence, and applying the selected class. Visual resolution stays in CSS.

## Tailwind/CSS conditions

The controller exposes `themeConditions` and `createThemeConditions(themes)` so consumers can see which selectors or Tailwind v4 custom variants match the configured themes.

```ts
const appTheme = createTheme({
  defaultTheme: "system",
  themes: ["light", "dark", "system"],
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
  themes: ["light", "dark", "system"],
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

### 2. Root document renders the theme class directly

```tsx
function RootDocument() {
  const { theme } = Route.useRouteContext();

  return (
    <html className={theme} data-theme={theme} suppressHydrationWarning>
      {/* ... */}
    </html>
  );
}
```

### 3. React provider syncs the UI store from router context

```tsx
<ThemeProvider theme={context.theme}>{children}</ThemeProvider>
```

This avoids the older singleton-store-first flow where route hydration had to push cookie state into a global store manually. The router context is the initial source of truth, and the provider bridges it into `useTheme()` for UI controls.

`ThemeProvider` syncs with an isomorphic layout effect and calls `hydrateTheme()`, not `setTheme()`. That keeps server/router state from writing back to the cookie and prevents the client singleton store from becoming the initial source of truth.

## UI usage

```ts
const { theme, setTheme } = useTheme();
```

- `theme` is the selected class name, e.g. `light`, `dark`, or `system`.
- `setTheme(nextTheme)` updates the store, applies the class to `<html>`, and persists the cookie through the configured server function.

## Notes

- This is a source package for TanStack Start/Vite consumers. It intentionally exports `.ts`/`.tsx` source and lets the consuming repo compile it during its own production build. There is no package-level `dist` build step by default.
- `hydrateTheme(theme)` is still exposed for advanced lifecycle/manual sync, but normal app usage should prefer `<ThemeProvider theme={context.theme}>`.
- `style.colorScheme` is set only for `light` and `dark`. Other theme names leave color-scheme to CSS.
- Components are intentionally not part of the package build. Consumers should build their own UI around `useTheme()`.
