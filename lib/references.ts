import type { MentionKind } from "@/lib/types";

const referencePattern = /\[\[(person|project|thread):([0-9a-f-]{36})\|([^\]]+)\]\]/gi;

export function formatReferenceToken({
  kind,
  id,
  label,
}: {
  kind: MentionKind;
  id: string;
  label: string;
}) {
  const cleanLabel = label.replace(/[\[\]\n\r]/g, " ").replace(/\s+/g, " ").trim();
  return `[[${kind}:${id}|${cleanLabel}]]`;
}

export function referenceHref(kind: MentionKind, id: string) {
  if (kind === "project") return `/projects/${id}`;
  if (kind === "thread") return `/threads/${id}`;
  return `/people/${id}`;
}

export function stripReferenceTokens(value: string) {
  return value.replace(referencePattern, (_match, _kind, _id, label: string) => label);
}

export function parseReferenceTokens(value: string) {
  return Array.from(value.matchAll(referencePattern)).map((match) => ({
    kind: match[1] as MentionKind,
    id: match[2],
    label: match[3],
    index: match.index ?? 0,
    token: match[0],
  }));
}
