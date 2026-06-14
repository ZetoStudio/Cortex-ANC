/** Shared auth env flags (safe to import from server components). */
export const githubAuthEnabled = Boolean(
  process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim(),
);

export const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
);

export const socialAuthEnabled = githubAuthEnabled || googleAuthEnabled;
