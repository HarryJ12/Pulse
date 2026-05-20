import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/actions";
import type { Profile } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/pulse/sidebar-nav";

type AppShellProps = {
  profile: Profile;
  children: React.ReactNode;
};

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:flex lg:flex-col">
        <Link href="/" className="pulse-focus mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(16,194,129,0.38)] bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent-strong)]">
            P
          </div>
          <div>
            <p className="text-sm font-semibold">Pulse</p>
            <p className="text-xs text-[var(--text-muted)]">
              Turn conversations into execution.
            </p>
          </div>
        </Link>

        <SidebarNav currentUserId={profile.id} />

        <div className="mt-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="size-9 rounded-[var(--radius-md)] object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-xs font-semibold">
                {getInitials(profile.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile.name ?? "Pulse member"}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {profile.github_username
                  ? `@${profile.github_username}`
                  : profile.email ?? "Signed in"}
              </p>
            </div>
          </div>
          <form action={signOutAction} className="mt-3">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(7,8,10,0.88)] px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">
            Pulse
          </Link>
          <Link
            href="/threads/new"
            className="text-sm font-medium text-[var(--accent-strong)]"
          >
            New thread
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-max">
            <SidebarNav currentUserId={profile.id} />
          </div>
        </div>
      </header>

      <main className="lg:pl-68">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
