import Link from "next/link";
import { GitBranch, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { formatDate, getInitials } from "@/lib/utils";

export default async function ProfilePage() {
  const { profile } = await requireUser();

  return (
    <div className="space-y-6">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Your GitHub identity powers attribution, mentions, and cohort
          discovery across Pulse.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Current user</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-16 rounded-[var(--radius-lg)] object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-muted)] text-lg font-semibold">
                  {getInitials(profile.name)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">
                  {profile.name ?? "Pulse member"}
                </h2>
                <p className="truncate text-sm text-[var(--text-muted)]">
                  {profile.github_username
                    ? `@${profile.github_username}`
                    : "GitHub profile"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {profile.github_url ? (
                <Button asChild variant="secondary" className="w-full justify-start">
                  <a href={profile.github_url} target="_blank" rel="noreferrer">
                    <GitBranch aria-hidden="true" />
                    Open GitHub
                  </a>
                </Button>
              ) : null}
              {profile.email ? (
                <Button asChild variant="ghost" className="w-full justify-start">
                  <a href={`mailto:${profile.email}`}>
                    <Mail aria-hidden="true" />
                    {profile.email}
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <dt className="text-[var(--text-muted)]">Name</dt>
                <dd className="mt-1">{profile.name ?? "Not provided"}</dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <dt className="text-[var(--text-muted)]">Email</dt>
                <dd className="mt-1">{profile.email ?? "Not available"}</dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <dt className="text-[var(--text-muted)]">GitHub username</dt>
                <dd className="mt-1">{profile.github_username ?? "Not available"}</dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <dt className="text-[var(--text-muted)]">Created</dt>
                <dd className="mt-1">{formatDate(profile.created_at)}</dd>
              </div>
            </dl>

            <Button asChild variant="secondary" className="mt-6">
              <Link href="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
