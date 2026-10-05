import { createStore, useSelector } from "@tanstack/react-store";
import type { PropsWithChildren, ReactNode } from "react";
import { createElement, useEffect, useLayoutEffect } from "react";

import { setThemeServerFn } from "./server";

export type InferTheme<TController> = TController extends {
  $infer: { Theme: infer TTheme };
}
  ? TTheme
  : never;

export type ThemeTuple = readonly [string, ...string[]];

export type SelectableTheme<
  TThemes extends ThemeTuple,
  TSystemPreference extends string,
> = TThemes[number] | TSystemPreference;

export interface CreateThemeOptions<
  TThemes extends ThemeTuple,
  TSystemPreference extends string = "system",
> {
  /** Real CSS theme classes (for example: ['light', 'dark']). */
  themes: TThemes;
  /** Preference key that follows the user agent/device color scheme. */
  systemPreference?: TSystemPreference;
  /** Initial selected preference used before server/router context reaches the provider. */
  defaultTheme: NoInfer<SelectableTheme<TThemes, TSystemPreference>>;
  /** Optional cookie/localStorage key used by the default TanStack Start cookie persistence. */
  storageKey?: string;
  /** Optional persistence hook for user actions. Do not call during hydration. */
  persistTheme?: (
    theme: SelectableTheme<TThemes, TSystemPreference>
  ) => void | Promise<void>;
}

export interface ThemeStoreState<
  TSelectableTheme extends string,
  TResolvedTheme extends string,
> {
  /** User-selected preference (can be the system preference key). */
  theme: TSelectableTheme;
  /** Actual CSS theme class currently applied for Tailwind/shadcn variants. */
  resolvedTheme: TResolvedTheme;
}

export interface ThemeController<
  TThemes extends ThemeTuple,
  TSystemPreference extends string = "system",
> {
  $infer: {
    Theme: SelectableTheme<TThemes, TSystemPreference>;
    ResolvedTheme: TThemes[number];
    SystemPreference: TSystemPreference;
  };
  applyTheme: (theme: SelectableTheme<TThemes, TSystemPreference>) => void;
  createThemeConditions: (
    themes: readonly TThemes[number][]
  ) => Array<ThemeCondition<TThemes[number]>>;
  defaultTheme: SelectableTheme<TThemes, TSystemPreference>;
  getThemeInitScript: (
    theme: SelectableTheme<TThemes, TSystemPreference>
  ) => string;
  hydrateTheme: (theme: SelectableTheme<TThemes, TSystemPreference>) => void;
  isTheme: (
    value: string
  ) => value is SelectableTheme<TThemes, TSystemPreference>;
  isResolvedTheme: (value: string) => value is TThemes[number];
  parseTheme: (value: unknown) => SelectableTheme<TThemes, TSystemPreference>;
  resolveTheme: (
    theme: SelectableTheme<TThemes, TSystemPreference>
  ) => TThemes[number];
  setTheme: (theme: SelectableTheme<TThemes, TSystemPreference>) => void;
  systemPreference: TSystemPreference;
  themeConditions: Array<ThemeCondition<TThemes[number]>>;
  themeStore: ReturnType<
    typeof createStore<
      ThemeStoreState<
        SelectableTheme<TThemes, TSystemPreference>,
        TThemes[number]
      >
    >
  >;
  themes: TThemes;
  ThemeInitScript: (props: {
    nonce?: string;
    theme: SelectableTheme<TThemes, TSystemPreference>;
  }) => ReactNode;
  ThemeProvider: (
    props: PropsWithChildren<{
      syncSystemPreference?: boolean;
      theme: SelectableTheme<TThemes, TSystemPreference>;
    }>
  ) => ReactNode;
  useTheme: () => {
    resolvedTheme: TThemes[number];
    setTheme: (theme: SelectableTheme<TThemes, TSystemPreference>) => void;
    theme: SelectableTheme<TThemes, TSystemPreference>;
  };
}

export interface ThemeCondition<TThemeClass extends string> {
  theme: TThemeClass;
  selector: string;
  variant: string;
  dataVariant: string;
}

