import Link from "next/link";
import type React from "react";

import { parseReferenceTokens, referenceHref } from "@/lib/references";

type ReferenceTextProps = {
  value: string;
};

export function ReferenceText({ value }: ReferenceTextProps) {
  const references = parseReferenceTokens(value);

  if (!references.length) return <>{value}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  references.forEach((reference, index) => {
    if (reference.index > cursor) {
      nodes.push(value.slice(cursor, reference.index));
    }

    nodes.push(
      <Link
        key={`${reference.token}-${index}`}
        href={referenceHref(reference.kind, reference.id)}
        className="pulse-focus inline-flex max-w-full items-baseline rounded-[var(--radius-sm)] border border-[rgba(16,194,129,0.28)] bg-[var(--accent-muted)] px-1.5 py-0.5 text-[0.92em] font-medium text-[var(--accent-strong)] transition-colors hover:border-[rgba(16,194,129,0.5)] hover:text-[var(--accent)]"
      >
        {reference.label}
      </Link>,
    );

    cursor = reference.index + reference.token.length;
  });

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }

  return <>{nodes}</>;
}
