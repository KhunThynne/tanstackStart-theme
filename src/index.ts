import { createStore, useSelector } from "@tanstack/react-store";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";

import { setThemeServerFn } from "./server";

export type InferTheme<TController> = TController extends {
  themes: readonly (infer TTheme)[];
}
  ? TTheme
  : never;

export type ThemeTuple = readonly [string, ...string[]];

export interface CreateThemeOptions<TThemes extends ThemeTuple> {
  /** User-selectable theme class names. */
  themes: TThemes;
  /** Initial theme used before the server/router context reaches the provider. */
  defaultTheme: TThemes[number];
  /** Optional persistence hook for user actions. Do not call during hydration. */
  persistTheme?: (theme: TThemes[number]) => void | Promise<void>;
}

export interface ThemeStoreState<TTheme extends string> {
  theme: TTheme;
}

export interface ThemeController<TTheme extends string> {
  /** Type-only inference helpers for consumers. */
  $infer: {
    Theme: TTheme;
  };
  /** Applies a theme class and related metadata to `document.documentElement`. */
  applyTheme: (theme: TTheme) => void;
  /** Utility for generating CSS/Tailwind condition helpers from theme names. */
  createThemeConditions: typeof createThemeConditions<TTheme>;
  /** Theme used when persisted input is missing or invalid. */
  defaultTheme: TTheme;
  /** Syncs a server/router theme into the store and DOM without persistence. */
  hydrateTheme: (theme: TTheme) => void;
  /** Runtime guard for checking whether a string belongs to the configured themes. */
  isTheme: (value: string) => value is TTheme;
  /** Normalizes unknown/raw input into a configured theme, falling back to `defaultTheme`. */
  parseTheme: (value: unknown) => TTheme;
  /** User action helper: update store/DOM, then persist through TanStack Start. */
  setTheme: (theme: TTheme) => void;
  /** Generated selectors/custom-variant snippets for the configured themes. */
  themeConditions: Array<ThemeCondition<TTheme>>;
  /** Underlying TanStack Store instance. Prefer `useTheme()` in React UI. */
  themeStore: ReturnType<typeof createStore<ThemeStoreState<TTheme>>>;
  /** Configured theme class names. */
  themes: readonly TTheme[];
  /** React bridge from TanStack Start router context into the theme store. */
  ThemeProvider: (props: PropsWithChildren<{ theme: TTheme }>) => ReactNode;
  /** React hook for reading and setting the current theme. */
  useTheme: () => { setTheme: (theme: TTheme) => void; theme: TTheme };
}

export interface ThemeCondition<TTheme extends string> {
  /** Theme class / token name. */
  theme: TTheme;
  /** CSS selector for the theme root and descendants. */
  selector: string;
  /** Tailwind v4 custom-variant declaration for this theme. */
  variant: string;
  /** Attribute selector variant if consumers prefer data attributes over classes. */
  dataVariant: string;
}

const useIsomorphicLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

/** Creates CSS/Tailwind condition helpers from the configured theme names. */
export function createThemeConditions<const TTheme extends string>(
  themes: readonly TTheme[]
): Array<ThemeCondition<TTheme>> {
  return themes.map((theme) => ({
    theme,
    selector: `&:where(.${theme}, .${theme} *)`,
    variant: `@custom-variant theme-${theme} (&:where(.${theme}, .${theme} *));`,
    dataVariant: `@custom-variant theme-${theme} (&:where([data-theme="${theme}"], [data-theme="${theme}"] *));`,
  }));
}

