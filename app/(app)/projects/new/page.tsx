import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionTextarea } from "@/components/pulse/mention-textarea";
import { createProjectAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getMentionTargets, getProfiles } from "@/lib/queries";

export default async function NewProjectPage() {
  const { supabase, user } = await requireUser();
  const [profiles, mentionTargets] = await Promise.all([
    getProfiles(supabase),
    getMentionTargets(supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-semibold">Create project</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add a project room for shared context, related threads, and current
          cohort activity.
        </p>
      </header>

      <form
        action={createProjectAction}
        className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Project name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <MentionTextarea
            id="description"
            name="description"
            required
            rows={7}
            targets={mentionTargets}
            placeholder="What are you building, who is it for, and what context should the cohort know?"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="repo_url">Repository link</Label>
            <Input
              id="repo_url"
              name="repo_url"
              type="url"
              placeholder="Add repository link"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="live_url">Live URL</Label>
            <Input id="live_url" name="live_url" type="url" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loom_url">Loom URL</Label>
            <Input id="loom_url" name="loom_url" type="url" placeholder="https://www.loom.com/..." />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[var(--text-primary)]">
            Members
          </legend>
          <div className="grid max-h-64 gap-2 overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 md:grid-cols-2">
            {profiles.map((profile) => (
              <label
                key={profile.id}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              >
                <input
                  type="checkbox"
                  name="member_ids"
                  value={profile.id}
                  defaultChecked={profile.id === user.id}
                  disabled={profile.id === user.id}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="min-w-0 truncate">
                  {profile.name ?? profile.github_username ?? profile.email ?? "Member"}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            The creator is always added. Permissions stay intentionally simple
            for this MVP.
          </p>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
          <Button asChild variant="ghost">
            <Link href="/projects">Cancel</Link>
          </Button>
          <SubmitButton variant="primary" pendingLabel="Creating project">
            Create project
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
