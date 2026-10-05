import { createTheme } from ".";

export * from "./components";
export { createTheme } from "../../src/index.ts";

const appTheme = createTheme({
  defaultTheme: "system",
  themes: ["light", "dark"],
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
