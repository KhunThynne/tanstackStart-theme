import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

import { ThemeSchema } from "./schema";
import type { Theme } from "./type";
import z from "zod";

const storageKey = "_preferred-theme";

/** Reads the persisted theme preference from the request cookie. */
export const getThemeServerFn = createServerFn().handler(
  () => (getCookie(storageKey) || "system") as Theme
);

const SetThemeInputSchema = z.object({
  storageKey: z.string().optional().default(storageKey),
  value: ThemeSchema,
});

/** Persists a user-selected theme preference to the response cookie. */
export const setThemeServerFn = createServerFn({ method: "POST" })
  .validator(SetThemeInputSchema)
  .handler(({ data }) => setCookie(data.storageKey, data.value));

export const getThemePreferenceServerFn = getThemeServerFn;
export const setThemePreferenceServerFn = setThemeServerFn;
