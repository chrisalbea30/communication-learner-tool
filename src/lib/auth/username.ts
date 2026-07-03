/**
 * Username + password auth helpers.
 *
 * Supabase Auth is email-based. To offer a username-only experience we map a
 * username deterministically to an internal email address that is never sent
 * to. `auth.uid()` (and therefore row-level security) works exactly as normal.
 */

const USERNAME_RE = /^[a-z0-9_.]+$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const PASSWORD_MIN = 8;

const AUTH_EMAIL_DOMAIN =
  process.env.AUTH_EMAIL_DOMAIN ?? "users.english-learner.app";

/** Lower-cases and trims a username for storage / lookup. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Deterministic internal email for a normalized username. */
export function usernameToEmail(normalized: string): string {
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

export type Validation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateUsername(raw: string): Validation {
  const value = normalizeUsername(raw ?? "");
  if (value.length < USERNAME_MIN) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN} characters.` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, error: `Username must be at most ${USERNAME_MAX} characters.` };
  }
  if (!USERNAME_RE.test(value)) {
    return {
      ok: false,
      error: "Username can only contain letters, numbers, underscores and dots.",
    };
  }
  return { ok: true, value };
}

export function validatePassword(raw: string): Validation {
  const value = raw ?? "";
  if (value.length < PASSWORD_MIN) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  return { ok: true, value };
}
