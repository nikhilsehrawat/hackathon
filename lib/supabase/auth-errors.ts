/**
 * Identifies the normal no-cookie result from Supabase auth.getUser().
 */
export function isMissingAuthSession(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "name" in error && error.name === "AuthSessionMissingError";
}
