import z from "zod";

/** Theme class token accepted from UI controls and the server cookie. */
export const ThemeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const ThemePreferenceSchema = ThemeSchema;
