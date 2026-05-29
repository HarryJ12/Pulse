export const cohortAccessCookieName = "pulse_cohort_access";

export function getCohortAccessPassword() {
  return process.env.PULSE_ACCESS_PASSWORD?.trim() ?? "";
}

export function isCohortAccessEnabled() {
  return getCohortAccessPassword().length > 0;
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function getCohortAccessToken(
  password = getCohortAccessPassword(),
) {
  const encoded = new TextEncoder().encode(`pulse-cohort-access:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