const DEFAULT_STORAGE_KEY = "_preferred-theme";

const useIsomorphicLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

export function createThemeConditions<const TTheme extends string>(
  themes: readonly TTheme[]
): Array<ThemeCondition<TTheme>> {
  return themes.map((theme) => ({
    theme,
    selector: `&:where(.${theme}, .${theme} *)`,
    variant: `@custom-variant theme-${theme} (&:where(.${theme}, .${theme} *));`,
    dataVariant: `@custom-variant theme-${theme} (&:where([data-resolved-theme="${theme}"], [data-resolved-theme="${theme}"] *));`,
  }));
}

export function createTheme<
  const TThemes extends ThemeTuple,
  const TSystemPreference extends string = "system",
>({
  defaultTheme,
  persistTheme,
  storageKey = DEFAULT_STORAGE_KEY,
  systemPreference = "system" as TSystemPreference,
  themes,
}: CreateThemeOptions<TThemes, TSystemPreference>): ThemeController<
  TThemes,
  TSystemPreference
> {
  type TResolvedTheme = TThemes[number];
  type TSelectableTheme = SelectableTheme<TThemes, TSystemPreference>;

  const allThemeValues = [
    ...themes,
    systemPreference,
  ] as readonly TSelectableTheme[];
  const defaultResolvedTheme = resolveThemeValue(defaultTheme);
  const themeStore = createStore<
    ThemeStoreState<TSelectableTheme, TResolvedTheme>
  >({
    resolvedTheme: defaultResolvedTheme,
    theme: defaultTheme,
  });
  const themeConditions = createThemeConditions(themes);

  function isResolvedTheme(value: string): value is TResolvedTheme {
    return (themes as readonly string[]).includes(value);
  }

  function isTheme(value: string): value is TSelectableTheme {
    return isResolvedTheme(value) || value === systemPreference;
  }

  function parseTheme(value: unknown): TSelectableTheme {
    return typeof value === "string" && isTheme(value) ? value : defaultTheme;
  }

  function getBrowserResolvedTheme(): TResolvedTheme {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;

      if (prefersDark && isResolvedTheme("dark")) {
        return "dark" as TResolvedTheme;
      }

      if (!prefersDark && isResolvedTheme("light")) {
        return "light" as TResolvedTheme;
      }
    }

    return themes[0];
  }

  function resolveThemeValue(theme: TSelectableTheme): TResolvedTheme {
    if (theme === systemPreference) {
      return getBrowserResolvedTheme();
    }

    return isResolvedTheme(theme) ? theme : themes[0];
  }

  function resolveTheme(theme: TSelectableTheme): TResolvedTheme {
    return resolveThemeValue(parseTheme(theme));
  }

  function applyTheme(theme: TSelectableTheme) {
    if (typeof document === "undefined") return;

    const selectedTheme = parseTheme(theme);
    const resolvedTheme = resolveTheme(selectedTheme);
    const root = document.documentElement;

    root.classList.remove(...(allThemeValues as readonly string[]));
    root.classList.remove(...(themes as readonly string[]));

    root.classList.add(selectedTheme);
    root.classList.add(resolvedTheme);
    root.dataset.theme = selectedTheme;
    root.dataset.resolvedTheme = resolvedTheme;
    root.setAttribute("data-applied-theme", selectedTheme);

    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      root.style.colorScheme = resolvedTheme;
    } else {
      root.style.colorScheme = "";
    }
  }

  function hydrateTheme(theme: TSelectableTheme) {
    const selectedTheme = parseTheme(theme);
    const resolvedTheme = resolveTheme(selectedTheme);

    if (
      themeStore.state.theme !== selectedTheme ||
      themeStore.state.resolvedTheme !== resolvedTheme
    ) {
      themeStore.setState((prev) => ({
        ...prev,
        resolvedTheme,
        theme: selectedTheme,
      }));
    }

    applyTheme(selectedTheme);
  }

  function setTheme(theme: TSelectableTheme) {
    const selectedTheme = parseTheme(theme);
    hydrateTheme(selectedTheme);

    if (typeof document !== "undefined") {
      if (persistTheme) {
        void persistTheme(selectedTheme);
      } else {
        void setThemeServerFn({
          data: { storageKey, value: selectedTheme },
        });
      }
    }
  }

  function getThemeInitScript(theme: TSelectableTheme): string {
    const serializedTheme = JSON.stringify(parseTheme(theme));
    const serializedDefaultTheme = JSON.stringify(defaultTheme);
    const serializedThemes = JSON.stringify(themes);
    const serializedAllThemeValues = JSON.stringify(allThemeValues);
    const serializedSystemPreference = JSON.stringify(systemPreference);
    const serializedStorageKey = JSON.stringify(storageKey);

    return `;(() => {
  try {
    var selectedTheme = ${serializedTheme};
    var defaultTheme = ${serializedDefaultTheme};
    var themes = ${serializedThemes};
    var allThemeValues = ${serializedAllThemeValues};
    var systemPreference = ${serializedSystemPreference};
    var storageKey = ${serializedStorageKey};
    var root = document.documentElement;

    function includes(list, value) {
      return list.indexOf(value) !== -1;
    }

    function parseTheme(value) {
      return typeof value === "string" && includes(allThemeValues, value)
        ? value
        : defaultTheme;
    }

    function resolveTheme(value) {
      if (value === systemPreference) {
        if (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches &&
          includes(themes, "dark")
        ) {
          return "dark";
        }

        return includes(themes, "light") ? "light" : themes[0];
      }

      return includes(themes, value) ? value : themes[0];
    }

    selectedTheme = parseTheme(selectedTheme);
    var resolvedTheme = resolveTheme(selectedTheme);

    for (var i = 0; i < allThemeValues.length; i++) {
      root.classList.remove(allThemeValues[i]);
    }

    for (var j = 0; j < themes.length; j++) {
      root.classList.remove(themes[j]);
    }

    root.classList.add(selectedTheme);
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", selectedTheme);
    root.setAttribute("data-resolved-theme", resolvedTheme);
    root.setAttribute("data-theme-storage-key", storageKey);
    root.setAttribute("data-applied-theme", selectedTheme);

    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      root.style.colorScheme = resolvedTheme;
    } else {
      root.style.colorScheme = "";
    }
  } catch (_) {}
})();`;
  }

  function ThemeInitScript({
    nonce,
    theme,
  }: {
    nonce?: string;
    theme: TSelectableTheme;
  }) {
    return createElement("script", {
      dangerouslySetInnerHTML: { __html: getThemeInitScript(theme) },
      nonce,
      suppressHydrationWarning: true,
    });
  }

  function ThemeProvider({
    children,
    syncSystemPreference = true,
    theme,
  }: PropsWithChildren<{
    syncSystemPreference?: boolean;
    theme: TSelectableTheme;
  }>) {
    useIsomorphicLayoutEffect(() => {
      hydrateTheme(theme);
    }, [theme]);

    useEffect(() => {
      if (
        !syncSystemPreference ||
        themeStore.state.theme !== systemPreference
      ) {
        return;
      }

      const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
      if (!mediaQuery) return;

      const handleChange = () => {
        if (themeStore.state.theme === systemPreference) {
          hydrateTheme(systemPreference);
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [syncSystemPreference, theme]);

    return children;
  }

  function useTheme() {
    const theme = useSelector(themeStore, (state) => state.theme);
    const resolvedTheme = useSelector(
      themeStore,
      (state) => state.resolvedTheme
    );

    return { resolvedTheme, setTheme, theme };
  }

  return {
    $infer: {} as {
      ResolvedTheme: TResolvedTheme;
      SystemPreference: TSystemPreference;
      Theme: TSelectableTheme;
    },
    applyTheme,
    createThemeConditions,
    defaultTheme,
    getThemeInitScript,
    hydrateTheme,
    isResolvedTheme,
    isTheme,
    parseTheme,
    resolveTheme,
    setTheme,
    systemPreference,
    themeConditions,
    themeStore,
    themes,
    ThemeInitScript,
    ThemeProvider,
    useTheme,
  };
}
