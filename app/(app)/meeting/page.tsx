import type { LucideIcon } from "lucide-react";
import { ExternalLink, FileText, MessageCircle, Video } from "lucide-react";

import { Button } from "@/components/ui/button";

const ZOOM_URL =
  "https://us04web.zoom.us/j/4052987528?pwd=eh5svfPRHaaZ6EUYa5ASnXCACkONJm.1";
const DISCORD_URL = "https://discord.gg/7jBbJ2z5h";
const GRANOLA_URL = "https://www.granola.ai/";

type LinkCardProps = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
};

function LinkCard({ title, description, href, action, icon: Icon }: LinkCardProps) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(16,194,129,0.24)] bg-[var(--accent-muted)] text-[var(--accent)]">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" className="mt-5 w-full justify-between">
        <a href={href} target="_blank" rel="noreferrer">
          {action}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    </article>
  );
}

export default function MeetingPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-semibold">Call room</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Quick links for cohort calls, live voice, and optional meeting notes.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[rgba(16,194,129,0.24)] bg-[var(--accent-muted)] text-[var(--accent)]">
              <FileText className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-[var(--accent-strong)]">
                Optional meeting notes
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Granola</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Granola is a Mac-only meeting notes app that transcribes calls
                and helps turn transcripts into useful notes and summaries. It
                is useful when you want a cleaner record of what was discussed.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="mt-6">
            <a href={GRANOLA_URL} target="_blank" rel="noreferrer">
              Open Granola
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </article>

        <div className="grid gap-4">
          <LinkCard
            title="Zoom"
            description="Use this room when the cohort needs a quick video call."
            href={ZOOM_URL}
            action="Open Zoom"
            icon={Video}
          />
          <LinkCard
            title="Discord"
            description="Use the server for live voice, quick coordination, or anything that does not need to become a structured Pulse thread."
            href={DISCORD_URL}
            action="Open Discord"
            icon={MessageCircle}
          />
        </div>
      </section>
    </div>
  );
}
