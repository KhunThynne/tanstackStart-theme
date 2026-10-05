import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

import { ThemeSchema } from "./schema";
import type { Theme } from "./type";

const storageKey = "_preferred-theme";

/** Reads the persisted theme preference from the request cookie. */
export const getThemeServerFn = createServerFn().handler(
  () => (getCookie(storageKey) || "system") as Theme
);

/** Persists a user-selected theme preference to the response cookie. */
export const setThemeServerFn = createServerFn({ method: "POST" })
  .validator(ThemeSchema)
  .handler(({ data }) => setCookie(storageKey, data));

export const getThemePreferenceServerFn = getThemeServerFn;
export const setThemePreferenceServerFn = setThemeServerFn;
