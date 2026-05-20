type SupabaseLikeError = {
  code?: string;
  details?: string;
  message?: string;
};

export class DatabaseSetupError extends Error {
  readonly originalMessage?: string;

  constructor(originalMessage?: string) {
    super("Pulse database schema is not installed yet.");
    this.name = "DatabaseSetupError";
    this.originalMessage = originalMessage;
  }
}

export function isMissingSchemaError(error: unknown) {
  const supabaseError = error as SupabaseLikeError;
  const text = [
    supabaseError.code,
    supabaseError.message,
    supabaseError.details,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("pgrst205") ||
    text.includes("schema cache") ||
    text.includes("public.profiles") ||
    text.includes("relation") && text.includes("profiles") && text.includes("does not exist")
  );
}

export function isNotFoundError(error: unknown) {
  const supabaseError = error as SupabaseLikeError;
  const text = [
    supabaseError.code,
    supabaseError.message,
    supabaseError.details,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("pgrst116") ||
    (text.includes("json object requested") && text.includes("0 rows"))
  );
}

export function isDatabaseSetupError(error: unknown) {
  return error instanceof DatabaseSetupError;
}
