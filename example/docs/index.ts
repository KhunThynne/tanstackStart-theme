import { createTheme } from ".";

export * from "./components";
export { createTheme } from ".;
export type { CreateThemeOptions, InferTheme } from "./index.ts";
export type { ThemeStoreState, ThemePreference } from "./type";

const appTheme = createTheme({
  defaultTheme: "system",
  themes: ["light", "dark", "system"],
});

export const {
  $infer,
  applyTheme,
  defaultTheme,
  hydrateTheme,
  isTheme,
  parseTheme,
  setTheme,
  themeConditions,
  themeStore,
  themes,
  useTheme,
  ThemeProvider,
} = appTheme;

export type Theme = typeof appTheme.$infer.Theme;
