import type z from "zod";

import type { ThemeStoreState as GenericThemeStoreState } from ".";
import type { ThemeSchema } from "./schema";

/** User-selected theme preference persisted in the theme cookie. */
export type Theme = z.infer<typeof ThemeSchema>;

export type ThemePreference = Theme;

export type ThemeStoreState = GenericThemeStoreState<Theme, Theme>;

export type InferTheme<TController> = TController extends {
  themes: readonly (infer TTheme)[];
}
  ? TTheme
  : never;
