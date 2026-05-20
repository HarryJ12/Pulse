import { createThreadAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getMentionTargets, getProjects } from "@/lib/queries";
import { THREAD_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionTextarea } from "@/components/pulse/mention-textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import Link from "next/link";

type NewThreadPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewThreadPage({ searchParams }: NewThreadPageProps) {
  const params = (await searchParams) ?? {};
  const defaultProjectId = valueOf(params.project_id);
  const { supabase } = await requireUser();
  const [projects, mentionTargets] = await Promise.all([
    getProjects(supabase),
    getMentionTargets(supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-semibold">Create thread</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Start a structured discussion that can later become a clean AI prompt
          or thread summary.
        </p>
      </header>

      <form action={createThreadAction} className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="What needs attention?" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              required
              className="pulse-focus h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
            >
              {THREAD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id">Project</Label>
            <select
              id="project_id"
              name="project_id"
              defaultValue={defaultProjectId ?? ""}
              className="pulse-focus h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="auth, supabase, ui" />
          <p className="text-xs text-[var(--text-muted)]">
            Separate tags with commas. Keep them practical for filtering.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <MentionTextarea
            id="body"
            name="body"
            required
            rows={10}
            targets={mentionTargets}
            placeholder="Describe the context, what you need, constraints, and what has already been tried."
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
          <Button asChild variant="ghost">
            <Link href="/threads">Cancel</Link>
          </Button>
          <SubmitButton variant="primary" pendingLabel="Creating thread">
            Create thread
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