/**
 * Creates a TanStack Start theme controller.
 *
 * A theme is treated as a CSS class token and is applied directly to
 * `document.documentElement`. The controller does not resolve `system` into
 * `light`/`dark`; CSS and Tailwind variants own what each theme class means.
 *
 * @returns A typed controller containing:
 * - `ThemeProvider` — React bridge from TanStack Start router context into the theme store.
 * - `useTheme` — hook returning `{ theme, setTheme }` for UI controls.
 * - `setTheme` — user action helper that applies the class and persists through TanStack Start.
 * - `hydrateTheme` — non-persisting sync helper for advanced router/lifecycle usage.
 * - `parseTheme` — normalizes raw cookie/server values back into the configured theme union.
 * - `isTheme` — runtime type guard for configured theme names.
 * - `themeConditions` — generated CSS/Tailwind selector snippets for every theme.
 * - `applyTheme` — low-level DOM applier for `<html class="theme" data-theme="theme">`.
 * - `themeStore` — underlying TanStack Store instance.
 * - `themes` and `defaultTheme` — the configured theme tuple and fallback value.
 * - `$infer.Theme` — type-only helper for extracting the configured theme union.
 *
 * `ThemeProvider` syncs server/router context with `hydrateTheme()` from an
 * isomorphic layout effect. It never calls `setTheme()` for incoming context,
 * so server state does not write back to the cookie and the client store does
 * not become the initial source of truth.
 */
export function createTheme<const TThemes extends ThemeTuple>({
  defaultTheme,
  persistTheme,
  themes,
}: CreateThemeOptions<TThemes>): ThemeController<TThemes[number]> {
  type TTheme = TThemes[number];

  const themeStore = createStore<ThemeStoreState<TTheme>>({
    theme: defaultTheme,
  });
  const themeConditions = createThemeConditions(themes);

  function isTheme(value: string): value is TTheme {
    return (themes as readonly string[]).includes(value);
  }

  function parseTheme(value: unknown): TTheme {
    return typeof value === "string" && isTheme(value) ? value : defaultTheme;
  }

  function applyTheme(theme: TTheme) {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.remove(...(themes as unknown as string[]));

    const previousTheme = root.getAttribute("data-applied-theme");
    if (previousTheme) {
      root.classList.remove(previousTheme);
    }

    root.classList.add(theme);
    root.dataset.theme = theme;
    root.setAttribute("data-applied-theme", theme);

    if (theme === "dark" || theme === "light") {
      root.style.colorScheme = theme;
    } else {
      root.style.colorScheme = "";
    }
  }

  /** Sync server/router theme into store and DOM without persistence. */
  function hydrateTheme(theme: TTheme) {
    if (themeStore.state.theme !== theme) {
      themeStore.setState((prev) => ({
        ...prev,
        theme,
      }));
    }

    applyTheme(theme);
  }

  /** User action: update store/DOM, then persist (e.g. write to cookie). */
  function setTheme(theme: TTheme) {
    hydrateTheme(theme);

    if (typeof document !== "undefined") {
      if (persistTheme) {
        void persistTheme(theme);
      } else {
        void setThemeServerFn({ data: theme });
      }
    }
  }

  function ThemeProvider({
    children,
    theme,
  }: PropsWithChildren<{ theme: TTheme }>) {
    if (themeStore.state.theme !== theme) {
      hydrateTheme(theme);
    }

    useIsomorphicLayoutEffect(() => {
      if (themeStore.state.theme !== theme) {
        hydrateTheme(theme);
      }
    }, [theme]);

    return children;
  }
  function useTheme() {
    const theme = useSelector(themeStore, (state) => state.theme);

    return { theme, setTheme };
  }

  return {
    /** Type-only inference helpers for consumers. */
    $infer: {} as {
      Theme: TTheme;
    },
    /** Applies a theme class and related metadata to `document.documentElement`. */
    applyTheme,
    /** Utility for generating CSS/Tailwind condition helpers from theme names. */
    createThemeConditions,
    /** Theme used when persisted input is missing or invalid. */
    defaultTheme,
    /** Syncs a server/router theme into store and DOM without persistence. */
    hydrateTheme,
    /** Runtime guard for checking whether a string belongs to the configured themes. */
    isTheme,
    /** Normalizes unknown/raw input into a configured theme, falling back to `defaultTheme`. */
    parseTheme,
    /** User action helper: update store/DOM, then persist through TanStack Start. */
    setTheme,
    /** Generated selectors/custom-variant snippets for the configured themes. */
    themeConditions,
    /** Underlying TanStack Store instance. Prefer `useTheme()` in React UI. */
    themeStore,
    /** Configured theme class names. */
    themes,
    /** React bridge from TanStack Start router context into the theme store. */
    ThemeProvider,
    /** React hook for reading and setting the current theme. */
    useTheme,
  };
}
